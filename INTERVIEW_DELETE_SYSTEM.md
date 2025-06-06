# Interview Deletion System

## Overview

A comprehensive and secure interview deletion system that allows authorized users to delete interviews from both the regular dashboard and admin interface. The system includes proper confirmation modals, cascading data deletion, access control, and user feedback.

## Features Implemented

### 🔒 **Secure Backend API**
- **Endpoint**: `DELETE /api/delete-interview?id={interviewId}`
- **Authentication**: Verifies user authentication and organization membership
- **Authorization**: Ensures only owners or organization members can delete interviews
- **Cascading Deletion**: Safely removes all associated data in correct order

### 🎯 **User Interface Components**
- **Delete Button**: Added to interview cards with trash icon
- **Confirmation Modal**: Prevents accidental deletions with detailed warnings
- **Loading States**: Visual feedback during deletion process
- **Toast Notifications**: Success/error messages after operations

### 📊 **Admin Dashboard Integration**
- **Interview Management Tab**: Dedicated section for interview administration
- **Bulk Operations**: Select and delete multiple interviews
- **Search & Filter**: Find specific interviews quickly
- **Statistics Dashboard**: Overview of system metrics

## Implementation Details

### 1. Backend API (`/api/delete-interview`)

#### **Security & Authorization**
```typescript
// Verify user authentication
const { data: { user }, error: userError } = await supabase.auth.getUser();

// Check organization membership
const hasAccess = 
  userData.organization_id === interview.organization_id ||
  user.id === interview.user_id;
```

#### **Cascading Deletion Order**
1. **Coding Submissions** → Delete submissions for all interview responses
2. **Responses** → Delete all interview responses  
3. **Feedback** → Delete interview feedback
4. **Coding Questions** → Delete interview-coding question relationships
5. **Interview** → Finally delete the interview record

```typescript
// Step-by-step deletion with error handling
const responseIds = responses.map(r => r.id);
await supabase.from("coding_submission").delete().in('response_id', responseIds);
await supabase.from("response").delete().eq('interview_id', interviewId);
await supabase.from("feedback").delete().eq('interview_id', interviewId);
await supabase.from("interview_coding_question").delete().eq('interview_id', interviewId);
await supabase.from("interview").delete().eq('id', interviewId);
```

### 2. Custom React Hook (`useDeleteInterview`)

#### **Features**
- Centralized deletion logic
- Loading state management
- Error handling with user feedback
- Success/error callbacks

```typescript
const { deleteInterview, isDeleting, deleteError } = useDeleteInterview({
  onSuccess: (interviewId, interviewName) => {
    // Handle successful deletion
    fetchInterviews();
  },
  onError: (error) => {
    // Handle deletion errors
    console.error('Delete error:', error);
  }
});
```

### 3. Confirmation Modal Component

#### **Features**
- Clear warning messages
- Interview name display
- Loading state during deletion
- Accessible design with proper ARIA labels

```tsx
<DeleteConfirmationModal
  isOpen={showDeleteModal}
  onClose={handleDeleteCancel}
  onConfirm={handleDeleteConfirm}
  title="Delete Interview"
  description="Detailed warning about permanent deletion..."
  itemName={interviewName}
  isLoading={isDeleting}
  destructiveAction="Delete Interview"
/>
```

### 4. Enhanced Interview Card

#### **New Props**
```typescript
interface Props {
  // Existing props...
  onDeleted?: (interviewId: string) => void;
  showDeleteButton?: boolean;
}
```

#### **Features**
- Optional delete button (controlled by `showDeleteButton` prop)
- Smooth animations for card removal
- Integrated confirmation modal
- Disabled state during deletion

### 5. Admin Dashboard

#### **Tabbed Interface**
- **Overview**: System status and quick actions
- **Interviews**: Comprehensive interview management
- **Agents**: Retell agent synchronization  
- **Settings**: System configuration

#### **Interview Management Features**
- **Search**: Find interviews by name or description
- **Filter**: Active, archived, or all interviews
- **Sort**: By creation date, name, or response count
- **Bulk Selection**: Select multiple interviews for batch operations
- **Statistics**: Live counts and metrics

## Usage Guide

### For Regular Users (Dashboard)

1. **Navigate to Dashboard**: Go to `/dashboard`
2. **Locate Interview**: Find the interview card you want to delete
3. **Click Delete**: Press the red trash icon on the interview card
4. **Confirm Deletion**: Review the warning and confirm in the modal
5. **Success Feedback**: See toast notification and card removal

### For Administrators (Admin Dashboard)

1. **Access Admin Panel**: Navigate to `/dashboard/admin`
2. **Go to Interviews Tab**: Click on "Interviews" tab
3. **Use Search/Filter**: Find specific interviews if needed
4. **Select Interviews**: 
   - Individual: Click delete button on interview card
   - Bulk: Check boxes to select multiple interviews
5. **Delete Operations**:
   - Single: Confirm in modal dialog
   - Bulk: Use "Delete Selected" button
6. **Monitor Results**: View real-time statistics and confirmations

## Database Schema Considerations

### Tables Affected by Deletion

1. **`coding_submission`** → References `response.id`
2. **`response`** → References `interview.id`
3. **`feedback`** → References `interview.id`
4. **`interview_coding_question`** → References `interview.id` (CASCADE)
5. **`interview`** → Primary table

