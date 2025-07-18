import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./simple-storage";
import { setupAuth } from "./simple-auth";
import { enhancedWhatsAppService } from "./enhanced-whatsapp-service";
import { z } from "zod";

const leaveApplicationSchema = z.object({
  type: z.enum(["sick", "personal", "emergency", "vacation"]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(10),
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected", "forwarded_to_admin"]),
  comments: z.string().min(1),
});

export function registerRoutes(app: Express): Server {
  // Setup authentication
  setupAuth(app);

  // Leave Applications Routes
  
  // Student/Faculty: Create leave application
  app.post("/api/leave-applications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !["student", "teacher", "hod"].includes(req.user?.role)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validation = leaveApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }

      const { type, startDate, endDate, reason } = validation.data;

      // Calculate leave duration
      const start = new Date(startDate);
      const end = new Date(endDate);
      const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Determine status based on role and duration
      let status: "pending" | "approved" | "rejected" | "forwarded_to_admin" | "forwarded_to_hod" | "admin_pending" = "pending";
      
      if (req.user.role === "student" && leaveDays > 5) {
        status = "forwarded_to_hod";
      } else if (req.user.role === "teacher" && leaveDays > 10) {
        status = "admin_pending";
        console.log(`📋 Faculty leave exceeding 10 days (${leaveDays} days) - routing to admin for ${req.user.fullName}`);
      }

      const application = await storage.createLeaveApplication({
        userId: req.user.id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status,
      });

      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating leave application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Student/Faculty: Get own applications
  app.get("/api/leave-applications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !["student", "teacher", "hod"].includes(req.user?.role)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applications = await storage.getUserLeaveApplications(req.user.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching leave applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Alias for frontend convenience
  app.get("/api/my-leave-applications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !["student", "teacher", "hod"].includes(req.user?.role)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applications = await storage.getUserLeaveApplications(req.user.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching my leave applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Student: Get leave balance
  app.get("/api/leave-balance", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "student") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const currentYear = new Date().getFullYear();
      let balance = await storage.getUserLeaveBalance(req.user.id, currentYear);
      
      if (!balance) {
        balance = await storage.createLeaveBalance(req.user.id, currentYear);
      }

      res.json(balance);
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teacher: Get pending applications (student applications only)
  app.get("/api/leave-applications/pending", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "teacher") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applications = await storage.getPendingLeaveApplications();
      // Filter only student applications for teachers
      const studentApplications = applications.filter(app => {
        // Get user role by checking if they are students
        return app.userId !== req.user.id; // Exclude teacher's own applications
      });
      res.json(studentApplications);
    } catch (error) {
      console.error("Error fetching pending applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // HOD: Get pending faculty applications
  app.get("/api/leave-applications/pending-faculty", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "hod") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applications = await storage.getPendingLeaveApplications();
      // Filter only faculty applications for HOD - get applications from teachers
      const facultyApplications = [];
      
      for (const app of applications) {
        if (app.status === "pending" && app.userId !== req.user.id) {
          // Check if the application is from a teacher
          const applicant = await storage.getUser(app.userId);
          if (applicant && applicant.role === "teacher") {
            facultyApplications.push({
              ...app,
              studentName: applicant.fullName
            });
          }
        }
      }
      
      res.json(facultyApplications);
    } catch (error) {
      console.error("Error fetching pending faculty applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // HOD: Get student applications forwarded to HOD (>5 days)
  app.get("/api/leave-applications/hod-review", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "hod") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applications = await storage.getAllLeaveApplications();
      // Filter applications forwarded to HOD
      const hodApplications = applications.filter(app => 
        app.status === "forwarded_to_hod"
      );
      res.json(hodApplications);
    } catch (error) {
      console.error("Error fetching HOD applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get long-duration faculty applications
  app.get("/api/leave-applications/admin-review", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applications = await storage.getAllLeaveApplications();
      // Filter applications forwarded to admin
      const adminApplications = applications.filter(app => 
        app.status === "forwarded_to_admin"
      );
      res.json(adminApplications);
    } catch (error) {
      console.error("Error fetching admin applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teacher/HOD/Admin: Get all applications
  app.get("/api/leave-applications/all", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !["teacher", "hod", "admin"].includes(req.user?.role)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applications = await storage.getAllLeaveApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching all applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teacher/HOD/Admin: Review application
  app.patch("/api/leave-applications/:id/review", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !["teacher", "hod", "admin"].includes(req.user?.role)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = parseInt(req.params.id);
      const validation = reviewSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }

      const { status, comments } = validation.data;

      // Get the application to check details
      const application = await storage.getLeaveApplicationById(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Calculate leave duration for workflow decisions
      const start = new Date(application.startDate);
      const end = new Date(application.endDate);
      const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      let finalStatus = status;

      // Handle teacher approvals for faculty leave
      if (req.user.role === "teacher" && status === "approved") {
        // If it's a faculty member's leave > 7 days, forward to admin
        if (leaveDays > 7) {
          finalStatus = "forwarded_to_admin";
        }
      }

      const updatedApplication = await storage.updateLeaveApplication(
        applicationId,
        finalStatus,
        req.user.id,
        comments
      );

      if (!updatedApplication) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Leave balance is now automatically handled in storage.updateLeaveApplication

      // Send WhatsApp notification if application is approved or rejected (not forwarded)
      if (finalStatus === "approved" || finalStatus === "rejected") {
        try {
          // Get the student/applicant details
          const applicant = await storage.getUser(updatedApplication.userId);
          if (applicant && applicant.phoneNumber) {
            // Calculate leave duration
            const start = new Date(updatedApplication.startDate);
            const end = new Date(updatedApplication.endDate);
            const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            // Send WhatsApp notification
            const duration = `${leaveDays} days (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
            await enhancedWhatsAppService.sendLeaveNotification(
              applicant.phoneNumber,
              applicant.fullName,
              updatedApplication.type,
              duration,
              finalStatus as 'approved' | 'rejected',
              req.user.fullName,
              comments
            );
          }
        } catch (notificationError) {
          console.error("Failed to send WhatsApp notification:", notificationError);
          // Don't fail the request if notification fails
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error reviewing application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teacher: Get stats
  app.get("/api/teacher/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "teacher") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const allApplications = await storage.getAllLeaveApplications();
      const pendingCount = allApplications.filter(app => app.status === "pending").length;
      const approvedCount = allApplications.filter(app => app.status === "approved").length;
      const rejectedCount = allApplications.filter(app => app.status === "rejected").length;

      res.json({
        total: allApplications.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      });
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get faculty applications for review
  app.get("/api/admin/faculty-applications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(401).json({ error: "Admin access required" });
      }

      const applications = await storage.getFacultyApplicationsForAdmin();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching faculty applications for admin:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get pending applications requiring admin approval
  app.get("/api/admin/pending-applications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(401).json({ error: "Admin access required" });
      }

      const applications = await storage.getAdminPendingApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching admin pending applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Review faculty leave application
  app.post("/api/admin/review-application/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(401).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const { action, comments } = req.body;

      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const finalStatus = action === "approve" ? "admin_approved" : "admin_rejected";
      const updatedApplication = await storage.updateLeaveApplication(
        parseInt(id),
        finalStatus as any,
        req.user.id,
        comments || ""
      );

      if (!updatedApplication) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Send WhatsApp notification for admin decisions
      if (finalStatus === "admin_approved" || finalStatus === "admin_rejected") {
        try {
          const applicant = await storage.getUser(updatedApplication.userId);
          if (applicant?.phoneNumber) {
            const statusIcon = finalStatus === "admin_approved" ? "✅" : "❌";
            const statusText = finalStatus === "admin_approved" ? "APPROVED" : "REJECTED";
            
            const message = `
🏛️ GVPCEW - Admin Decision ${statusIcon}

Your leave application has been ${statusText} by Admin:

👤 Name: ${applicant.fullName}
📅 Leave: ${updatedApplication.startDate.toDateString()} to ${updatedApplication.endDate.toDateString()}
📝 Type: ${updatedApplication.type.toUpperCase()}
💬 Admin Comments: ${comments || 'No additional comments'}

${finalStatus === "admin_approved" 
  ? "Your leave has been approved. Please coordinate with your department." 
  : "Your leave has been rejected. Please contact admin for clarification."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GVPCEW Leave Management System
            `.trim();

            const { whatsAppWebService } = await import('./whatsapp-web-service');
            await whatsAppWebService.sendMessage(applicant.phoneNumber, message);
          }
        } catch (whatsappError) {
          console.error("WhatsApp notification failed:", whatsappError);
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error reviewing application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}