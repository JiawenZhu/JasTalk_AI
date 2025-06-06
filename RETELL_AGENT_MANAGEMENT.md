# Retell Agent Management System

## Overview

This system provides comprehensive management and synchronization of Retell AI agents with your local database. It includes real-time syncing, webhook integration, duplicate detection, orphan cleanup, and a full admin interface.

## Features

### 🔄 Bidirectional Synchronization
- **Automatic Sync**: Keeps database and Retell AI agents in perfect sync
- **Real-time Updates**: Webhook integration for instant synchronization
- **Scheduled Sync**: Automated periodic synchronization
- **Manual Triggers**: On-demand sync through admin interface

### 🧹 Data Management
- **Duplicate Detection**: Identifies and resolves duplicate agents
- **Orphan Management**: Handles agents deleted from Retell AI
- **Migration Tools**: Safe database schema updates
- **Cleanup Operations**: Automated and manual cleanup processes

### 📊 Admin Interface
- **Visual Dashboard**: Comprehensive agent status overview
- **Real-time Monitoring**: Live status updates and sync progress
- **Bulk Operations**: Manage multiple agents simultaneously
- **Health Checks**: System status and performance monitoring

## API Endpoints

### Core Synchronization

#### `POST /api/sync-retell-agents`
Main synchronization endpoint that performs bidirectional sync between Retell AI and your database.

**Features:**
- Fetches all agents from Retell AI
- Filters for interview-relevant agents
- Creates new agents in database
- Updates existing agents
- Marks orphaned agents
- Provides detailed sync results

**Response:**
```json
{
  "success": true,
  "message": "Bidirectional sync completed: 2 created, 3 updated, 1 orphaned, 0 errors",
  "created": [...],
  "updated": [...],
  "orphaned": [...],
  "errors": [...],
  "totalRetellAgents": 15,
  "totalDatabaseAgents": 14,
  "syncTimestamp": "2024-01-15T10:30:00Z"
}
```

### Agent Management

#### `GET/POST /api/manage-agents`
Comprehensive agent management operations.

**GET Parameters:**
- `?action=status` - Get agent status overview
- `?action=orphaned` - List orphaned agents
- `?action=duplicates` - Find duplicate agents

**POST Actions:**
- `cleanup-orphaned` - Remove orphaned agents
- `force-sync` - Force sync specific agents
- `delete-duplicates` - Remove duplicate agents

### Webhook Integration

#### `POST /api/retell-webhook`
Handles real-time updates from Retell AI.

**Supported Events:**
- `agent.created` - New agent created in Retell AI
- `agent.updated` - Agent updated in Retell AI
- `agent.deleted` - Agent deleted in Retell AI

**Security:**
- Webhook signature verification
- Secure HMAC validation
- Rate limiting protection

### Migration & Maintenance

#### `GET/POST /api/migrate-agents`
Safe database migrations and duplicate cleanup.

**GET**: Check migration status and detect issues
**POST**: Execute migration and cleanup operations

#### `POST /api/scheduled-sync`
Endpoint for scheduled/cron-based synchronization.

**Authentication**: Requires `CRON_SECRET` token
**Features**: Automatic cleanup of old orphaned records

## Database Schema

### Enhanced Interviewer Table

```sql
CREATE TABLE interviewer (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    agent_id TEXT UNIQUE, -- Retell AI agent ID
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

### Key Features:
- **Unique Constraint**: Prevents duplicate agent_id entries
- **Sync Tracking**: Monitors last sync time and status
- **Status Management**: Tracks agent lifecycle states

## Environment Variables

```bash
# Required
RETELL_API_KEY=your_retell_api_key

# Optional
RETELL_WEBHOOK_SECRET=your_webhook_secret
CRON_SECRET=your_cron_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Agent Filtering Logic

The system automatically identifies interview-relevant agents based on name patterns:

```javascript
const isInterviewAgent = (agentName) => {
  const name = agentName.toLowerCase();
  return (
    name.includes('bob') || 
    name.includes('lisa') ||
    name.includes('interview') ||
    name.includes('conversation') ||
    name.includes('empathetic') ||
    name.includes('explorer') ||
    name.includes('flow') ||
    name.includes('agent')
  );
};
```

## Admin Interface

### Accessing the Admin Dashboard

1. Navigate to `/dashboard/admin`
2. View agent status overview
3. Monitor sync operations
4. Perform bulk management tasks

### Key Features:

