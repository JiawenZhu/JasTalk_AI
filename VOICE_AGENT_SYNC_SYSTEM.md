# Voice Agent Synchronization System

## Overview

This document describes the enhanced synchronization system between Retell AI voice agents and the FoloUp interview platform. The system ensures that only voice-enabled agents are synchronized, maintaining data consistency and providing comprehensive audit capabilities.

## Key Features

### ✅ Voice-Only Synchronization
- **Primary Requirement**: Only agents with configured voices (`voice_id`) are synchronized
- **Prevents Clutter**: Non-voice agents are automatically skipped to keep the interview platform clean
- **Smart Filtering**: Agents must also match interview naming patterns (Bob, Lisa, conversation, etc.)

### ✅ Data Consistency
- **Accurate Field Mapping**: Agent Name, Voice ID, and metadata are properly synced
- **Bidirectional Sync**: Handles both Retell AI → Database and Database → Retell AI scenarios
- **Orphan Detection**: Identifies agents that exist in database but not in Retell AI

### ✅ Comprehensive Auditing
- **Discrepancy Detection**: Identifies unsynced agents and configuration mismatches
- **Health Scoring**: 0-100 score based on sync quality and consistency
- **Detailed Logging**: Console and API logs for all sync operations
- **Recommendations**: Actionable suggestions for resolving sync issues

### ✅ Automation & Webhooks
- **Real-time Sync**: Webhook handlers for agent creation, updates, and deletions
- **Scheduled Sync**: Automated periodic synchronization
- **Event-Driven**: Triggers sync when voice settings change

## API Endpoints

### 1. Enhanced Sync Endpoint
```
POST /api/sync-retell-agents
```

**Features:**
- Only syncs voice-enabled agents
- Provides detailed audit logs
- Identifies discrepancies
- Returns comprehensive sync report

**Response Example:**
```json
{
  "success": true,
  "message": "Enhanced voice-enabled agent sync completed",
  "created": [
    {
      "agent_id": "agent_123",
      "name": "Empathetic Bob",
      "reason": "New voice-enabled agent from Retell AI"
    }
  ],
  "updated": [...],
  "skipped": [
    {
      "agent_id": "agent_456",
      "name": "Test Agent",
      "reason": "No voice configured - agents without voice are not suitable for interviews"
    }
  ],
  "orphaned": [...],
  "errors": [...],
  "audit_logs": [...],
  "discrepancies": {
    "retell_voice_enabled": 4,
    "database_agents": 3,
    "unsynced_agents": [...]
  }
}
```

### 2. Audit Endpoint
```
GET /api/audit-agents
```

**Features:**
- Comprehensive discrepancy analysis
- Health score calculation
- Actionable recommendations
- No modifications to data

**Response Example:**
```json
{
  "success": true,
  "audit_report": {
    "timestamp": "2025-01-06T...",
    "summary": {
      "total_retell_agents": 5,
      "voice_enabled_retell_agents": 4,
      "total_database_agents": 3,
      "active_database_agents": 3,
      "orphaned_database_agents": 0,
      "sync_discrepancies": 1
    },
    "discrepancies": [
      {
        "agent_id": "agent_789",
        "name": "New Voice Agent",
        "voice_id": "voice_123",
        "status": "missing_in_db",
        "details": "Voice-enabled agent exists in Retell AI but not in database"
      }
    ],
    "recommendations": [
      "Run sync operation to add 1 voice-enabled agent(s) from Retell AI to the database."
    ],
    "health_score": 75
  }
}
```

### 3. Cleanup Endpoint
```
POST /api/audit-agents
Content-Type: application/json

{
  "action": "cleanup_orphaned"
}
```

**Features:**
- Removes orphaned agents older than 7 days
- Safe cleanup with confirmation
- Detailed cleanup report

### 4. Webhook Endpoint
```
POST /api/retell-webhook
```

**Features:**
- Real-time sync on agent changes
- Voice validation before sync
- Automatic orphaning when voice is removed
- Secure webhook verification

### 5. Scheduled Sync Endpoint
```
POST /api/scheduled-sync
Authorization: Bearer <SYNC_AUTH_TOKEN>
```

**Features:**
- Automated periodic sync
- Post-sync audit
- Health score monitoring
- Cron job compatible

## Database Schema

The `interviewer` table includes sync-related fields:

```sql
CREATE TABLE interviewer (
    id SERIAL PRIMARY KEY,
    agent_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    audio TEXT,
    empathy INTEGER NOT NULL,
    exploration INTEGER NOT NULL,
    rapport INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    sync_status TEXT DEFAULT 'active' -- 'active', 'orphaned', 'deleted'
);
```

## Sync Logic Flow

### 1. Voice Validation
```typescript
function shouldSyncAgent(agent: any): { shouldSync: boolean; reason: string } {
  // Primary requirement: Must have voice_id
  if (!agent.voice_id) {
    return { shouldSync: false, reason: 'No voice configured' };
  }
  
  // Check required fields
  if (!agent.agent_name || !agent.agent_id) {
    return { shouldSync: false, reason: 'Missing required fields' };
  }
  
  // Check naming patterns
  const isInterviewAgent = /* naming pattern check */;
  if (!isInterviewAgent) {
    return { shouldSync: false, reason: 'Not an interview agent' };
  }
  
  return { shouldSync: true, reason: 'Meets all criteria' };
}
```

