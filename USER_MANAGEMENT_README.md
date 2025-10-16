# User Management System

This document describes the user management system implemented for the call center application.

## User Roles and Hierarchy

The system implements a hierarchical user structure with the following roles:

1. **Super Admin** (Top level)
   - Only one super admin exists in the system
   - Can create other super admins (only developers have this right)
   - Can create admins
   - Can create agents

2. **Admins** (Second level)
   - Created by super admins
   - Three designations:
     - Call Center Admin
     - Marketing Admin
     - Compliance Admin
   - Can create agents

3. **Agents** (Third level)
   - Created by super admins or admins
   - Three types:
     - Recovery Agents (call loan defaulters)
     - Marketing Agents (brand ambassadors)
     - Compliance Agents (call loan officers)

## Agent Categories

### Recovery Agents
- Managed by: Call Center Admin
- Groups:
  - CC1
  - CC2
  - Field Agents
  - IDC

### Marketing Agents
- Managed by: Marketing Admin
- Assigned to regions:
  - Region A
  - Region B
  - Region C
  - Region D
  - Region E

### Compliance Agents
- Managed by: Compliance Admin
- No specific designation
- Work is to call Loan Officers and Collections Officers to ensure compliance

## Implementation Details

### Components
1. `UserManagementPage` - Main page component that displays users and allows adding new users

### Hooks
1. `useUsers` - Custom hook for managing user data and API interactions

### Services
1. Extended `api.ts` with user management interfaces and API methods

### Routes
1. `/user-management` - Main user management page

## Access Control

- Super Admins can create any type of user
- Admins can only create agents
- Regular users have no user management privileges

## Future Enhancements

1. Implement actual API endpoints for user management
2. Add user editing capabilities
3. Add user deactivation/reactivation functionality
4. Implement more sophisticated permission checking
5. Add user profile management
6. Add password reset functionality