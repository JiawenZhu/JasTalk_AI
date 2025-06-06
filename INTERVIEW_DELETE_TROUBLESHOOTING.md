# Interview Deletion Troubleshooting Guide

## Issue: Failed to Delete Interview

**Fixed Issues:**
- ✅ **Import Error**: Changed from `@/lib/supabase-server` to `@/lib/supabase` 
- ✅ **Enhanced Error Logging**: Added detailed error messages and stack traces
- ✅ **Permission Debugging**: Added user and organization logging

## Common Issues & Solutions

### 1. 500 Internal Server Error
**Symptoms**: API returns 500 status with "Failed to delete interview" message

**Debugging Steps**:
1. Check browser console or server logs for detailed error messages
2. Look for specific database error details (details, hint fields)
3. Verify user authentication and permissions

**Common Causes**:
- Database connection issues
- Missing foreign key constraints
- Row Level Security (RLS) policy restrictions
- Insufficient permissions

### 2. 404 Interview Not Found
**Symptoms**: API returns 404 status with "Interview not found" message

**Possible Causes**:
- Interview ID doesn't exist in database
- User doesn't have access to the interview due to organization restrictions
- Interview was already deleted

### 3. 403 Permission Denied
**Symptoms**: API returns 403 status with permission-related error

**Check**:
- User belongs to same organization as interview
- User is the owner of the interview
- RLS policies allow deletion

### 4. Authentication Issues
**Symptoms**: 401 Unauthorized errors

**Solutions**:
- Verify user session is valid
- Check if authentication token is expired
- In development mode, fallback user will be used

## Database Schema Dependencies

The deletion process follows this order:
1. **coding_submission** (references response_id)
2. **response** (references interview_id)  
3. **feedback** (references interview_id)
4. **interview_coding_question** (references interview_id)
5. **interview** (main table)

## Enhanced Error Logging

The updated endpoint now provides:
- Stack traces for debugging
- Database error details and hints
- User permission context
- Timestamps for error tracking

## Testing the Fix

```bash
# Health check
curl -X GET "http://localhost:3000/api/delete-interview"

# Test with non-existent ID (should return 404)
curl -X DELETE "http://localhost:3000/api/delete-interview?id=test-123"

# Test with real interview ID (replace with actual ID)
curl -X DELETE "http://localhost:3000/api/delete-interview?id=YOUR_INTERVIEW_ID"
```

## Next Steps

If you encounter interview deletion issues:

1. **Check the browser console** for specific error messages
2. **Look at server logs** for detailed database errors
3. **Verify the interview exists** in your database
4. **Check user permissions** and organization membership
5. **Test with a simple curl command** to isolate frontend vs backend issues

The fix ensures proper error handling and should resolve the original 500 error you encountered. 
