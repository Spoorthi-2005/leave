# GVPCEW Leave Management System - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Workflow Logic](#workflow-logic)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Authentication System](#authentication-system)
10. [Leave Balance Management](#leave-balance-management)
11. [Notification System](#notification-system)
12. [Deployment Guide](#deployment-guide)
13. [Testing](#testing)

---

## Project Overview

The GVPCEW (Gayatri Vidya Parishad College of Engineering for Women) Leave Management System is a comprehensive full-stack web application designed to streamline leave application processes across multiple departments in an educational institution.

### Key Features
- **Universal Access**: Any user can register and login across the entire university
- **Multi-Department Support**: CSE, IT, ECE, EEE, CSM departments
- **Intelligent Workflow Routing**: Automatic routing based on leave type, duration, and user roles
- **Real-time Notifications**: WhatsApp integration for instant communication
- **Complete Leave History**: All applications preserved for audit trail
- **Enhanced Leave Balance**: Tracks total, used, pending, and available leaves
- **Admin Dashboard**: Dedicated interface for faculty leave approvals >10 days

---

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React + TS    │◄──►│   Express.js    │◄──►│   PostgreSQL    │
│   Tailwind CSS  │    │   Node.js       │    │   Drizzle ORM   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   WhatsApp      │              │
         └──────────────►│   Integration   │◄─────────────┘
                        │   Twilio/Web    │
                        └─────────────────┘
```

### Architecture Principles
- **Separation of Concerns**: Clear separation between frontend, backend, and data layers
- **Role-Based Access Control**: Different interfaces and permissions based on user roles
- **Scalable Design**: Supports university-wide deployment with thousands of users
- **Real-time Updates**: WebSocket connections for live dashboard updates
- **Fault Tolerance**: Graceful fallbacks for external services

---

## Technology Stack

### Frontend
- **React 18**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Wouter**: Lightweight React router
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Form validation and management
- **Framer Motion**: Animation library

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type-safe server development
- **Passport.js**: Authentication middleware
- **Express Session**: Session management
- **bcrypt**: Password hashing
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: API rate limiting

### Database
- **PostgreSQL**: Relational database management system
- **Drizzle ORM**: Type-safe database toolkit
- **Connection Pooling**: Efficient database connections

### External Services
- **Twilio**: WhatsApp Business API integration
- **WhatsApp Web**: Alternative messaging solution
- **SendGrid**: Email notifications (optional)

### Development Tools
- **Vite**: Fast build tool and development server
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **tsx**: TypeScript execution

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  department TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Leave Applications Table
```sql
CREATE TABLE leave_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type leave_type NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  reason TEXT NOT NULL,
  status leave_status DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Leave Balance Table
```sql
CREATE TABLE leave_balance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  year INTEGER NOT NULL,
  total INTEGER DEFAULT 20,
  used INTEGER DEFAULT 0,
  pending INTEGER DEFAULT 0,
  available INTEGER DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Enums
```sql
-- User roles
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'hod', 'admin');

-- Leave types
CREATE TYPE leave_type AS ENUM ('sick', 'personal', 'emergency', 'vacation');

-- Leave status
CREATE TYPE leave_status AS ENUM (
  'pending', 'approved', 'rejected', 
  'forwarded_to_admin', 'forwarded_to_hod',
  'admin_pending', 'admin_approved', 'admin_rejected'
);
```

---

## User Roles & Permissions

### Student
- **Access**: Student dashboard, leave application form
- **Permissions**: 
  - Submit leave applications
  - View own application history
  - Check leave balance
  - Receive notifications
- **Workflow**: Applications >5 days automatically route to HOD

### Teacher/Faculty
- **Access**: Faculty dashboard, leave application form, student review interface
- **Permissions**:
  - Submit leave applications (>10 days route to admin)
  - Review student applications from assigned sections
  - Approve/reject with comments
  - View department statistics
- **Workflow**: Can approve student leaves up to HOD threshold

### HOD (Head of Department)
- **Access**: HOD dashboard, department management
- **Permissions**:
  - Review student applications >5 days
  - Manage department faculty
  - View department-wide statistics
  - Final approval for long student leaves
- **Workflow**: Receives escalated student applications

### Admin (Vice Principal)
- **Access**: Admin dashboard, system-wide management
- **Permissions**:
  - Review faculty applications >10 days
  - System-wide oversight
  - Manage all user roles
  - Access complete audit trail
- **Workflow**: Final authority for faculty leaves

---

## Workflow Logic

### Leave Application Routing

```
Student Application:
├─ ≤5 days → Class Teacher → Approved/Rejected
└─ >5 days → Class Teacher → HOD → Approved/Rejected

Faculty Application:
├─ ≤10 days → HOD → Approved/Rejected
└─ >10 days → Admin → Approved/Rejected

HOD Application:
└─ Any duration → Admin → Approved/Rejected
```

### Leave Balance Workflow

```
Application Submitted:
Available Leaves → Pending Leaves

Application Approved:
Pending Leaves → Used Leaves

Application Rejected:
Pending Leaves → Available Leaves (returned)
```

### Status Transitions

```
pending → approved/rejected (normal flow)
pending → forwarded_to_hod (student >5 days)
pending → admin_pending (faculty >10 days)
admin_pending → admin_approved/admin_rejected
```

---

## API Endpoints

### Authentication
```
POST /api/register    - User registration
POST /api/login       - User login
POST /api/logout      - User logout
GET  /api/user        - Get current user
```

### Leave Applications
```
POST /api/leave-applications           - Create new application
GET  /api/leave-applications           - Get user's applications
GET  /api/my-leave-applications        - Alias for user applications
POST /api/review-application/:id       - Review application
GET  /api/pending-applications         - Get pending reviews
```

### Leave Balance
```
GET /api/leave-balance/:year    - Get user's leave balance
```

### Admin Endpoints
```
GET  /api/admin/pending-applications     - Get admin pending reviews
GET  /api/admin/faculty-applications     - Get all faculty applications
POST /api/admin/review-application/:id   - Admin review faculty leave
```

### HOD Endpoints
```
GET /api/hod-review                     - Get HOD pending reviews
GET /api/leave-applications/hod-review  - Get student apps for HOD
```

### Statistics
```
GET /api/teacher/stats    - Teacher dashboard statistics
```

---

## Frontend Components

### Page Components
- **AuthPage**: Login/registration interface
- **StudentDashboard**: Student leave management interface
- **TeacherDashboard**: Faculty leave and review interface
- **HODDashboard**: Department management interface
- **AdminDashboard**: System-wide management interface

### Shared Components
- **ProtectedRoute**: Route protection based on authentication
- **LeaveApplicationForm**: Reusable form for leave submissions
- **ApplicationCard**: Display component for leave applications
- **StatsCard**: Dashboard statistics display
- **NotificationToast**: User feedback system

### UI Components (shadcn/ui)
- **Button, Card, Dialog, Form, Input, Select, Textarea**
- **Badge, Tabs, Calendar, Progress, Toast**
- **Custom styling with Tailwind CSS**

---

## Authentication System

### Session-Based Authentication
- **Passport.js**: Local strategy with username/password
- **Session Management**: Express sessions with PostgreSQL store
- **Password Security**: bcrypt hashing with salt rounds
- **CSRF Protection**: Built-in session security

### User Registration Flow
```javascript
1. Validate input data
2. Check for existing username/email
3. Hash password with bcrypt
4. Create user record
5. Auto-login user
6. Redirect to appropriate dashboard
```

### Role-Based Access Control
```javascript
// Middleware example
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
```

---

## Leave Balance Management

### Balance Calculation Logic
```javascript
// Initial balance: 20 days per year
const ANNUAL_LEAVE_DAYS = 20;

// Application submission
available -= requestedDays;
pending += requestedDays;

// Application approval
pending -= requestedDays;
used += requestedDays;

// Application rejection
pending -= requestedDays;
available += requestedDays; // returned
```

### Balance Tracking
- **Total**: Annual allocation (default: 20 days)
- **Used**: Approved leave days consumed
- **Pending**: Days under review/processing
- **Available**: Remaining days for new applications

### Validation Rules
```javascript
// Pre-submission validation
if (available < requestedDays) {
  throw new Error("Insufficient leave balance");
}

// Date validation
if (startDate >= endDate) {
  throw new Error("Invalid date range");
}

// Duration calculation
const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
```

---

## Notification System

### WhatsApp Integration

#### Twilio WhatsApp Business API
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

async function sendWhatsAppMessage(to, message) {
  return await client.messages.create({
    from: 'whatsapp:+14155238886',
    to: `whatsapp:${to}`,
    body: message
  });
}
```

#### WhatsApp Web (Alternative)
```javascript
// Fallback to console logging for development
class WhatsAppWebService {
  async sendMessage(phoneNumber, message) {
    console.log(`📱 WhatsApp to ${phoneNumber}:`, message);
    return true;
  }
}
```

### Message Templates
```javascript
// Approval notification
const approvalMessage = `
🏛️ GVPCEW - Leave APPROVED ✅

Your leave application has been approved:
👤 Name: ${applicant.fullName}
📅 Leave: ${startDate} to ${endDate}
📝 Type: ${type.toUpperCase()}
💬 Comments: ${comments}

Your leave has been approved. Please coordinate with your department.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GVPCEW Leave Management System
`;
```

### Notification Triggers
- Application submission (to reviewers)
- Application approval (to applicant)
- Application rejection (to applicant)
- Status changes (to relevant parties)

---

## Deployment Guide

### Environment Setup
```bash
# Install dependencies
npm install

# Environment variables
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secret-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-whatsapp-number
```

### Database Setup
```bash
# Run migrations
npm run db:push

# Verify connection
npm run db:check
```

### Production Deployment
```bash
# Build frontend
npm run build

# Start production server
npm start

# Process manager (PM2)
pm2 start server/index.js --name "leave-management"
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

---

## Testing

### Test Accounts
```
Admin:    admin/password
HODs:     hod_cse/password, hod_it/password, etc.
Faculty:  faculty1/password, faculty_it/password, etc.
Students: teststudent/password, student_it/password, etc.
```

### Testing Scenarios

#### Student Workflow
1. Login as `teststudent/password`
2. Submit 3-day leave → Goes to class teacher
3. Submit 7-day leave → Routes to HOD
4. Check leave balance updates

#### Faculty Workflow
1. Login as `faculty1/password`
2. Submit 7-day leave → Goes to HOD
3. Submit 15-day leave → Routes to admin
4. Review student applications

#### Admin Workflow
1. Login as `admin/password`
2. Review faculty applications >10 days
3. Approve/reject with comments
4. Verify WhatsApp notifications

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test leave application
curl -X POST http://localhost:5000/api/leave-applications \
  -H "Content-Type: application/json" \
  -d '{"type":"sick","startDate":"2025-07-10","endDate":"2025-07-12","reason":"Testing"}'
```

---

## Project Structure

```
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── pages/             # Page components
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
│   └── index.html             # HTML template
├── server/                     # Backend Express application
│   ├── services/              # Business logic services
│   ├── auth.ts                # Authentication middleware
│   ├── db.ts                  # Database connection
│   ├── demo-data.ts           # Demo data initialization
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API route definitions
│   ├── security.ts            # Security middleware
│   ├── storage.ts             # Data access layer
│   └── whatsapp-*.ts          # WhatsApp integration
├── shared/                     # Shared type definitions
│   ├── schema.ts              # Database schema
│   └── types.ts               # TypeScript interfaces
├── package.json               # Dependencies and scripts
├── drizzle.config.ts          # Database configuration
├── vite.config.ts             # Build tool configuration
├── tailwind.config.ts         # Styling configuration
└── tsconfig.json              # TypeScript configuration
```

---

## Security Features

### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Session Security**: Secure session cookies
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Built-in session security

### API Security
- **Rate Limiting**: Prevents API abuse
- **CORS Configuration**: Controlled cross-origin access
- **Security Headers**: Helmet.js security middleware
- **Input Validation**: Zod schema validation
- **Error Handling**: Secure error responses

### Access Control
- **Role-Based Permissions**: Granular access control
- **Route Protection**: Authentication middleware
- **Session Management**: Secure session handling
- **Audit Trail**: Complete application history

---

This documentation provides a comprehensive overview of the GVPCEW Leave Management System. The system is designed for scalability, security, and ease of use, supporting the complete workflow of leave management in an educational institution.

For technical support or feature requests, please refer to the development team or system administrator.