# GVPCEW Leave Management System - Complete Guide

## How The System Works

### 1. USER AUTHENTICATION & ROLES
- **Multi-role system**: Students, Faculty, Class Teachers, HOD, Admin
- **Secure login**: bcrypt password hashing with session management
- **Role-based access**: Different dashboards and permissions per role

### 2. LEAVE BALANCE TRACKING SYSTEM
```
Initial Balance: 20 leaves per year
When Application Submitted: Available → Pending
When Approved: Pending → Used
When Rejected: Pending → Available (returned)
```

### 3. APPROVAL WORKFLOW
**Short Leave (1-3 days):**
Student → Class Teacher → Approved

**Long Leave (4+ days):**
Student → Class Teacher → HOD → Approved

**Faculty Leave:**
Faculty → HOD → (if long) → Admin

### 4. SECTION-BASED ROUTING
- **CSE1 Students** → Gowthami (Class Teacher)
- **CSE2 Students** → Y Sowmya (Class Teacher)
- **CSE3 Students** → M Pavani (Class Teacher)

### 5. STUDENT DATA IMPORT
- **Excel Integration**: Import 4th year student database
- **Automatic Assignment**: Students get proper sections and class teachers
- **Leave Balance Creation**: Each student gets 20 annual leaves

## TECHNICAL ARCHITECTURE

### Frontend (React + TypeScript)
- **Routing**: Wouter for page navigation
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui with Tailwind CSS
- **Authentication**: Custom useAuth hook with session management

### Backend (Express.js + Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Sessions**: PostgreSQL session store
- **Real-time**: WebSocket for notifications

### Database Schema
```sql
- users (students, faculty, admin)
- leave_applications (with approval workflow)
- leave_balance (available, used, pending)
- notifications (real-time updates)
- substitute_assignments (for faculty)
```

## USER WORKFLOW EXAMPLES

### Student Submitting Leave:
1. Login → Student Dashboard
2. Click "Apply for Leave"
3. Fill form (dates, reason, type)
4. System calculates days and checks balance
5. Available leaves move to pending
6. Application routes to class teacher
7. Real-time notification sent

### Class Teacher Reviewing:
1. Login → Faculty Dashboard
2. View "Pending Applications" tab
3. See student applications from their section
4. Review details, approve/reject
5. If long leave → forwards to HOD
6. Student gets notification

### Admin Managing System:
1. Login → Admin Dashboard
2. Click "Import Students" → loads Excel data
3. View system statistics
4. Monitor all applications
5. Handle HOD leave requests

## KEY FEATURES

### Real-time Updates
- WebSocket notifications
- Live dashboard refreshes
- Instant status changes

### Leave Balance Management
- Automatic calculation
- Prevents over-application
- Tracks pending vs used leaves

### Professional UI
- Luxury design aesthetic
- Mobile responsive
- Role-specific themes

### Data Import
- Excel file processing
- Automatic user creation
- Section assignment

## SECURITY FEATURES
- bcrypt password hashing
- Session-based authentication
- Role-based access control
- CSRF protection
- Secure cookie configuration

## COLLEGE-SPECIFIC FEATURES
- Gayatri Vidya Parishad College branding
- Section-based class teacher mapping
- 4th year CSE student database
- Academic calendar integration