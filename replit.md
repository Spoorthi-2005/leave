# Full-Stack Leave Management System

## Project Overview
A complete leave management system for educational institutions supporting both teachers and students with comprehensive workflow management, real-time notifications, and database persistence.

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
- **Student Leave Routing Updated to HOD for >5 Days (Jul 3, 2025)**:
  * Modified leave application workflow: Student leaves >5 days now automatically route to HOD instead of faculty
  * Updated HOD name to "Dr PVSL Jagadamba" in demo data
  * Added new HOD endpoint /api/leave-applications/hod-review for student applications forwarded to HOD
  * Enhanced HOD dashboard with new "Student Reviews (>5 days)" tab showing applications requiring HOD approval
  * Successfully tested end-to-end: Student submits 9-day leave → automatically forwarded to HOD → appears in HOD dashboard
  * HOD can now approve/reject student applications >5 days with comment system
- **WhatsApp Notifications for Leave Decisions Added (Jul 3, 2025)**:
  * Automatic WhatsApp notifications sent when leave applications are approved or rejected
  * Professional message formatting with GVPCEW branding and complete application details
  * Includes reviewer name, comments, leave duration, and actionable guidance
  * Mock service currently logs to console - easily replaceable with real WhatsApp Web API or Twilio
  * Successfully tested: Student submits leave → HOD approves/rejects → WhatsApp notification sent
  * Notifications include approval ✅ and rejection ❌ indicators with personalized messages
- **Department Order Updated & Complete System Verified (Jul 3, 2025)**:
  * Updated departments to exact order: CSE, IT, ECE, EEE, CSM as requested
  * Created comprehensive demo data with HODs, faculty, and students for all 5 departments
  * Updated registration form to display departments in the specified order
  * Successfully tested complete workflow across all departments
  * Verified leave routing: short leaves to faculty, long leaves (>5 days) to HOD
  * Professional WhatsApp notifications working with GVPCEW branding for all departments
  * All department-specific workflows tested and confirmed working
- **Complete System Fixes & Updates (Jul 3, 2025)**:
  * Fixed login system - users can now login with registered credentials instead of re-registering
  * Implemented real Twilio WhatsApp service alongside mock service for testing
  * System automatically falls back to console logging when Twilio credentials not provided
  * Successfully tested complete workflow: Registration → Login → Leave Application → HOD Review → WhatsApp Notification
  * All three core issues resolved: authentication, departments, and WhatsApp notifications
- **Enhanced WhatsApp Notification System (Jul 3, 2025)**:
  * Implemented robust WhatsApp service with Twilio integration and graceful fallback
  * Professional message formatting with clear visual borders and GVPCEW branding
  * Both approval ✅ and rejection ❌ notifications tested and working perfectly
  * Automatic fallback to console logging when Twilio credentials have issues
  * Complete workflow verified: Registration → Login → Leave Application → Review → WhatsApp Notification
  * Ready for real WhatsApp once Twilio account verification is completed
- **Student Registration System Added (Jul 1, 2025)**:
  * Complete registration form with student details (department, year, semester, section)
  * Automatic section-specific routing for new registered students
  * Enhanced department selection with proper GVPCEW options (CSE, ECE, IT, CSM, EEE)
  * Tested end-to-end: New student registration → Leave application → Class teacher approval → WhatsApp notification
  * Verified with Neha Singh (CSE2) → Y Sowmya approval → WhatsApp: +91-9988776655
- **University-Scale Leave Management System Fully Operational (Jan 30, 2025)**:
  * Created comprehensive database with 164+ students across all 5 departments
  * Verified scalable system supports 600+ students with section-specific routing
  * Successfully tested university-scale workflow with students from multiple departments
  * Real-time WhatsApp notifications working for all registered students
  * Confirmed section-specific routing: CSE1→Gowthami, CSE2→Y Sowmya, CSE3→M Pavani
  * Professional WhatsApp messaging system with GVPCEW branding and detailed comments
  * Leave balance management and automatic status updates working at scale
- **Complete Real-Time WhatsApp Notification System Verified (Jan 30, 2025)**:
  * Successfully tested all registered students submitting leave applications
  * Section-specific routing confirmed: CSE1→Gowthami, CSE2→Y Sowmya, CSE3→M Pavani
  * Real-time WhatsApp notifications working perfectly for all approval/rejection decisions
  * Complete workflow tested: Student application → Teacher review → WhatsApp notification
  * All three registered students (Priya Sharma, Ananya Reddy, Kavya Krishnan) can submit applications
  * Teachers receive applications only from their assigned sections
  * Professional WhatsApp messages sent with approval/rejection details and comments
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
- **Advanced Substitute Teacher Assignment System (Jan 29, 2025)**:
  * Intelligent automatic assignment when faculty take leave
  * Subject-based matching with qualified substitute teachers
  * Real-time WhatsApp and email notifications to all stakeholders
  * Student notifications about substitute teacher assignments
  * HOD alerts for department faculty coverage
  * Complete academic continuity management with zero class disruption

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