#### Status Overview
- **Total Agents**: Overall agent count
- **Active Agents**: Successfully synced agents
- **Orphaned Agents**: Agents deleted from Retell AI
- **Unknown Status**: Agents needing sync

#### Operations
- **Sync Now**: Manual synchronization trigger
- **Clean Orphaned**: Remove orphaned agents
- **Refresh**: Update dashboard data

#### Agent Table
- Real-time status indicators
- Last sync timestamps
- Agent identification details
- Visual status badges

## Migration Process

### Initial Setup

1. **Run Migration**:
   ```bash
   curl -X POST http://localhost:3000/api/migrate-agents
   ```

2. **Apply Database Schema**:
   ```bash
   psql -d your_database -f migration-fix-agent-duplicates.sql
   ```

3. **Initial Sync**:
   ```bash
   curl -X POST http://localhost:3000/api/sync-retell-agents
   ```

### Handling Duplicates

The system automatically:
1. Identifies agents with duplicate names
2. Keeps the most recent agent
3. Updates interview references
4. Safely removes duplicates

## Webhook Setup

### Retell AI Configuration

1. Go to Retell AI Dashboard
2. Navigate to Webhooks
3. Add endpoint: `https://your-domain.com/api/retell-webhook`
4. Select events: `agent.created`, `agent.updated`, `agent.deleted`
5. Set webhook secret in environment variables

### Security

- HMAC signature verification
- Timestamp validation
- Rate limiting protection
- Secure error handling

## Scheduled Synchronization

### Cron Setup

Add to your cron configuration:

```bash
# Sync every hour
0 * * * * curl -X POST -H "Authorization: Bearer your_cron_secret" https://your-domain.com/api/scheduled-sync

# Sync every 6 hours
0 */6 * * * curl -X POST -H "Authorization: Bearer your_cron_secret" https://your-domain.com/api/scheduled-sync
```

### Vercel Cron Jobs

```json
{
  "crons": [{
    "path": "/api/scheduled-sync",
    "schedule": "0 */6 * * *"
  }]
}
```

## Error Handling

### Sync Errors
- **Network Issues**: Automatic retry logic
- **API Limits**: Rate limiting and backoff
- **Data Conflicts**: Conflict resolution strategies
- **Schema Issues**: Safe fallback mechanisms

### Recovery Procedures
1. Check API connectivity
2. Verify environment variables
3. Run diagnostic endpoints
4. Force sync specific agents
5. Clean up corrupted data

## Monitoring & Logging

### Log Levels
- **INFO**: Normal operations
- **WARN**: Recoverable issues
- **ERROR**: Serious problems requiring attention

### Key Metrics
- Sync success rate
- Agent count discrepancies
- Orphaned agent accumulation
- API response times

## Best Practices

### Regular Maintenance
1. **Weekly**: Review orphaned agents
2. **Monthly**: Check for duplicates
3. **Quarterly**: Validate sync accuracy
4. **As Needed**: Force sync problem agents

### Performance Optimization
- Use pagination for large agent lists
- Implement caching for frequent queries
- Monitor API rate limits
- Optimize database queries

### Security Considerations
- Rotate webhook secrets regularly
- Monitor for unusual sync patterns
- Validate all incoming data
- Implement proper access controls

## Troubleshooting

### Common Issues

#### Sync Failures
```bash
# Check API connectivity
curl -X GET https://api.retell.ai/v2/agents

# Verify environment variables
echo $RETELL_API_KEY

# Force sync single agent
curl -X POST -d '{"action":"force-sync","agent_ids":["agent_id"]}' http://localhost:3000/api/manage-agents
```

#### Duplicate Agents
```bash
# Check for duplicates
curl -X GET "http://localhost:3000/api/manage-agents?action=duplicates"

# Remove duplicates
curl -X POST -d '{"action":"delete-duplicates","agent_ids":["id1","id2"]}' http://localhost:3000/api/manage-agents
```

#### Orphaned Agents
```bash
# List orphaned agents
curl -X GET "http://localhost:3000/api/manage-agents?action=orphaned"

# Clean up orphaned agents
curl -X POST -d '{"action":"cleanup-orphaned"}' http://localhost:3000/api/manage-agents
```

## Support

For issues or questions:
1. Check the admin dashboard for status
2. Review application logs
3. Run diagnostic endpoints
4. Check environment configuration
5. Verify Retell AI API status

## Version History

- **v1.0**: Initial agent management system
- **v1.1**: Added webhook integration
- **v1.2**: Enhanced duplicate detection
- **v1.3**: Comprehensive admin interface
- **v1.4**: Scheduled sync and migration tools 