### Relationship Handling

```sql
-- Automatic CASCADE (already configured)
interview_coding_question.interview_id → interview.id ON DELETE CASCADE

-- Manual deletion (handled by API)
response.interview_id → interview.id
feedback.interview_id → interview.id
coding_submission.response_id → response.id
```

## Security Features

### Access Control Matrix

| User Type | Dashboard Delete | Admin Bulk Delete | Cross-Org Access |
|-----------|------------------|-------------------|-------------------|
| Owner | ✅ Own interviews | ✅ Org interviews | ❌ Forbidden |
| Org Member | ✅ Own interviews | ✅ Org interviews | ❌ Forbidden |
| External User | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |

### Authentication Checks

1. **User Authentication**: Valid session required
2. **Interview Ownership**: User owns interview OR user belongs to interview's organization
3. **Organization Membership**: Verified through user table lookup
4. **Resource Validation**: Interview exists and is accessible

## Error Handling

### API Level

```typescript
// Comprehensive error responses
try {
  // Deletion logic
} catch (error) {
  return NextResponse.json({
    error: "Failed to delete interview",
    details: error.message
  }, { status: 500 });
}
```

### Frontend Level

```typescript
// User-friendly error messages
toast.error(`Failed to delete interview: ${errorMessage}`, {
  position: "bottom-right",
  duration: 5000,
});
```

### Error Categories

1. **Authentication Errors**: User not logged in
2. **Authorization Errors**: No permission to delete
3. **Validation Errors**: Invalid interview ID
4. **Database Errors**: Failed deletion operations
5. **Network Errors**: API communication failures

## User Experience Features

### Visual Feedback

1. **Loading States**: Buttons show spinners during operations
2. **Disabled States**: Prevent multiple clicks during deletion
3. **Animations**: Smooth card removal transitions
4. **Toast Notifications**: Success/error messages

### Accessibility

1. **Keyboard Navigation**: All controls accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and descriptions
3. **Color Contrast**: High contrast for delete buttons and warnings
4. **Focus Management**: Proper focus handling in modals

## Testing Scenarios

### Functional Tests

1. **Successful Deletion**: Complete interview removal
2. **Permission Denied**: Cross-organization access blocked
3. **Invalid Interview**: Non-existent interview ID
4. **Network Failure**: API unavailable handling
5. **Partial Failure**: Some data deletion fails

### User Interface Tests

1. **Modal Behavior**: Open/close/confirm/cancel flows
2. **Loading States**: Visual feedback during operations
3. **Error Display**: Error message presentation
4. **Bulk Operations**: Multiple selection and deletion
5. **Search/Filter**: Finding specific interviews

### Security Tests

1. **Authentication Bypass**: Unauthorized access attempts
2. **CSRF Protection**: Cross-site request forgery prevention
3. **SQL Injection**: Malicious input handling
4. **Rate Limiting**: Excessive deletion attempts

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**: Efficient bulk deletions
2. **Transaction Safety**: Atomic deletion operations
3. **Cascade Optimization**: Database-level cascading where possible
4. **Index Usage**: Optimized query performance
5. **Memory Management**: Efficient data handling for large datasets

### Monitoring Metrics

1. **Deletion Success Rate**: Track completion percentage
2. **Response Times**: API performance monitoring
3. **Error Rates**: Failed deletion tracking
4. **User Activity**: Deletion frequency and patterns

## Future Enhancements

### Planned Features

1. **Soft Delete**: Archive instead of permanent deletion
2. **Audit Logging**: Track all deletion activities
3. **Undo Functionality**: Restore recently deleted interviews
4. **Export Before Delete**: Download data before removal
5. **Scheduled Deletion**: Automatic cleanup of old interviews

### Administrative Features

1. **Deletion Policies**: Organization-level deletion rules
2. **Approval Workflows**: Multi-step deletion approval
3. **Backup Integration**: Automatic backup before deletion
4. **Compliance Features**: GDPR/data retention compliance

## Deployment Checklist

### Prerequisites

- ✅ Database schema with proper relationships
- ✅ Authentication system configured
- ✅ User/organization context available
- ✅ Toast notification system
- ✅ Modal components available

### Environment Variables

```bash
# Required for API functionality
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Configuration Steps

1. **Database Setup**: Ensure all tables and relationships exist
2. **API Deployment**: Deploy deletion endpoint
3. **Frontend Build**: Build with new components
4. **Testing**: Run complete test suite
5. **Documentation**: Update user guides
6. **Monitoring**: Set up deletion tracking

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check user authentication
   - Verify organization membership
   - Ensure interview ownership

2. **Deletion Fails**
   - Check database constraints
   - Verify foreign key relationships
   - Review cascade settings

3. **UI Not Responding**
   - Check network connectivity
   - Verify API endpoint availability
   - Review browser console for errors

4. **Data Inconsistency**
   - Run database integrity checks
   - Verify cascade deletion completed
   - Check for orphaned records

### Support Procedures

1. **Check Application Logs**: Review server-side errors
2. **Database Audit**: Verify data consistency
3. **User Communication**: Inform users of any issues
4. **Rollback Plan**: Restore from backup if needed

This comprehensive deletion system provides a secure, user-friendly way to manage interview data while maintaining system integrity and providing excellent user experience. 
