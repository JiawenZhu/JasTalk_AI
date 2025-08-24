#!/bin/bash

# 🗄️ JasTalk AI - Setup Automated Weekly Backup Cron Job
# This script sets up the weekly backup to run automatically every Sunday at 2:00 AM

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/weekly-backup.sh"
CRON_JOB="0 2 * * 0 cd $PROJECT_DIR && $BACKUP_SCRIPT >> $PROJECT_DIR/logs/cron-backup.log 2>&1"

echo -e "${BLUE}🚀 Setting up automated weekly Supabase backup...${NC}"
echo ""

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo -e "${RED}❌ Backup script not found: $BACKUP_SCRIPT${NC}"
    exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"
echo -e "${GREEN}✅ Made backup script executable${NC}"

# Create log directory
mkdir -p "$PROJECT_DIR/logs"
echo -e "${GREEN}✅ Created logs directory${NC}"

# Check if cron is available
if ! command -v crontab &> /dev/null; then
    echo -e "${RED}❌ Cron is not available on this system${NC}"
    echo "Please install cron or use an alternative scheduling method"
    exit 1
fi

# Create temporary cron file
TEMP_CRON=$(mktemp)

# Export current crontab
crontab -l 2>/dev/null > "$TEMP_CRON" || true

# Check if cron job already exists
if grep -q "weekly-backup.sh" "$TEMP_CRON"; then
    echo -e "${YELLOW}⚠️ Weekly backup cron job already exists${NC}"
    echo "Current cron jobs:"
    crontab -l | grep -E "(weekly-backup|jastalk)" || echo "No backup jobs found"
    echo ""
    echo "To update the cron job, remove the existing one first:"
    echo "crontab -e"
    echo ""
    echo "Or run this script with --force flag to overwrite"
    
    if [ "$1" != "--force" ]; then
        rm "$TEMP_CRON"
        exit 0
    fi
fi

# Add new cron job
echo "" >> "$TEMP_CRON"
echo "# JasTalk AI - Weekly Supabase Backup (Every Sunday at 2:00 AM)" >> "$TEMP_CRON"
echo "$CRON_JOB" >> "$TEMP_CRON"

# Install new crontab
crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo -e "${GREEN}✅ Weekly backup cron job installed successfully!${NC}"
echo ""
echo "📋 Cron job details:"
echo "   Schedule: Every Sunday at 2:00 AM"
echo "   Script: $BACKUP_SCRIPT"
echo "   Log file: $PROJECT_DIR/logs/cron-backup.log"
echo ""
echo "🔍 To verify the cron job:"
echo "   crontab -l"
echo ""
echo "📝 To edit cron jobs manually:"
echo "   crontab -e"
echo ""
echo "📊 To view backup logs:"
echo "   tail -f $PROJECT_DIR/logs/cron-backup.log"
echo ""
echo "🔄 To test the backup manually:"
echo "   $BACKUP_SCRIPT"
echo ""
echo -e "${GREEN}🎉 Automated backup setup complete!${NC}"
echo "Your Supabase database will now be backed up automatically every week."
