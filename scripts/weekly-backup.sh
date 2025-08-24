#!/bin/bash

# 🗄️ JasTalk AI - Weekly Supabase Backup Script
# This script runs every Sunday at 2:00 AM to create automated backups

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./backups/supabase"
LOG_FILE="./logs/supabase-backup.log"
RETENTION_DAYS=28  # Keep backups for 4 weeks
NOTIFICATION_EMAIL="admin@jastalk.com"
SUPABASE_PROJECT_DIR="/Users/jiawenzhu/Developer/Jastalk_AI"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "❌ ERROR: $1"
    echo -e "${RED}❌ ERROR: $1${NC}"
    
    # Send failure notification
    if command -v mail &> /dev/null; then
        echo "Weekly Supabase backup failed at $(date)" | mail -s "🚨 Supabase Backup Failed" "$NOTIFICATION_EMAIL"
    fi
    
    exit 1
}

# Success notification
success_notification() {
    log "✅ Backup completed successfully"
    echo -e "${GREEN}✅ Backup completed successfully${NC}"
    
    # Send success notification
    if command -v mail &> /dev/null; then
        echo "Weekly Supabase backup completed successfully at $(date)" | mail -s "✅ Supabase Backup Completed" "$NOTIFICATION_EMAIL"
    fi
}

# Main backup function
main() {
    log "🔄 Starting weekly Supabase backup..."
    echo -e "${BLUE}🔄 Starting weekly Supabase backup...${NC}"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Change to Supabase project directory
    cd "$SUPABASE_PROJECT_DIR" || error_exit "Failed to change to Supabase project directory"
    
    # Check if Supabase is running
    if ! supabase status &> /dev/null; then
        error_exit "Supabase is not running. Please start Supabase first."
    fi
    
    # Generate backup filename with timestamp
    BACKUP_FILE="jastalk-ai-backup-$(date +%Y%m%d-%H%M%S).sql"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    
    log "📁 Backup file: $BACKUP_PATH"
    
    # Start backup
    log "🔄 Creating database backup..."
    echo -e "${BLUE}🔄 Creating database backup...${NC}"
    
    # Create database dump
    if supabase db dump --file "$BACKUP_PATH"; then
        log "✅ Database dump created successfully"
    else
        error_exit "Failed to create database dump"
    fi
    
    # Compress backup file
    log "🗜️ Compressing backup file..."
    echo -e "${BLUE}🗜️ Compressing backup file...${NC}"
    
    if gzip "$BACKUP_PATH"; then
        BACKUP_PATH="$BACKUP_PATH.gz"
        log "✅ Backup compressed successfully"
    else
        error_exit "Failed to compress backup file"
    fi
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log "📊 Backup size: $BACKUP_SIZE"
    
    # Verify backup integrity
    log "🔍 Verifying backup integrity..."
    echo -e "${BLUE}🔍 Verifying backup integrity...${NC}"
    
    # Check if backup file exists and has content
    if [ -f "$BACKUP_PATH" ] && [ -s "$BACKUP_PATH" ]; then
        log "✅ Backup file exists and has content"
    else
        error_exit "Backup file verification failed"
    fi
    
    # Clean up old backups (keep only last 4 weeks)
    log "🧹 Cleaning up old backups..."
    echo -e "${BLUE}🧹 Cleaning up old backups...${NC}"
    
    find "$BACKUP_DIR" -name "jastalk-ai-backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete
    log "✅ Old backups cleaned up"
    
    # List current backups
    log "📋 Current backup files:"
    ls -lh "$BACKUP_DIR"/jastalk-ai-backup-*.sql.gz 2>/dev/null || log "No backup files found"
    
    # Calculate backup duration
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    DURATION_MIN=$((DURATION / 60))
    DURATION_SEC=$((DURATION % 60))
    
    log "⏱️ Backup duration: ${DURATION_MIN}m ${DURATION_SEC}s"
    
    # Success notification
    success_notification
    
    log "🎉 Weekly backup completed successfully!"
    echo -e "${GREEN}🎉 Weekly backup completed successfully!${NC}"
    echo -e "${GREEN}📁 Backup location: $BACKUP_PATH${NC}"
    echo -e "${GREEN}📊 Backup size: $BACKUP_SIZE${NC}"
    echo -e "${GREEN}⏱️ Duration: ${DURATION_MIN}m ${DURATION_SEC}s${NC}"
}

# Health check function
health_check() {
    log "🏥 Running backup health check..."
    echo -e "${BLUE}🏥 Running backup health check...${NC}"
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        error_exit "Backup directory does not exist"
    fi
    
    # Check if we have recent backups
    RECENT_BACKUPS=$(find "$BACKUP_DIR" -name "jastalk-ai-backup-*.sql.gz" -mtime -7 | wc -l)
    
    if [ "$RECENT_BACKUPS" -eq 0 ]; then
        error_exit "No recent backups found in the last 7 days"
    fi
    
    log "✅ Health check passed: $RECENT_BACKUPS recent backups found"
    echo -e "${GREEN}✅ Health check passed: $RECENT_BACKUPS recent backups found${NC}"
}

# Main execution
START_TIME=$(date +%s)

log "🚀 Starting Supabase backup process"
echo -e "${BLUE}🚀 Starting Supabase backup process${NC}"

# Check if running as root (optional)
if [ "$EUID" -eq 0 ]; then
    log "⚠️ Running as root - this is not recommended for security reasons"
    echo -e "${YELLOW}⚠️ Running as root - this is not recommended for security reasons${NC}"
fi

# Run main backup
main

# Run health check
health_check

log "🎯 Backup process completed successfully"
echo -e "${GREEN}🎯 Backup process completed successfully${NC}"

exit 0
