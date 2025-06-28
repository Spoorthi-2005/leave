import { 
  users, 
  leaveApplications, 
  leaveBalance, 
  notifications, 
  substituteAssignments,
  leavePolicies,
  type User, 
  type InsertUser,
  type LeaveApplication,
  type InsertLeaveApplication,
  type LeaveBalance,
  type Notification,
  type InsertNotification,
  type SubstituteAssignment,
  type LeavePolicy
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;

  // Leave applications
  createLeaveApplication(userId: number, application: InsertLeaveApplication): Promise<LeaveApplication>;
  getLeaveApplicationById(id: number): Promise<LeaveApplication | undefined>;
  getUserLeaveApplications(userId: number): Promise<any[]>;
  getPendingLeaveApplications(reviewerId?: number): Promise<any[]>;
  updateLeaveApplicationStatus(id: number, status: string, reviewerId: number, comments?: string): Promise<LeaveApplication | undefined>;
  getLeaveApplicationsForReview(facultyId: number): Promise<any[]>;
  getRecentLeaveApplications(limit?: number): Promise<any[]>;

  // Leave balance
  getUserLeaveBalance(userId: number, year: number): Promise<LeaveBalance | undefined>;
  createLeaveBalance(userId: number, year: number): Promise<LeaveBalance>;
  updateLeaveBalance(userId: number, year: number, usedLeaves: number): Promise<void>;

  // Notifications
  createNotification(userId: number, notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // Substitute assignments
  getSubstituteAssignments(facultyId: number): Promise<SubstituteAssignment[]>;
  createSubstituteAssignment(assignment: Omit<SubstituteAssignment, 'id' | 'createdAt'>): Promise<SubstituteAssignment>;

  // Leave policies
  getLeavePolicies(): Promise<LeavePolicy[]>;

  // Dashboard stats
  getDashboardStats(userId: number, role: string): Promise<any>;
  getSystemStats(): Promise<any>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Create initial leave balance for the current year
    const currentYear = new Date().getFullYear();
    await this.createLeaveBalance(user.id, currentYear);
    
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async createLeaveApplication(userId: number, application: InsertLeaveApplication): Promise<LeaveApplication> {
    const currentYear = new Date().getFullYear();
    
    // Get or create leave balance for the user
    let balance = await this.getUserLeaveBalance(userId, currentYear);
    if (!balance) {
      balance = await this.createLeaveBalance(userId, currentYear);
    }
    
    // Calculate leave days
    const fromDate = new Date(application.fromDate);
    const toDate = new Date(application.toDate);
    const leaveDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const isLongLeave = leaveDays > 10;

    // Check if user has enough available leave
    const availableLeaves = balance.totalLeaves - balance.usedLeaves - balance.pendingLeaves;
    if (availableLeaves < leaveDays) {
      throw new Error(`Insufficient leave balance. Available: ${availableLeaves}, Requested: ${leaveDays}`);
    }

    // Get user details to determine class teacher assignment
    const user = await this.getUser(userId);
    let classTeacherId = null;
    let hodId = null;

    if (user && user.role === 'student' && user.section) {
      // GVPCEW section-specific class teacher assignments
      const classTeacherMap: Record<string, string> = {
        'CSE1': 'Gowthami',
        'CSE2': 'Y Sowmya', 
        'CSE3': 'M Pavani'
      };

      const teacherName = classTeacherMap[user.section.toUpperCase()];
      if (teacherName) {
        // Find the class teacher by name
        const [classTeacher] = await db
          .select()
          .from(users)
          .where(eq(users.fullName, teacherName))
          .limit(1);
        
        if (classTeacher) {
          classTeacherId = classTeacher.id;
        }
      }

      // For long leaves (>10 days), also assign HOD
      if (isLongLeave) {
        const [hod] = await db
          .select()
          .from(users)
          .where(eq(users.role, 'admin'))
          .limit(1);
        
        if (hod) {
          hodId = hod.id;
        }
      }
    }

    // Create the leave application
    const [leaveApp] = await db
      .insert(leaveApplications)
      .values({ 
        ...application, 
        userId,
        leaveDays,
        isLongLeave,
        classTeacherId,
        hodId
      })
      .returning();

    // Update pending leaves count (reduce available leaves)
    await this.updateLeaveBalance(userId, currentYear, balance.usedLeaves, balance.pendingLeaves + leaveDays);

    return leaveApp;
  }

  async getLeaveApplicationById(id: number): Promise<LeaveApplication | undefined> {
    const [application] = await db.select().from(leaveApplications).where(eq(leaveApplications.id, id));
    return application || undefined;
  }

  async getUserLeaveApplications(userId: number): Promise<LeaveApplication[]> {
    return await db
      .select()
      .from(leaveApplications)
      .where(eq(leaveApplications.userId, userId))
      .orderBy(desc(leaveApplications.appliedAt));
  }

  async getPendingLeaveApplications(reviewerId?: number): Promise<any[]> {
    const result = await db.select()
    .from(leaveApplications)
    .innerJoin(users, eq(leaveApplications.userId, users.id))
    .where(eq(leaveApplications.status, 'pending'))
    .orderBy(desc(leaveApplications.appliedAt));

    return result.map((row: any) => ({
      ...row.leave_applications,
      userName: row.users.fullName,
      userEmail: row.users.email,
      studentId: row.users.studentId,
      department: row.users.department
    }));
  }

  async updateLeaveApplicationStatus(id: number, status: string, reviewerId: number, comments?: string): Promise<LeaveApplication | undefined> {
    // Get the application first to update leave balance
    const application = await this.getLeaveApplicationById(id);
    if (!application) return undefined;
    
    const currentYear = new Date().getFullYear();
    const balance = await this.getUserLeaveBalance(application.userId, currentYear);
    
    if (balance) {
      if (status === 'approved') {
        // Move from pending to used leaves
        const newUsedLeaves = balance.usedLeaves + application.leaveDays;
        const newPendingLeaves = balance.pendingLeaves - application.leaveDays;
        await this.updateLeaveBalance(application.userId, currentYear, newUsedLeaves, Math.max(0, newPendingLeaves));
      } else if (status === 'rejected') {
        // Return pending leaves to available
        const newPendingLeaves = balance.pendingLeaves - application.leaveDays;
        await this.updateLeaveBalance(application.userId, currentYear, balance.usedLeaves, Math.max(0, newPendingLeaves));
      }
    }

    const [updatedApp] = await db
      .update(leaveApplications)
      .set({ 
        status: status as any, 
        reviewedBy: reviewerId, 
        reviewedAt: new Date(),
        reviewComments: comments,
        updatedAt: new Date()
      })
      .where(eq(leaveApplications.id, id))
      .returning();
    return updatedApp || undefined;
  }

  async getLeaveApplicationsForReview(facultyId: number): Promise<LeaveApplication[]> {
    // Get applications from students in faculty's department/classes
    return await db.select({
      ...leaveApplications,
      userName: users.fullName,
      userEmail: users.email,
      studentId: users.studentId,
      department: users.department
    })
    .from(leaveApplications)
    .innerJoin(users, eq(leaveApplications.userId, users.id))
    .where(and(
      eq(leaveApplications.status, 'pending'),
      eq(users.role, 'student')
    ))
    .orderBy(desc(leaveApplications.appliedAt));
  }

  async getRecentLeaveApplications(limit: number = 10): Promise<LeaveApplication[]> {
    return await db.select({
      ...leaveApplications,
      userName: users.fullName,
      userEmail: users.email,
      studentId: users.studentId
    })
    .from(leaveApplications)
    .innerJoin(users, eq(leaveApplications.userId, users.id))
    .orderBy(desc(leaveApplications.appliedAt))
    .limit(limit);
  }

  async getUserLeaveBalance(userId: number, year: number): Promise<LeaveBalance | undefined> {
    const [balance] = await db
      .select()
      .from(leaveBalance)
      .where(and(eq(leaveBalance.userId, userId), eq(leaveBalance.year, year)));
    return balance || undefined;
  }

  async createLeaveBalance(userId: number, year: number): Promise<LeaveBalance> {
    const [balance] = await db
      .insert(leaveBalance)
      .values({ userId, year, totalLeaves: 30, usedLeaves: 0, availableLeaves: 30 })
      .returning();
    return balance;
  }

  async updateLeaveBalance(userId: number, year: number, usedLeaves: number, pendingLeaves?: number): Promise<void> {
    const totalLeaves = 30; // Default total leaves
    const updateData: any = { usedLeaves, updatedAt: new Date() };
    
    if (pendingLeaves !== undefined) {
      updateData.pendingLeaves = pendingLeaves;
    }
    
    const availableLeaves = totalLeaves - usedLeaves - (pendingLeaves || 0);
    updateData.availableLeaves = availableLeaves;
    
    await db
      .update(leaveBalance)
      .set(updateData)
      .where(and(eq(leaveBalance.userId, userId), eq(leaveBalance.year, year)));
  }

  async createNotification(userId: number, notification: InsertNotification): Promise<Notification> {
    const [notif] = await db
      .insert(notifications)
      .values({ ...notification, userId })
      .returning();
    return notif;
  }

  async getUserNotifications(userId: number, unreadOnly: boolean = false): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async getSubstituteAssignments(facultyId: number): Promise<SubstituteAssignment[]> {
    return await db
      .select()
      .from(substituteAssignments)
      .where(eq(substituteAssignments.substituteFacultyId, facultyId))
      .orderBy(desc(substituteAssignments.date));
  }

  async createSubstituteAssignment(assignment: Omit<SubstituteAssignment, 'id' | 'createdAt'>): Promise<SubstituteAssignment> {
    const [subAssignment] = await db
      .insert(substituteAssignments)
      .values(assignment)
      .returning();
    return subAssignment;
  }

  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return await db.select().from(leavePolicies);
  }

  async getDashboardStats(userId: number, role: string): Promise<any> {
    if (role === 'student') {
      const currentYear = new Date().getFullYear();
      const balance = await this.getUserLeaveBalance(userId, currentYear);
      
      const applications = await db
        .select({ status: leaveApplications.status })
        .from(leaveApplications)
        .where(eq(leaveApplications.userId, userId));

      const stats = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        leaveBalance: balance || { availableLeaves: 30, usedLeaves: 0, totalLeaves: 30 },
        leaveStats: {
          approved: stats.approved || 0,
          pending: stats.pending || 0,
          rejected: stats.rejected || 0
        }
      };
    } else if (role === 'faculty') {
      const pendingReviews = await db
        .select({ count: count() })
        .from(leaveApplications)
        .innerJoin(users, eq(leaveApplications.userId, users.id))
        .where(and(
          eq(leaveApplications.status, 'pending'),
          eq(users.role, 'student')
        ));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const approvedToday = await db
        .select({ count: count() })
        .from(leaveApplications)
        .where(and(
          eq(leaveApplications.reviewedBy, userId),
          eq(leaveApplications.status, 'approved'),
          gte(leaveApplications.reviewedAt, today),
          lte(leaveApplications.reviewedAt, tomorrow)
        ));

      return {
        reviewStats: {
          pending: pendingReviews[0]?.count || 0,
          approvedToday: approvedToday[0]?.count || 0
        },
        facultyStats: {
          studentsAssigned: 42, // This would be calculated based on actual assignments
          substituteRequests: 2 // This would be calculated based on actual substitute requests
        }
      };
    }

    return {};
  }

  async getSystemStats(): Promise<any> {
    const totalUsers = await db.select({ count: count() }).from(users);
    const pendingApprovals = await db
      .select({ count: count() })
      .from(leaveApplications)
      .where(eq(leaveApplications.status, 'pending'));

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const leavesThisMonth = await db
      .select({ count: count() })
      .from(leaveApplications)
      .where(gte(leaveApplications.appliedAt, currentMonth));

    return {
      totalUsers: totalUsers[0]?.count || 0,
      pendingApprovals: pendingApprovals[0]?.count || 0,
      leavesThisMonth: leavesThisMonth[0]?.count || 0,
      efficiency: 94 // This would be calculated based on processing times
    };
  }
}

export const storage = new DatabaseStorage();
