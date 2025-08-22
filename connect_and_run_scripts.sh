#!/bin/bash

# Phase 3: Direct Database Connection and Script Execution
# This script will connect to your Supabase database and run all Phase 3 scripts

echo "🚀 PHASE 3: Setting up direct database connection..."

# Database connection details
DB_HOST="db.tgyzocboaaueetdnuagb.supabase.co"
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"

echo "📊 Database: $DB_HOST"
echo "👤 User: $DB_USER"
echo "🗄️  Database: $DB_NAME"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed. Please install PostgreSQL client."
    exit 1
fi

echo "✅ psql is available"

# Function to run a script
run_script() {
    local script_name=$1
    local script_file=$2
    
    echo ""
    echo "🔍 Running: $script_name"
    echo "📝 File: $script_file"
    echo "----------------------------------------"
    
    if [ -f "$script_file" ]; then
        # Note: You'll need to provide the password when prompted
        echo "⚠️  You will be prompted for the database password"
        echo "💡 Tip: The password is usually shown in your Supabase project settings"
        
        # Run the script
        PGPASSWORD="" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -f "$script_file"
        
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

