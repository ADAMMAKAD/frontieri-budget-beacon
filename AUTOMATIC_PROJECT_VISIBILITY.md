# Automatic Project Visibility System

## Overview

The Budget Beacon application has a **robust automatic project visibility system** that ensures projects are automatically visible to users when they are added to project teams. This functionality works seamlessly across both the Budget Planning Dashboard and the Profile "My Projects" section.

## How It Works

### 1. Backend Logic (Automatic Filtering)

The core logic is implemented in the backend API endpoints:

#### `/api/projects` Endpoint
- **File**: `backend/routes/projects.js` (lines 58-63)
- **Logic**: Non-admin users can only see projects where they are either:
  - The project manager (`project_manager_id` matches their user ID)
  - A team member (their `user_id` exists in the `project_teams` table for that project)

```javascript
// Automatic role-based filtering
if (user.role !== 'admin') {
    whereConditions.push(`(
        p.project_manager_id = ? OR 
        p.id IN (SELECT project_id FROM project_teams WHERE user_id = ?)
    )`);
    queryParams.push(user.id, user.id);
}
```

#### `/api/project-teams/user-projects/:user_id` Endpoint
- **File**: `backend/routes/project-teams.js` (lines 150-220)
- **Logic**: Specifically fetches projects where a user is a team member
- **Returns**: Project details with team role and business unit information

### 2. Frontend Integration

#### Budget Planning Dashboard
- **File**: `src/components/BudgetPlanning.tsx`
- **API Call**: Uses `apiClient.getProjects()` which automatically filters based on team membership
- **Result**: Only shows projects where the user is a team member or project manager

#### Profile "My Projects" Section
- **File**: `src/components/ProfileManagement.tsx` (lines 300-454)
- **API Call**: Uses `apiClient.getUserProjects(userId)` which calls `/api/project-teams/user-projects/${userId}`
- **Display**: Shows projects with team role, joined date, and project details

#### Overview Dashboard
- **File**: `src/components/OverviewDashboard.tsx`
- **API Call**: Uses `apiClient.getProjects()` with automatic filtering
- **Result**: Dashboard metrics and project lists reflect team membership

## Automatic Visibility Features

### ✅ What Works Automatically

1. **Immediate Visibility**: When a user is added to a project team, the project becomes immediately visible
2. **Role-Based Access**: Different views based on user role (admin, project manager, team member)
3. **Cross-Component Consistency**: Same visibility logic across all components
4. **Real-Time Updates**: Changes reflect immediately without requiring page refresh
5. **Secure Filtering**: Backend enforces visibility rules, preventing unauthorized access

### 🔧 Key Components

1. **Project Team Management**
   - **File**: `src/components/ProjectTeamManagement.tsx`
   - **Function**: Add/remove team members
   - **Effect**: Automatically updates project visibility

2. **API Client**
   - **File**: `src/lib/api.ts`
   - **Methods**: `getProjects()`, `getUserProjects(userId)`
   - **Security**: Uses JWT tokens for authentication

3. **Database Schema**
   - **Tables**: `projects`, `project_teams`, `users`
   - **Relationships**: Foreign keys ensure data integrity
   - **Indexes**: Optimized for fast visibility queries

## Implementation Details

### Adding Team Members (Automatic Visibility Trigger)

```javascript
// When adding a team member via API
POST /api/project-teams
{
    "project_id": 123,
    "user_id": 456,
    "role": "member"
}

// Result: User 456 can now see Project 123 automatically
```

### Project Creation with Team Members

```javascript
// In BudgetPlanning.tsx createProject function
const createProject = async () => {
    // 1. Create project
    const projectResponse = await apiClient.createProject(projectData);
    
    // 2. Add team members (automatic visibility)
    for (const member of selectedTeamMembers) {
        await apiClient.addProjectTeamMember({
            project_id: project.id,
            user_id: member.id,
            role: member.role
        });
    }
    
    // 3. Team members can now see the project automatically
};
```

## Testing Automatic Visibility

The system has been thoroughly tested with the following scenarios:

1. ✅ **Before Team Addition**: Project is NOT visible to user
2. ✅ **After Team Addition**: Project is AUTOMATICALLY visible to user
3. ✅ **General Projects API**: Filters correctly based on team membership
4. ✅ **User Projects API**: Returns correct team member projects
5. ✅ **Cross-Component Consistency**: Same visibility across all UI components

## Security Considerations

1. **Backend Enforcement**: Visibility rules are enforced at the API level
2. **JWT Authentication**: All requests require valid authentication tokens
3. **Role-Based Access**: Different access levels for admin, manager, and member roles
4. **SQL Injection Prevention**: Parameterized queries prevent injection attacks
5. **Authorization Checks**: Each endpoint verifies user permissions

## Performance Optimization

1. **Efficient Queries**: JOIN operations minimize database calls
2. **Indexed Lookups**: Database indexes on `user_id` and `project_id`
3. **Caching Strategy**: Frontend caches project data with automatic invalidation
4. **Pagination Support**: Large project lists are paginated for performance

## Troubleshooting

If automatic visibility is not working:

1. **Check Team Membership**: Verify user is actually added to `project_teams` table
2. **Verify API Calls**: Ensure frontend is calling correct API endpoints
3. **Authentication**: Confirm JWT token is valid and not expired
4. **Database Integrity**: Check foreign key relationships are intact
5. **Role Permissions**: Verify user has appropriate role assignments

## Future Enhancements

Potential improvements to the automatic visibility system:

1. **Real-Time Notifications**: WebSocket updates when team membership changes
2. **Granular Permissions**: More detailed role-based access controls
3. **Audit Logging**: Track when users gain/lose project access
4. **Bulk Operations**: Efficiently add multiple users to multiple projects
5. **Advanced Filtering**: Additional filters based on project status, dates, etc.

## Conclusion

The automatic project visibility system in Budget Beacon is **already fully functional and robust**. It provides:

- ✅ Immediate visibility when users are added to project teams
- ✅ Consistent behavior across all UI components
- ✅ Secure, backend-enforced access controls
- ✅ Optimal performance with efficient database queries
- ✅ Comprehensive testing and validation

No additional implementation is required - the system works automatically as designed.