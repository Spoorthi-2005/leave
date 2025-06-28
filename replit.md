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
- Database migration from memory to PostgreSQL with pendingLeaves field
- Enhanced session management with proper authentication
- Multi-level approval workflow implementation with leave balance tracking
- Real-time WebSocket notifications
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