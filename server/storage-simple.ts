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
import { eq, and, desc, gte, lte, count } from "drizzle-orm";

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

export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private leaveApplications: any[] = [];
  private leaveBalances: LeaveBalance[] = [];
  private notifications: Notification[] = [];
  private substituteAssignments: SubstituteAssignment[] = [];
  private leavePolicies: LeavePolicy[] = [];
  sessionStore: any = null;

  constructor() {
    // Initialize with default admin user
    this.users.push({
      id: 1,
      username: 'admin',
      email: 'admin@gvpcew.edu',
      password: '$scrypt$16$8b2c8db0e4f1234567890abcdef12345$1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      fullName: 'System Administrator',
      role: 'admin',
      studentId: null,
      department: 'Administration',
      year: null,
      semester: null,
      designation: 'Administrator',
      phoneNumber: '+91-1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add sample faculty user
    this.users.push({
      id: 2,
      username: 'faculty1',
      email: 'faculty1@gvpcew.edu',
      password: '$scrypt$16$8b2c8db0e4f1234567890abcdef12345$1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      fullName: 'Dr. John Smith',
      role: 'faculty',
      studentId: null,
      department: 'Computer Science',
      year: null,
      semester: null,
      designation: 'Professor',
      phoneNumber: '+91-9876543210',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add sample student user
    this.users.push({
      id: 3,
      username: 'student1',
      email: 'student1@gvpcew.edu',
      password: '$scrypt$16$8b2c8db0e4f1234567890abcdef12345$1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      fullName: 'Alice Johnson',
      role: 'student',
      studentId: 'GVPCEW2024001',
      department: 'Computer Science',
      year: 3,
      semester: 6,
      designation: null,
      phoneNumber: '+91-8765432109',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize leave balances for users
    this.leaveBalances.push({
      id: 1,
      userId: 3,
      totalLeaves: 30,
      usedLeaves: 5,
      availableLeaves: 25,
      year: 2024,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.users.length + 1,
      ...insertUser,
      studentId: insertUser.studentId || null,
      department: insertUser.department || null,
      year: insertUser.year || null,
      semester: insertUser.semester || null,
      designation: insertUser.designation || null,
      phoneNumber: insertUser.phoneNumber || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    
    // Create initial leave balance for the current year
    const currentYear = new Date().getFullYear();
    await this.createLeaveBalance(newUser.id, currentYear);
    
    return newUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.users.filter(user => user.role === role);
  }

  async createLeaveApplication(userId: number, application: InsertLeaveApplication): Promise<LeaveApplication> {
    const newApplication: any = {
      id: this.leaveApplications.length + 1,
      userId,
      ...application,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewComments: null,
      appliedAt: new Date(),
      updatedAt: new Date()
    };
    this.leaveApplications.push(newApplication);
    return newApplication;
  }

  async getLeaveApplicationById(id: number): Promise<LeaveApplication | undefined> {
    return this.leaveApplications.find(app => app.id === id);
  }

  async getUserLeaveApplications(userId: number): Promise<any[]> {
    return this.leaveApplications
      .filter(app => app.userId === userId)
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }

  async getPendingLeaveApplications(reviewerId?: number): Promise<any[]> {
    const pendingApps = this.leaveApplications.filter(app => app.status === 'pending');
    return pendingApps.map(app => {
      const user = this.users.find(u => u.id === app.userId);
      return {
        ...app,
        userName: user?.fullName || 'Unknown',
        userEmail: user?.email || '',
        studentId: user?.studentId || '',
        department: user?.department || ''
      };
    });
  }

  async updateLeaveApplicationStatus(id: number, status: string, reviewerId: number, comments?: string): Promise<LeaveApplication | undefined> {
    const appIndex = this.leaveApplications.findIndex(app => app.id === id);
    if (appIndex === -1) return undefined;

    this.leaveApplications[appIndex] = {
      ...this.leaveApplications[appIndex],
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewComments: comments,
      updatedAt: new Date()
    };

    return this.leaveApplications[appIndex];
  }

  async getLeaveApplicationsForReview(facultyId: number): Promise<any[]> {
    return this.getPendingLeaveApplications();
  }

  async getRecentLeaveApplications(limit: number = 10): Promise<any[]> {
    const apps = [...this.leaveApplications]
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, limit);
    
    return apps.map(app => {
      const user = this.users.find(u => u.id === app.userId);
      return {
        ...app,
        userName: user?.fullName || 'Unknown',
        userEmail: user?.email || '',
        studentId: user?.studentId || ''
      };
    });
  }

  async getUserLeaveBalance(userId: number, year: number): Promise<LeaveBalance | undefined> {
    return this.leaveBalances.find(balance => balance.userId === userId && balance.year === year);
  }

  async createLeaveBalance(userId: number, year: number): Promise<LeaveBalance> {
    const newBalance: LeaveBalance = {
      id: this.leaveBalances.length + 1,
      userId,
      year,
      totalLeaves: 30,
      usedLeaves: 0,
      availableLeaves: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.leaveBalances.push(newBalance);
    return newBalance;
  }

  async updateLeaveBalance(userId: number, year: number, usedLeaves: number): Promise<void> {
    const balanceIndex = this.leaveBalances.findIndex(b => b.userId === userId && b.year === year);
    if (balanceIndex !== -1) {
      this.leaveBalances[balanceIndex].usedLeaves = usedLeaves;
      this.leaveBalances[balanceIndex].availableLeaves = 30 - usedLeaves;
      this.leaveBalances[balanceIndex].updatedAt = new Date();
    }
  }

  async createNotification(userId: number, notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: this.notifications.length + 1,
      userId,
      ...notification,
      data: notification.data || null,
      read: false,
      createdAt: new Date()
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: number, unreadOnly: boolean = false): Promise<Notification[]> {
    let userNotifications = this.notifications.filter(notif => notif.userId === userId);
    
    if (unreadOnly) {
      userNotifications = userNotifications.filter(notif => !notif.read);
    }
    
    return userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const notifIndex = this.notifications.findIndex(notif => notif.id === id);
    if (notifIndex !== -1) {
      this.notifications[notifIndex].read = true;
    }
  }

  async getSubstituteAssignments(facultyId: number): Promise<SubstituteAssignment[]> {
    return this.substituteAssignments.filter(assignment => assignment.substituteFacultyId === facultyId);
  }

  async createSubstituteAssignment(assignment: Omit<SubstituteAssignment, 'id' | 'createdAt'>): Promise<SubstituteAssignment> {
    const newAssignment: SubstituteAssignment = {
      id: this.substituteAssignments.length + 1,
      ...assignment,
      createdAt: new Date()
    };
    this.substituteAssignments.push(newAssignment);
    return newAssignment;
  }

  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return this.leavePolicies;
  }

  async getDashboardStats(userId: number, role: string): Promise<any> {
    if (role === 'student') {
      const currentYear = new Date().getFullYear();
      const balance = await this.getUserLeaveBalance(userId, currentYear);
      
      const applications = this.leaveApplications.filter(app => app.userId === userId);
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
      const pendingReviews = this.leaveApplications.filter(app => app.status === 'pending').length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const approvedToday = this.leaveApplications.filter(app => 
        app.reviewedBy === userId && 
        app.status === 'approved' && 
        app.reviewedAt && 
        new Date(app.reviewedAt) >= today && 
        new Date(app.reviewedAt) < tomorrow
      ).length;

      return {
        reviewStats: {
          pending: pendingReviews,
          approvedToday: approvedToday
        },
        facultyStats: {
          studentsAssigned: 42,
          substituteRequests: 2
        }
      };
    }

    return {};
  }

  async getSystemStats(): Promise<any> {
    const totalUsers = this.users.length;
    const pendingApprovals = this.leaveApplications.filter(app => app.status === 'pending').length;
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const leavesThisMonth = this.leaveApplications.filter(app => 
      new Date(app.appliedAt) >= currentMonth
    ).length;

    return {
      totalUsers,
      pendingApprovals,
      leavesThisMonth,
      efficiency: 94
    };
  }
}

export const storage = new MemoryStorage();