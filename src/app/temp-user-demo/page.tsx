"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, Trash2, Clock, Mail, Key } from 'lucide-react';

interface TempUser {
  id: string;
  username: string;
  email: string;
  password: string;
  expiresAt: string;
  purpose?: string;
}

export default function TempUserDemoPage() {
  const [expiresIn, setExpiresIn] = useState<number>(24);
  const [purpose, setPurpose] = useState<string>('testing');
  const [isCreating, setIsCreating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [tempUsers, setTempUsers] = useState<TempUser[]>([]);

  const createTempUser = async () => {
    try {
      setIsCreating(true);
      
      const response = await fetch('/api/create-temp-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiresIn,
          purpose
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: data.message,
        });
        
        // Add to local state
        setTempUsers(prev => [data.tempUser, ...prev]);
        
        // Clear form
        setPurpose('testing');
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to create temporary user',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating temp user:', error);
      toast({
        title: "Error",
        description: "Failed to create temporary user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const cleanupTempUsers = async () => {
    try {
      setIsCleaning(true);
      
      const response = await fetch('/api/cleanup-temp-users', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Cleanup Complete",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to cleanup temporary users',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cleaning up temp users:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup temporary users",
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatExpiry = (expiryString: string) => {
    const expiry = new Date(expiryString);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) {
      return 'Expired';
    } else if (diffHours < 24) {
      return `${diffHours}h remaining`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `${diffDays}d remaining`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Temporary User Demo
          </h1>
          <p className="text-gray-600">
            Create temporary users that automatically delete after a specified time
          </p>
        </div>

        {/* Create Temp User Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create Temporary User
            </CardTitle>
            <CardDescription>
              Generate a temporary user account with auto-generated credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiresIn">Expires In (hours)</Label>
                <Input
                  id="expiresIn"
                  type="number"
                  min="1"
                  max="168"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(Number(e.target.value))}
                  placeholder="24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: 168 hours (7 days)
                </p>
              </div>
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="testing, demo, etc."
                />
              </div>
            </div>
            
            <Button 
              onClick={createTempUser} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Temporary User
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Cleanup Button */}
        <div className="text-center mb-8">
          <Button 
            onClick={cleanupTempUsers} 
            disabled={isCleaning}
            variant="outline"
            className="mb-4"
          >
            {isCleaning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Expired Users
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500">
            Manually trigger cleanup of expired temporary users
          </p>
        </div>

        {/* Temp Users List */}
        {tempUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Created Temporary Users</CardTitle>
              <CardDescription>
                These users will be automatically deleted when they expire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tempUsers.map((user, index) => (
                  <div key={user.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          {user.username}
                        </h3>
                        <p className="text-sm text-gray-600">{user.purpose}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          new Date(user.expiresAt) > new Date() 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {formatExpiry(user.expiresAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                          {user.email}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                        >
                          Copy
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                          {user.password}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(user.password, 'Password')}
                        >
                          Copy
                        </Button>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        ID: <span className="font-mono">{user.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Creates a temporary user with auto-generated username, email, and password</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>User automatically expires after the specified time period</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Expired users are automatically deleted from both auth and database</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Use the cleanup button to manually trigger deletion of expired users</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
