import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLeaveApplicationSchema, insertNotificationSchema } from "@shared/schema";
import { upload } from "./services/file-upload";
import { emailService } from "./services/email";
import express from "express";
import path from "path";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user!.id;
      const applicationData = insertLeaveApplicationSchema.parse({
        ...req.body,
        fromDate: new Date(req.body.fromDate),
        toDate: new Date(req.body.toDate),
        attachmentPath: req.file ? req.file.filename : undefined
      });

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
      }

      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating leave application:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
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
      const { status, comments } = req.body;
      const reviewerId = req.user!.id;

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

        // Send email notification
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

        // Update leave balance if approved
        if (status === 'approved') {
          const currentYear = new Date().getFullYear();
          const fromDate = new Date(updatedApplication.fromDate);
          const toDate = new Date(updatedApplication.toDate);
          const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24)) + 1;
          
          const currentBalance = await storage.getUserLeaveBalance(applicant.id, currentYear);
          if (currentBalance) {
            await storage.updateLeaveBalance(applicant.id, currentYear, currentBalance.usedLeaves + daysDiff);
          }
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
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const userSockets = new Map<number, WebSocket[]>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'auth' && message.userId) {
          // Store user's socket connection
          if (!userSockets.has(message.userId)) {
            userSockets.set(message.userId, []);
          }
          userSockets.get(message.userId)!.push(ws);
          
          ws.on('close', () => {
            const sockets = userSockets.get(message.userId) || [];
            const index = sockets.indexOf(ws);
            if (index > -1) {
              sockets.splice(index, 1);
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  // Global function to send real-time notifications
  (global as any).sendRealtimeNotification = (userId: number, notification: any) => {
    const sockets = userSockets.get(userId) || [];
    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
      }
    });
  };

  return httpServer;
}
