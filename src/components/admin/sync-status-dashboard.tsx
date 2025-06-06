"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface SyncStatus {
  last_check: string;
  health_score: number;
  discrepancies: number;
  recommendations: string[];
}

interface AuditReport {
  timestamp: string;
  summary: {
    total_retell_agents: number;
    voice_enabled_retell_agents: number;
    total_database_agents: number;
    active_database_agents: number;
    orphaned_database_agents: number;
    sync_discrepancies: number;
  };
  discrepancies: Array<{
    agent_id: string;
    name: string;
    voice_id?: string;
    status: 'missing_in_db' | 'missing_in_retell' | 'voice_mismatch' | 'orphaned';
    details: string;
    last_synced?: string;
  }>;
  recommendations: string[];
  health_score: number;
}

export function SyncStatusDashboard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/scheduled-sync?action=status');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      
      const data = await response.json();
      setSyncStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/audit-agents');
      if (!response.ok) {
        throw new Error('Failed to fetch audit report');
      }
      
      const data = await response.json();
      setAuditReport(data.audit_report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      const response = await fetch('/api/sync-retell-agents', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      const result = await response.json();
      
      // Refresh data after sync
      await Promise.all([fetchSyncStatus(), fetchAuditReport()]);
      
      // Show success message (you could use a toast here)
      console.log('Sync completed:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const cleanupOrphaned = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/audit-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanup_orphaned' }),
      });
      
      if (!response.ok) {
        throw new Error('Cleanup failed');
      }
      
      const result = await response.json();
      
      // Refresh data after cleanup
      await Promise.all([fetchSyncStatus(), fetchAuditReport()]);
      
      console.log('Cleanup completed:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    fetchAuditReport();
  }, []);

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 50) return <Badge variant="default" className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'missing_in_db':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'missing_in_retell':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'voice_mismatch':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'orphaned':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Voice Agent Sync Status</h2>
        <div className="flex gap-2">
          <Button
            onClick={fetchAuditReport}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button
            onClick={triggerSync}
            disabled={syncing || loading}
            size="sm"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sync Now'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-700">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Health Score Overview */}
      {auditReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sync Health Score
              {getHealthScoreBadge(auditReport.health_score)}
            </CardTitle>
            <CardDescription>
              Overall synchronization quality between Retell AI and database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              <span className={getHealthScoreColor(auditReport.health_score)}>
                {auditReport.health_score}/100
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Voice-Enabled Agents</div>
                <div className="font-semibold">{auditReport.summary.voice_enabled_retell_agents}</div>
              </div>
              <div>
                <div className="text-gray-500">Database Agents</div>
                <div className="font-semibold">{auditReport.summary.active_database_agents}</div>
              </div>
              <div>
                <div className="text-gray-500">Discrepancies</div>
                <div className="font-semibold text-red-600">{auditReport.summary.sync_discrepancies}</div>
              </div>
              <div>
                <div className="text-gray-500">Orphaned</div>
                <div className="font-semibold text-gray-600">{auditReport.summary.orphaned_database_agents}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Statistics */}
      {auditReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retell AI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Agents:</span>
                  <span className="font-semibold">{auditReport.summary.total_retell_agents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Voice-Enabled:</span>
                  <span className="font-semibold text-green-600">{auditReport.summary.voice_enabled_retell_agents}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Agents:</span>
                  <span className="font-semibold">{auditReport.summary.total_database_agents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span className="font-semibold text-green-600">{auditReport.summary.active_database_agents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orphaned:</span>
                  <span className="font-semibold text-gray-600">{auditReport.summary.orphaned_database_agents}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Discrepancies:</span>
                  <span className="font-semibold text-red-600">{auditReport.summary.sync_discrepancies}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Check:</span>
                  <span className="text-sm text-gray-500">
                    {new Date(auditReport.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Discrepancies */}
      {auditReport && auditReport.discrepancies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sync Discrepancies
              <Badge variant="destructive">{auditReport.discrepancies.length}</Badge>
            </CardTitle>
            <CardDescription>
              Agents that require attention to maintain sync consistency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditReport.discrepancies.map((discrepancy, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(discrepancy.status)}
                  <div className="flex-1">
                    <div className="font-semibold">{discrepancy.name}</div>
                    <div className="text-sm text-gray-600">{discrepancy.details}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Agent ID: {discrepancy.agent_id}
                      {discrepancy.voice_id && ` • Voice ID: ${discrepancy.voice_id}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {discrepancy.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {auditReport && auditReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Suggested actions to improve sync health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditReport.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                    {index + 1}
                  </div>
                  <div className="text-sm">{recommendation}</div>
                </div>
              ))}
            </div>
            
            {auditReport.summary.orphaned_database_agents > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={cleanupOrphaned}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Cleanup Orphaned Agents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Issues */}
      {auditReport && auditReport.discrepancies.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">All Systems Synchronized</h3>
              <p className="text-gray-600">
                All voice-enabled agents are properly synchronized between Retell AI and the database.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
