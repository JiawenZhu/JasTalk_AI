"use client";

import { useAuth } from '@/contexts/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTest() {
  const { 
    user, 
    session, 
    loading, 
    isAuthenticated, 
    signOut,
    getUserFullName 
  } = useAuth();

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      console.log('Sign out result:', result);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <div className="text-center">Loading authentication state...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Authenticated:</span>
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? 'Yes' : 'No'}
            </span>
          </div>
          
          {user && (
            <>
              <div className="flex justify-between">
                <span className="font-medium">User ID:</span>
                <span className="text-sm text-gray-600">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span className="text-sm text-gray-600">{getUserFullName(user)}</span>
              </div>
            </>
          )}
          
          {session && (
            <div className="flex justify-between">
              <span className="font-medium">Session:</span>
              <span className="text-sm text-gray-600">Active</span>
            </div>
          )}
        </div>
        
        {isAuthenticated && (
          <Button 
            onClick={handleSignOut}
            variant="destructive"
            className="w-full"
          >
            Sign Out
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 