### 2. Sync Process
1. **Fetch Agents**: Get all agents from Retell AI
2. **Filter Voice-Enabled**: Only process agents with `voice_id`
3. **Validate Each Agent**: Check if agent should be synced
4. **Create/Update**: Sync valid agents to database
5. **Mark Orphaned**: Identify agents no longer in Retell AI
6. **Generate Audit**: Create comprehensive sync report

### 3. Webhook Handling
1. **Verify Signature**: Ensure webhook authenticity
2. **Validate Agent**: Check if agent meets sync criteria
3. **Process Event**: Handle create/update/delete events
4. **Update Status**: Mark agents as active/orphaned as needed

## Environment Variables

```bash
# Required
RETELL_API_KEY=your_retell_api_key

# Optional
RETELL_WEBHOOK_SECRET=your_webhook_secret
SYNC_AUTH_TOKEN=your_sync_auth_token
NEXTAUTH_URL=https://your-domain.com
```

## Usage Examples

### Manual Sync
```bash
curl -X POST https://your-domain.com/api/sync-retell-agents
```

### Audit Check
```bash
curl https://your-domain.com/api/audit-agents
```

### Scheduled Sync (with auth)
```bash
curl -X POST https://your-domain.com/api/scheduled-sync \
  -H "Authorization: Bearer $SYNC_AUTH_TOKEN"
```

### Cleanup Orphaned Agents
```bash
curl -X POST https://your-domain.com/api/audit-agents \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup_orphaned"}'
```

## Monitoring & Alerts

### Health Score Interpretation
- **90-100**: Excellent sync health
- **70-89**: Good sync health, minor discrepancies
- **50-69**: Fair sync health, attention needed
- **0-49**: Poor sync health, immediate action required

### Key Metrics to Monitor
- Number of voice-enabled agents in Retell AI
- Number of active agents in database
- Sync discrepancies count
- Health score trend
- Orphaned agents count

### Recommended Monitoring
1. **Daily Health Checks**: Monitor health score
2. **Weekly Audits**: Run comprehensive audit reports
3. **Monthly Cleanup**: Remove old orphaned agents
4. **Alert Thresholds**: Health score < 70, discrepancies > 5

## Troubleshooting

### Common Issues

#### 1. Agent Not Syncing
**Symptoms**: Voice-enabled agent in Retell AI not appearing in database
**Causes**: 
- Agent name doesn't match interview patterns
- Missing required fields
- Sync errors

**Solution**: 
1. Check audit logs for specific reason
2. Verify agent has voice_id
3. Ensure agent name matches patterns
4. Run manual sync

#### 2. Orphaned Agents
**Symptoms**: Agents in database marked as orphaned
**Causes**:
- Agent deleted from Retell AI
- Voice removed from agent
- Agent renamed to non-interview pattern

**Solution**:
1. Check if agent still exists in Retell AI
2. Verify voice configuration
3. Clean up old orphaned agents

#### 3. Sync Failures
**Symptoms**: Sync endpoint returning errors
**Causes**:
- Invalid API key
- Network connectivity issues
- Database connection problems

**Solution**:
1. Verify RETELL_API_KEY
2. Check network connectivity
3. Verify database connection
4. Check API rate limits

### Debug Commands

```bash
# Check sync status
curl "https://your-domain.com/api/scheduled-sync?action=status"

# Run audit only
curl "https://your-domain.com/api/audit-agents"

# Force sync with detailed logs
curl -X POST "https://your-domain.com/api/sync-retell-agents" -v
```

## Best Practices

### 1. Regular Maintenance
- Run daily health checks
- Schedule weekly full syncs
- Monthly orphaned agent cleanup
- Quarterly system review

### 2. Voice Agent Management
- Always configure voice before creating interview agents
- Use consistent naming patterns
- Test agents before production use
- Monitor voice configuration changes

### 3. Monitoring Setup
- Set up health score alerts
- Monitor sync frequency
- Track discrepancy trends
- Log all sync operations

### 4. Security
- Use webhook signature verification
- Secure sync auth tokens
- Limit API access
- Monitor for unauthorized sync attempts

## Migration Guide

### From Old Sync System
1. **Backup Current Data**: Export existing interviewer records
2. **Run Audit**: Check current sync status
3. **Deploy New System**: Update API endpoints
4. **Initial Sync**: Run full sync with new logic
5. **Verify Results**: Compare before/after states
6. **Setup Monitoring**: Configure health checks

### Testing New System
1. **Test Environment**: Deploy to staging first
2. **Mock Data**: Test with sample agents
3. **Webhook Testing**: Verify webhook handling
4. **Load Testing**: Test with multiple agents
5. **Rollback Plan**: Prepare rollback procedure

## Support

For issues or questions about the voice agent sync system:

1. **Check Logs**: Review console logs for detailed error messages
2. **Run Audit**: Use audit endpoint to identify specific issues
3. **Consult Documentation**: Review this guide and API documentation
4. **Contact Support**: Reach out to development team with audit reports

---

*Last Updated: January 6, 2025*
*Version: 2.0 - Enhanced Voice-Enabled Sync System* 
