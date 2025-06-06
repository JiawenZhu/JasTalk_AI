'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Agent {
  id: number;
  agent_id: string;
  name: string;
  sync_status: 'active' | 'orphaned' | 'unknown';
  last_synced_at: string;
  created_at: string;
}

interface StatusCounts {
  active: number;
  orphaned: number;
  unknown: number;
  total: number;
}

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    active: 0,
    orphaned: 0,
    unknown: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadAgentStatus();
  }, []);

  const loadAgentStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/manage-agents?action=status');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
        setStatusCounts(data.statusCounts);
        setLastUpdate(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Failed to load agent status:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync-retell-agents', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        console.log('Sync completed:', result);
        await loadAgentStatus(); // Refresh the data
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const cleanupOrphaned = async () => {
    const orphanedAgents = agents.filter(a => a.sync_status === 'orphaned');
    if (orphanedAgents.length === 0) return;

    const confirmed = confirm(`Delete ${orphanedAgents.length} orphaned agents?`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/manage-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cleanup-orphaned',
          agent_ids: orphanedAgents.map(a => a.agent_id)
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadAgentStatus(); // Refresh the data
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'orphaned':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      orphaned: 'destructive',
      unknown: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Retell Agent Management</h1>
        <p className="text-gray-600">
          Monitor and manage the synchronization between Retell AI and your database.
          Last updated: {lastUpdate}
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orphaned</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.orphaned}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unknown</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.unknown}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={triggerSync} 
          disabled={syncing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>

        <Button 
          onClick={cleanupOrphaned} 
          variant="destructive"
          disabled={statusCounts.orphaned === 0}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clean Orphaned ({statusCounts.orphaned})
        </Button>

        <Button 
          onClick={loadAgentStatus} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Agent ID</th>
                    <th className="text-left p-2">Last Synced</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(agent.sync_status)}
                          {getStatusBadge(agent.sync_status)}
                        </div>
                      </td>
                      <td className="p-2 font-medium">{agent.name}</td>
                      <td className="p-2 font-mono text-sm text-gray-600">
                        {agent.agent_id}
                      </td>
                      <td className="p-2 text-sm">
                        {agent.last_synced_at 
                          ? new Date(agent.last_synced_at).toLocaleString()
                          : 'Never'
                        }
                      </td>
                      <td className="p-2 text-sm">
                        {new Date(agent.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {agents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No agents found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
