#!/bin/bash

# Phase 3: Working Database Connection and Script Execution
# This script uses the correct connection details that we discovered

echo "🚀 PHASE 3: Setting up working database connection..."

# Database connection details (CORRECTED)
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_NAME="postgres"
DB_USER="postgres.tgyzocboaaueetdnuagb"
DB_PASSWORD="RyFw#MaA472qja$"
DB_PORT="5432"

echo "📊 Database: $DB_HOST"
echo "👤 User: $DB_USER"
echo "🗄️  Database: $DB_NAME"
echo "✅ Password: [HIDDEN]"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed. Please install PostgreSQL client."
    exit 1
fi

echo "✅ psql is available"

# Test connection first
echo ""
echo "🔍 Testing database connection..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -c "SELECT 'Database connection successful' as status;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Function to run a script
run_script() {
    local script_name=$1
    local script_file=$2
    
    echo ""
    echo "🔍 Running: $script_name"
    echo "📝 File: $script_file"
    echo "----------------------------------------"
    
    if [ -f "$script_file" ]; then
        # Run the script with password
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -f "$script_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ $script_name completed successfully"
        else
            echo "❌ $script_name failed"
        fi
    else
        echo "❌ Script file not found: $script_file"
    fi
    
    echo "----------------------------------------"
}

# Main execution
echo ""
echo "🎯 Starting Phase 3 execution..."

# Run all scripts in order
run_script "Script 1: Initial Assessment" "phase3_script1_assessment_FIXED.sql"
run_script "Script 2: Data Recovery Attempts" "phase3_script2_recovery.sql"
run_script "Script 3: Mark Irrecoverable Data" "phase3_script3_mark_incomplete_FIXED.sql"
run_script "Script 4: Validation Testing" "phase3_script4_validation_FIXED.sql"
run_script "Script 5: Final Status Report" "phase3_script5_final_report_FIXED.sql"

echo ""
echo "🎉 Phase 3 execution complete!"
echo "📊 Check the results above for any errors or issues."

