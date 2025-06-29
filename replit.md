# GVPCEW Leave Management System

## Project Overview
A comprehensive leave management system for Gayatri Vidya Parishad College of Engineering for Women (GVPCEW) with multi-role functionality, database persistence, and advanced workflow management.

## User Requirements
- Database persistence for all user data and leave applications
- Multi-level approval workflow: Class Teacher → HOD → Admin (Vice Principal)
- Automatic routing based on leave duration and user roles
- Enhanced UI/UX with professional design
- Real-time dashboard updates
- Complete functionality for all user roles

## System Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with Passport authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket connections for live updates
- **File Upload**: Multer for document attachments

## User Roles & Permissions
1. **Student**: Submit applications, view status, use templates
2. **Faculty**: Submit applications, review student requests, manage substitutes
3. **Class Teacher**: Approve/reject student applications, forward to HOD
4. **HOD**: Final approval for long leaves, manage department
5. **Admin/Vice Principal**: System oversight, handle HOD leaves

## Approval Workflow
- **Short Leave (1-3 days)**: Student → Class Teacher → Approved
- **Long Leave (4+ days)**: Student → Class Teacher → HOD → Approved
- **Faculty Leave**: Faculty → HOD → (if long leave) → Admin
- **HOD Leave**: HOD → Admin → Approved

## Recent Changes
- **DOMException & Network Stability Fixes (Jan 29, 2025)**:
  * Implemented comprehensive error boundary system for graceful DOMException handling
  * Enhanced query client with retry logic, exponential backoff, and timeout management
  * Added robust WebSocket connection handling with automatic reconnection
  * Improved CORS configuration with proper headers and cache control
  * Enhanced server-side error handling with detailed logging and response formatting
- **Critical System Fixes (Jan 29, 2025)**: 
  * Fixed leave calculation error where 1-day applications were reducing balance by 4 days
  * Corrected Math.ceil to Math.floor for proper inclusive date range calculation
  * Fixed leave application storage with automatic leave days calculation
  * Ensured class teacher review workflow routes properly to section-specific teachers
  * Fixed authentication errors and session management
- **Authentication Issue Resolved (Jan 29, 2025)**: Fixed "Not authenticated" error during leave application submissions by correcting bcrypt password hashing in database
- **DOMException Error Resolution (Jan 2025)**: Fixed persistent Vite connection errors with enhanced CORS configuration, network error handling, and proper authentication flow
- Database migration from memory to PostgreSQL with pendingLeaves field
- Enhanced session management with proper authentication and bcrypt password hashing
- Multi-level approval workflow implementation with leave balance tracking
- Real-time WebSocket notifications with automatic dashboard refresh every 5 seconds
- Advanced UI components: Calendar, Analytics, Templates
- Role-based dashboard themes and functionality
- Student data import system from Excel file (GVPCEW 4th year students)
- Comprehensive leave balance management:
  * Available leaves reduce when application is submitted (moved to pending)
  * Pending leaves convert to used leaves when approved
  * Pending leaves return to available when rejected
  * Automatic leave days calculation and validation
- Section-specific class teacher assignments (CSE1: Gowthami, CSE2: Y Sowmya, CSE3: M Pavani)
- College name corrected to "Gayatri Vidya Parishad College of Engineering for Women"
- **Network Stability Improvements**: Added retry logic, proper CORS headers, and graceful error handling for production stability
- **Student Review Workflow Complete (Jan 29, 2025)**:
  * Faculty dashboard now shows student applications in "Student Reviews" tab with approve/reject buttons
  * Comprehensive notification system sends email and WhatsApp messages to students when applications are reviewed
  * Real-time WebSocket notifications update dashboards instantly when applications are submitted or reviewed
  * Class teacher assignments working correctly: CSE1 → Gowthami, CSE2 → Y Sowmya, CSE3 → M Pavani
  * Comments field required for all review decisions to ensure proper feedback
- **University-Wide Expansion (Jan 29, 2025)**:
  * Extended system to support all university students across 1st, 2nd, 3rd, and 4th years
  * Added support for exact 5 departments: CSE, ECE, IT, CSM, EEE (3 sections per year each)
  * Created comprehensive faculty hierarchy with HODs for each department
  * Implemented advanced analytics dashboard showing department-wise statistics and trends
  * Enhanced WhatsApp integration with bulk messaging for holiday announcements and reminders
  * Added university-wide calendar view with multi-department leave tracking
  * Integrated advanced notification system with both email and WhatsApp delivery
- **Department Structure Update (Jan 29, 2025)**:
  * Configured exact university structure: CSE, ECE, IT, CSM, EEE departments
  * Each department has 3 sections (A, B, C) for all 4 years (1st, 2nd, 3rd, 4th)
  * Updated student ID generation and faculty assignments to match structure
  * Class teacher assignments per section with proper routing workflow

## Technical Decisions
- Using Drizzle ORM for type-safe database operations
- Passport.js for authentication with session persistence
- WebSocket for real-time updates
- File upload system for leave attachments
- Email notifications for approval workflow

## User Preferences
- Professional, luxury design aesthetic
- Comprehensive functionality over simplicity
- Real-time updates and notifications
- Mobile-responsive design
- Advanced analytics and reporting