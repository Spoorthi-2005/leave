import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./simple-storage";
import { setupAuth } from "./simple-auth";
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
      let status: "pending" | "approved" | "rejected" | "forwarded_to_admin" = "pending";
      if (req.user.role === "teacher" && leaveDays > 7) {
        status = "forwarded_to_admin";
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
      // Filter only faculty applications for HOD
      const facultyApplications = applications.filter(app => {
        // Get applications from teachers in the same department
        return app.status === "pending" && app.userId !== req.user.id;
      });
      res.json(facultyApplications);
    } catch (error) {
      console.error("Error fetching pending faculty applications:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}