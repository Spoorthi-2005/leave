import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: "student" | "teacher" | "admin";
  department?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveApplication {
  id: number;
  userId: number;
  type: "sick" | "personal" | "emergency" | "vacation";
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: number;
  reviewedAt?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for display
  studentName?: string;
  reviewerName?: string;
}

export interface LeaveBalance {
  id: number;
  userId: number;
  year: number;
  total: number;
  used: number;
  available: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  
  // Leave Applications
  createLeaveApplication(application: Omit<LeaveApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveApplication>;
  getUserLeaveApplications(userId: number): Promise<LeaveApplication[]>;
  getPendingLeaveApplications(): Promise<LeaveApplication[]>;
  getAllLeaveApplications(): Promise<LeaveApplication[]>;
  updateLeaveApplication(id: number, status: "approved" | "rejected", reviewedBy: number, comments: string): Promise<LeaveApplication | undefined>;
  
  // Leave Balance
  getUserLeaveBalance(userId: number, year: number): Promise<LeaveBalance | undefined>;
  createLeaveBalance(userId: number, year: number): Promise<LeaveBalance>;
  updateLeaveBalance(userId: number, year: number, used: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private leaveApplications: LeaveApplication[] = [];
  private leaveBalances: LeaveBalance[] = [];
  private nextUserId = 1;
  private nextApplicationId = 1;
  private nextBalanceId = 1;
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    // Create demo teacher
    await this.createUser({
      username: "teacher1",
      email: "teacher1@school.edu",
      password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      fullName: "Dr. Sarah Johnson",
      role: "teacher",
      department: "Computer Science",
      phoneNumber: "+1-555-0101",
      isActive: true,
    });

    // Create demo student
    await this.createUser({
      username: "student1",
      email: "student1@school.edu",
      password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      fullName: "John Smith",
      role: "student",
      department: "Computer Science",
      phoneNumber: "+1-555-0201",
      isActive: true,
    });

    // Create leave balance for student
    await this.createLeaveBalance(2, 2024);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async createLeaveApplication(appData: Omit<LeaveApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveApplication> {
    const application: LeaveApplication = {
      id: this.nextApplicationId++,
      ...appData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add student name for display
    const user = await this.getUser(application.userId);
    if (user) {
      application.studentName = user.fullName;
    }
    
    this.leaveApplications.push(application);
    return application;
  }

  async getUserLeaveApplications(userId: number): Promise<LeaveApplication[]> {
    return this.leaveApplications
      .filter(app => app.userId === userId)
      .map(app => ({
        ...app,
        studentName: this.users.find(u => u.id === app.userId)?.fullName,
        reviewerName: app.reviewedBy ? this.users.find(u => u.id === app.reviewedBy)?.fullName : undefined,
      }));
  }

  async getPendingLeaveApplications(): Promise<LeaveApplication[]> {
    return this.leaveApplications
      .filter(app => app.status === "pending")
      .map(app => ({
        ...app,
        studentName: this.users.find(u => u.id === app.userId)?.fullName,
      }));
  }

  async getAllLeaveApplications(): Promise<LeaveApplication[]> {
    return this.leaveApplications.map(app => ({
      ...app,
      studentName: this.users.find(u => u.id === app.userId)?.fullName,
      reviewerName: app.reviewedBy ? this.users.find(u => u.id === app.reviewedBy)?.fullName : undefined,
    }));
  }

  async updateLeaveApplication(id: number, status: "approved" | "rejected", reviewedBy: number, comments: string): Promise<LeaveApplication | undefined> {
    const appIndex = this.leaveApplications.findIndex(app => app.id === id);
    if (appIndex === -1) return undefined;

    this.leaveApplications[appIndex] = {
      ...this.leaveApplications[appIndex],
      status,
      reviewedBy,
      reviewedAt: new Date(),
      comments,
      updatedAt: new Date(),
    };

    // Update leave balance if approved
    if (status === "approved") {
      const app = this.leaveApplications[appIndex];
      const days = Math.ceil((app.endDate.getTime() - app.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      await this.updateLeaveBalance(app.userId, new Date().getFullYear(), days);
    }

    return this.leaveApplications[appIndex];
  }

  async getUserLeaveBalance(userId: number, year: number): Promise<LeaveBalance | undefined> {
    return this.leaveBalances.find(b => b.userId === userId && b.year === year);
  }

  async createLeaveBalance(userId: number, year: number): Promise<LeaveBalance> {
    const balance: LeaveBalance = {
      id: this.nextBalanceId++,
      userId,
      year,
      total: 20,
      used: 0,
      available: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leaveBalances.push(balance);
    return balance;
  }

  async updateLeaveBalance(userId: number, year: number, additionalUsed: number): Promise<void> {
    const balanceIndex = this.leaveBalances.findIndex(b => b.userId === userId && b.year === year);
    if (balanceIndex !== -1) {
      this.leaveBalances[balanceIndex].used += additionalUsed;
      this.leaveBalances[balanceIndex].available = this.leaveBalances[balanceIndex].total - this.leaveBalances[balanceIndex].used;
      this.leaveBalances[balanceIndex].updatedAt = new Date();
    }
  }
}

export const storage = new MemoryStorage();