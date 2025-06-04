"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface SyncResult {
  success: boolean;
  message: string;
  synced: Array<{
    agent_id: string;
    name: string;
    id: number;
    avatar: string;
  }>;
  skipped: Array<{
    agent_id: string;
    name: string;
    reason: string;
  }>;
  totalRetellAgents: number;
  filteredAgents: number;
}

export default function SyncRetellAgentsButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      console.log("Starting Retell agents sync...");
      
      const response = await axios.post('/api/sync-retell-agents');
      const result: SyncResult = response.data;
      
      setLastSyncResult(result);
      
      if (result.success) {
        toast.success(
          `Sync completed! ${result.synced.length} agents added, ${result.skipped.length} skipped`,
          {
            description: "Your Retell agents have been synced with the database"
          }
        );
        
        // Log detailed results
        console.log("Sync results:", result);
        
        if (result.synced.length > 0) {
          console.log("Newly synced agents:", result.synced);
        }
        
        if (result.skipped.length > 0) {
          console.log("Skipped agents:", result.skipped);
        }
        
        // Refresh the page to show new interviewers
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } else {
        toast.error("Sync failed", {
          description: result.message || "Unknown error occurred"
        });
      }
      
    } catch (error) {
      console.error("Error syncing Retell agents:", error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        toast.error("Sync failed", {
          description: errorMessage
        });
      } else {
        toast.error("Sync failed", {
          description: "An unexpected error occurred"
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isSyncing ? "Syncing..." : "Sync Retell Agents"}
      </Button>
      
      {lastSyncResult && (
        <div className="text-xs text-gray-600 flex items-center gap-1">
          {lastSyncResult.success ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-red-600" />
          )}
          <span>
            Last sync: {lastSyncResult.synced.length} added, {lastSyncResult.skipped.length} skipped
          </span>
        </div>
      )}
    </div>
  );
} 
