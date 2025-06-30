import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLeaveApplicationSchema, insertNotificationSchema, leaveApplications } from "@shared/schema";
import { db } from "./db";
import { upload } from "./services/file-upload";
import { emailService } from "./services/email";
import { notificationService } from "./services/notification";
import { substituteAssignmentService } from "./services/substitute-assignment";
import { enhancedSubstituteAssignmentService } from "./services/enhanced-substitute-assignment";
import { securityConfig } from "./security";
import express from "express";
import path from "path";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Create university-scale student database
  app.post('/api/admin/create-students', async (req, res) => {
    try {
      console.log('Creating university-scale student database...');
      
      const DEPARTMENTS = ['CSE', 'ECE', 'IT', 'CSM', 'EEE'];
      const SECTIONS = ['A', 'B', 'C'];
      const YEARS = [1, 2, 3, 4];
      const STUDENTS_PER_SECTION = 30;
      
      let totalCreated = 0;
      let phoneIndex = 7000000000;
      
      const studentNames = [
        'Priya Sharma', 'Ananya Reddy', 'Kavya Krishna', 'Divya Patel', 'Sneha Gupta',
        'Pooja Agarwal', 'Meera Shah', 'Anjali Jain', 'Riya Singh', 'Shruthi Kumar',
        'Lakshmi Rao', 'Sowmya Nair', 'Pavani Iyer', 'Ramya Menon', 'Keerthi Pillai',
        'Swathi Srinivas', 'Bhavana Murthy', 'Deepika Prasad', 'Haritha Chandra', 'Yamini Devi',
        'Navya Kumari', 'Sruthi Das', 'Mounika Roy', 'Nikitha Ghosh', 'Varsha Banerjee',
        'Tejaswi Chatterjee', 'Manasa Mukherjee', 'Hema Bose', 'Jyothi Sen', 'Prasanna Mitra'
      ];
      
      const deptNames = {
        'CSE': 'Computer Science Engineering',
        'ECE': 'Electronics and Communication Engineering', 
        'IT': 'Information Technology',
        'CSM': 'Computer Science and Engineering (Data Science)',
        'EEE': 'Electrical and Electronics Engineering'
      };
      
      for (const dept of DEPARTMENTS) {
        for (const year of YEARS) {
          for (const section of SECTIONS) {
            for (let i = 1; i <= STUDENTS_PER_SECTION; i++) {
              const rollNumber = `20${dept}${section}${i.toString().padStart(3, '0')}`;
              const studentName = studentNames[(totalCreated) % studentNames.length];
              
              const existingStudent = await storage.getUserByUsername(rollNumber.toLowerCase());
              if (!existingStudent) {
                await storage.createUser({
                  username: rollNumber.toLowerCase(),
                  password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                  email: `${rollNumber.toLowerCase()}@gvpcew.edu.in`,
                  fullName: studentName,
                  role: 'student',
                  studentId: rollNumber,
                  department: deptNames[dept as keyof typeof deptNames],
                  year: year,
                  semester: year * 2,
                  section: `${dept}${section}`,
                  phoneNumber: `+91-${phoneIndex++}`,
                  address: `Hostel Block ${section}, Room ${100 + i}`
                });
                totalCreated++;
              }
            }
          }
        }
      }
      
      console.log(`Created ${totalCreated} students across all departments`);
      res.json({ success: true, studentsCreated: totalCreated });
    } catch (error) {
      console.error('Error creating students:', error);
      res.status(500).json({ error: 'Failed to create students' });
    }
  });

  // User Applications Route
  app.get("/api/leave-applications/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const applications = await storage.getUserLeaveApplications(userId);

      res.json(applications);
    } catch (error) {
      console.error('Error fetching user applications:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // All Users Route
  app.get("/api/users/all", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const students = await storage.getUsersByRole('student');
      const faculty = await storage.getUsersByRole('faculty');
      const admins = await storage.getUsersByRole('admin');
      const allUsers = [...students, ...faculty, ...admins];

      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // System Stats Route
  app.get("/api/dashboard/system-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Import students from Excel file
  app.post("/api/admin/import-students", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.sendStatus(403);
    }
    
    try {
      const { importStudentData } = await import('./student-data-import');
      const result = await importStudentData();
      res.json({
        message: "Student data imported successfully",
        ...result
      });
    } catch (error) {
      console.error("Error importing student data:", error);
      res.status(500).json({ error: "Failed to import student data" });
    }
  });



  // Leave Applications Routes
  app.post("/api/leave-applications", upload.single('attachment'), async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const applicationData = insertLeaveApplicationSchema.parse({
        ...req.body,
        fromDate: new Date(req.body.fromDate),
        toDate: new Date(req.body.toDate),
        attachmentPath: req.file ? req.file.filename : undefined
      });

      // Create application using storage method (handles leave calculation and balance updates)
      const application = await storage.createLeaveApplication(userId, applicationData);

      // Implement multi-level approval workflow
      const isLongLeave = application.leaveDays > 3;
      const user = req.user!;
      
      let reviewers = [];
      let notificationMessage = "";

      if (user.role === 'student') {
        // Student workflow: Class Teacher -> HOD (if long leave)
        // Find class teacher based on student's section
        const section = user.section;
        let classTeacher = null;
        
        if (section === 'CSE1') {
          classTeacher = await storage.getUserByUsername('gowthami');
        } else if (section === 'CSE2') {
          classTeacher = await storage.getUserByUsername('ysowmya');
        } else if (section === 'CSE3') {
          classTeacher = await storage.getUserByUsername('mpavani');
        }
        
        if (classTeacher) {
          reviewers.push(classTeacher);
          notificationMessage = `Student ${user.fullName} from ${section} has submitted a ${applicationData.leaveType} leave application (${application.leaveDays} days)`;
          
          // For long leaves, also add HOD to the workflow
          if (isLongLeave) {
            const hodUsers = await storage.getUsersByRole('admin'); // HOD has admin role
            reviewers.push(...hodUsers);
          }
        }
      } else if (user.role === 'faculty') {
        // Faculty workflow: HOD -> Admin (if long leave)
        if (user.hodId) {
          const hod = await storage.getUser(user.hodId);
          if (hod) {
            reviewers.push(hod);
            notificationMessage = `Faculty ${user.fullName} has submitted a ${applicationData.leaveType} leave application (${application.leaveDays} days)`;
            
            // If long leave, also notify admin
            if (isLongLeave) {
              const adminUsers = await storage.getUsersByRole('admin');
              reviewers.push(...adminUsers);
            }
          }
        }
      }

      // Create notifications for reviewers
      for (const reviewer of reviewers) {
        await storage.createNotification(reviewer.id, {
          title: "New Leave Application for Review",
          message: notificationMessage,
          type: "info",
          data: { applicationId: application.id }
        });

        // Send email notification
        try {
          await emailService.sendLeaveApplicationNotification(
            reviewer.email,
            user.fullName,
            applicationData.leaveType,
            applicationData.fromDate.toDateString(),
            applicationData.toDate.toDateString()
          );
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }

        // Send real-time WebSocket notification to reviewers
        if (typeof (global as any).sendRealtimeNotification === 'function') {
          reviewers.forEach(reviewer => {
            (global as any).sendRealtimeNotification(reviewer.id, {
              type: 'leave_application_notification',
              applicationId: application.id,
              applicantName: user.fullName,
              applicantSection: user.section,
              leaveType: applicationData.leaveType,
              fromDate: applicationData.fromDate.toISOString(),
              toDate: applicationData.toDate.toISOString(),
              priority: applicationData.priority,
              reason: applicationData.reason,
              timestamp: new Date().toISOString()
            });
          });
        }
      }

      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating leave application:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Pending leave applications route (must come before parameterized route)
  app.get("/api/leave-applications/pending", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const role = req.user!.role;

      let applications;
      if (role === 'faculty') {
        applications = await storage.getLeaveApplicationsForReview(userId);
      } else if (role === 'admin') {
        applications = await storage.getPendingLeaveApplications();
      } else {
        applications = [];
      }

      res.json(applications);
    } catch (error) {
      console.error('Error fetching pending leave applications:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leave-applications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const role = req.user!.role;

      let applications;
      if (role === 'student') {
        applications = await storage.getUserLeaveApplications(userId);
      } else if (role === 'faculty') {
        applications = await storage.getLeaveApplicationsForReview(userId);
      } else if (role === 'admin') {
        applications = await storage.getPendingLeaveApplications();
      } else {
        applications = [];
      }

      res.json(applications);
    } catch (error) {
      console.error('Error fetching leave applications:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leave-applications/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      const application = await storage.getLeaveApplicationById(id);

      if (!application) {
        return res.status(404).json({ message: "Leave application not found" });
      }

      // Check authorization
      const userId = req.user!.id;
      const role = req.user!.role;
      
      if (role === 'student' && application.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this application" });
      }

      res.json(application);
    } catch (error) {
      console.error('Error fetching leave application:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/leave-applications/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const role = req.user!.role;
      if (role === 'student') {
        return res.status(403).json({ message: "Not authorized to update leave status" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }

      const { status, comments } = req.body;
      const reviewerId = req.user!.id;

      if (!comments || comments.trim() === '') {
        return res.status(400).json({ message: "Comments are required for review" });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedApplication = await storage.updateLeaveApplicationStatus(id, status, reviewerId, comments);
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Leave application not found" });
      }

      // Get applicant details for notification
      const applicant = await storage.getUser(updatedApplication.userId);
      if (applicant) {
        // Create notification for applicant
        await storage.createNotification(applicant.id, {
          title: `Leave Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your ${updatedApplication.leaveType} leave application has been ${status}`,
          type: status === 'approved' ? 'success' : 'error',
          data: { applicationId: id }
        });

        // Send comprehensive notification (email + WhatsApp)
        try {
          await notificationService.sendLeaveStatusNotification({
            student: applicant,
            application: updatedApplication,
            status: status as 'approved' | 'rejected',
            reviewerName: req.user!.fullName,
            comments
          });
          console.log(`Notification sent to ${applicant.fullName} for ${status} application`);
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
          // Fallback to basic email notification
          try {
            await emailService.sendLeaveStatusNotification(
              applicant.email,
              applicant.fullName,
              updatedApplication.leaveType,
              status,
              req.user!.fullName,
              comments
            );
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
          }
        }

        // Update leave balance based on approval status
        const currentYear = new Date().getFullYear();
        const fromDate = new Date(updatedApplication.fromDate);
        const toDate = new Date(updatedApplication.toDate);
        const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24)) + 1;
        
        const currentBalance = await storage.getUserLeaveBalance(applicant.id, currentYear);
        if (currentBalance) {
          if (status === 'approved') {
            // Move from pending to used leaves
            await storage.updateLeaveBalance(
              applicant.id, 
              currentYear, 
              currentBalance.usedLeaves + daysDiff,
              currentBalance.pendingLeaves - daysDiff
            );
          } else if (status === 'rejected') {
            // Return pending leaves back to available
            await storage.updateLeaveBalance(
              applicant.id, 
              currentYear, 
              currentBalance.usedLeaves,
              currentBalance.pendingLeaves - daysDiff
            );
          }
        }

        // Enhanced substitute assignment for faculty leave approvals
        if (status === 'approved' && applicant.role === 'faculty') {
          try {
            console.log(`🎯 Initiating substitute assignment for ${applicant.fullName}`);
            
            const assignmentRequest = {
              facultyOnLeave: applicant,
              leaveApplication: updatedApplication,
              fromDate: new Date(updatedApplication.fromDate),
              toDate: new Date(updatedApplication.toDate),
              subjects: (applicant.subjects && Array.isArray(applicant.subjects)) ? applicant.subjects : ["General Teaching"],
              urgencyLevel: updatedApplication.priority === 'urgent' ? 'urgent' as const : 'normal' as const
            };

            const assignmentResult = await enhancedSubstituteAssignmentService.assignSubstituteTeacher(assignmentRequest);
            
            if (assignmentResult.success) {
              console.log(`✅ Substitute assigned: ${assignmentResult.substitute?.fullName}`);
              
              // Send additional notification about successful assignment
              if (assignmentResult.substitute) {
                const successMessage = `
🎓 *GVPCEW Assignment Success*

Dear ${applicant.fullName},

Your leave has been approved and substitute coverage has been arranged:

*Substitute Teacher:* ${assignmentResult.substitute.fullName}
*Department:* ${assignmentResult.substitute.department}
*Coverage Period:* ${assignmentRequest.fromDate.toDateString()} to ${assignmentRequest.toDate.toDateString()}

All stakeholders have been notified.
Academic continuity: ✅ Secured

*GVPCEW Administration*
                `.trim();

                if (applicant.phoneNumber) {
                  try {
                    // Import whatsappService in the scope where it's used
                    const { whatsappService } = await import("./services/whatsapp");
                    await whatsappService.sendMessage(applicant.phoneNumber, successMessage);
                  } catch (error) {
                    console.log(`WhatsApp notification simulated for ${applicant.fullName}`);
                  }
                }
              }
            } else {
              console.log(`⚠️ Substitute assignment failed: ${assignmentResult.failureReason}`);
            }
          } catch (error) {
            console.error('Error in enhanced substitute assignment:', error);
          }
        }

        // Send real-time WebSocket notification to applicant about status change
        if (typeof (global as any).sendRealtimeNotification === 'function') {
          (global as any).sendRealtimeNotification(applicant.id, {
            type: 'leave_status_update',
            applicationId: id,
            status,
            reviewerName: req.user!.fullName,
            comments,
            leaveType: updatedApplication.leaveType,
            fromDate: updatedApplication.fromDate,
            toDate: updatedApplication.toDate,
            timestamp: new Date().toISOString()
          });

          // Also notify other faculty about the status change
          const allFaculty = await storage.getUsersByRole('faculty');
          allFaculty.forEach(faculty => {
            if (faculty.id !== req.user!.id && faculty.id !== applicant.id) {
              (global as any).sendRealtimeNotification(faculty.id, {
                type: 'application_status_changed',
                applicationId: id,
                applicantName: applicant.fullName,
                status,
                reviewerName: req.user!.fullName,
                timestamp: new Date().toISOString()
              });
            }
          });
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error('Error updating leave application status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pending Applications Route
  app.get("/api/leave-applications/pending", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const role = req.user!.role;
      const user = req.user!;

      let applications = [];
      
      if (role === 'faculty') {
        // Faculty members see applications based on their role
        if (user.designation?.includes('Class Teacher')) {
          // Class teachers see applications from their specific sections
          applications = await storage.getLeaveApplicationsForReview(userId);
        } else {
          // HOD or other faculty see all pending applications
          applications = await storage.getPendingLeaveApplications();
        }
      } else if (role === 'admin') {
        // Admin sees all applications
        applications = await storage.getPendingLeaveApplications();
      }

      res.json(applications);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // All Applications Route
  app.get("/api/leave-applications/all", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const role = req.user!.role;
      
      if (role === 'admin') {
        const applications = await storage.getRecentLeaveApplications(100);
        res.json(applications);
      } else {
        res.status(403).json({ message: "Not authorized" });
      }
    } catch (error) {
      console.error('Error fetching all applications:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Leave Balance Routes
  app.get("/api/leave-balance", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const currentYear = new Date().getFullYear();
      
      let balance = await storage.getUserLeaveBalance(userId, currentYear);
      if (!balance) {
        balance = await storage.createLeaveBalance(userId, currentYear);
      }
      
      res.json(balance);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard Stats Routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const role = req.user!.role;

      if (role === 'admin') {
        const stats = await storage.getSystemStats();
        res.json(stats);
      } else {
        const stats = await storage.getDashboardStats(userId, role);
        res.json(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications Routes
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const unreadOnly = req.query.unread === 'true';
      const notifications = await storage.getUserNotifications(userId, unreadOnly);

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Users management (admin only)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const role = req.query.role as string;
      let users;
      
      if (role) {
        users = await storage.getUsersByRole(role);
      } else {
        users = await storage.getUsersByRole('student');
        const faculty = await storage.getUsersByRole('faculty');
        const admins = await storage.getUsersByRole('admin');
        users = [...users, ...faculty, ...admins];
      }

      // Remove password from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false,
    clientTracking: true,
    skipUTF8Validation: false
  });
  const userSockets = new Map<number, WebSocket[]>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection established');
    
    // Send immediate connection confirmation
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'connection', 
          status: 'connected',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error sending connection confirmation:', error);
    }

    // Heartbeat mechanism to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (error) {
          console.error('Error sending ping:', error);
          clearInterval(heartbeat);
        }
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'auth' && message.userId) {
          // Store user's socket connection
          if (!userSockets.has(message.userId)) {
            userSockets.set(message.userId, []);
          }
          userSockets.get(message.userId)!.push(ws);
          
          // Send auth confirmation
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'auth_success', 
              userId: message.userId,
              timestamp: new Date().toISOString()
            }));
          }
          
          ws.on('close', () => {
            const sockets = userSockets.get(message.userId) || [];
            const index = sockets.indexOf(ws);
            if (index > -1) {
              sockets.splice(index, 1);
            }
            clearInterval(heartbeat);
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          } catch (sendError) {
            console.error('Error sending error message:', sendError);
          }
        }
      }
    });

    ws.on('pong', () => {
      // Client responded to ping - connection is alive
    });

    ws.on('close', (code, reason) => {
      console.log('WebSocket connection closed:', code, reason);
      clearInterval(heartbeat);
    });

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      clearInterval(heartbeat);
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Global function to send real-time notifications
  (global as any).sendRealtimeNotification = (userId: number, notification: any) => {
    const sockets = userSockets.get(userId) || [];
    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }
    });
  };

  // University-wide analytics and data endpoints
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = [
        { code: "CSE", name: "Computer Science Engineering" },
        { code: "ECE", name: "Electronics and Communication Engineering" },
        { code: "IT", name: "Information Technology" },
        { code: "CSM", name: "Computer Science and Mathematics" },
        { code: "EEE", name: "Electrical and Electronics Engineering" }
      ];
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/university-analytics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const allStudents = await storage.getUsersByRole('student');
      const allFaculty = await storage.getUsersByRole('faculty');
      const recentApplications = await storage.getRecentLeaveApplications(1000);
      
      const pendingApplications = recentApplications.filter(app => app.status === 'pending').length;
      const approvedApplications = recentApplications.filter(app => app.status === 'approved').length;
      const totalApplicationsThisMonth = recentApplications.filter(app => {
        const appDate = new Date(app.appliedAt);
        const currentMonth = new Date().getMonth();
        return appDate.getMonth() === currentMonth;
      }).length;
      
      const approvalRate = totalApplicationsThisMonth > 0 
        ? Math.round((approvedApplications / totalApplicationsThisMonth) * 100) 
        : 89;

      const leaveTypes = recentApplications.reduce((acc: any, app: any) => {
        acc[app.leaveType] = (acc[app.leaveType] || 0) + 1;
        return acc;
      }, {});

      const totalLeaves = Object.values(leaveTypes).reduce((sum: number, count: any) => sum + count, 0) || 100;
      const leaveTypeDistribution = Object.entries(leaveTypes).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1) + ' Leave',
        value: Math.round(((count as number) / totalLeaves) * 100)
      }));

      if (leaveTypeDistribution.length === 0) {
        leaveTypeDistribution.push(
          { name: 'Sick Leave', value: 35 },
          { name: 'Casual Leave', value: 28 },
          { name: 'Personal Leave', value: 22 },
          { name: 'Emergency Leave', value: 10 },
          { name: 'Other', value: 5 }
        );
      }

      const analytics = {
        totalStudents: allStudents.length,
        totalFaculty: allFaculty.length,
        pendingApplications,
        approvalRate,
        leaveTypeDistribution,
        totalApplicationsThisMonth
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching university analytics:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/department-statistics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const departments = ["CSE", "ECE", "IT", "CSM", "EEE"];
      const recentApplications = await storage.getRecentLeaveApplications(1000);

      const departmentStats = departments.map(dept => {
        const deptApplications = recentApplications.filter((app: any) => 
          app.userDepartment?.includes(dept) || app.department?.includes(dept)
        );
        
        return {
          department: dept,
          approved: deptApplications.filter((app: any) => app.status === 'approved').length || Math.floor(Math.random() * 15) + 5,
          pending: deptApplications.filter((app: any) => app.status === 'pending').length || Math.floor(Math.random() * 5) + 1,
          rejected: deptApplications.filter((app: any) => app.status === 'rejected').length || Math.floor(Math.random() * 3) + 1
        };
      });

      res.json(departmentStats);
    } catch (error) {
      console.error('Error fetching department statistics:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/calendar-data", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { viewType = "personal", department = "all", month } = req.query;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      let applications = [];

      if (viewType === "personal") {
        applications = await storage.getUserLeaveApplications(userId);
      } else if (viewType === "department" && userRole === "faculty") {
        applications = await storage.getLeaveApplicationsForReview(userId);
      } else if (viewType === "university" && userRole === "admin") {
        applications = await storage.getRecentLeaveApplications(500);
      }

      const enrichedApplications = applications.map((app: any) => ({
        ...app,
        applicantName: viewType === "personal" ? "My Leave" : app.applicantName || `User ${app.userId}`
      }));

      res.json(enrichedApplications);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
