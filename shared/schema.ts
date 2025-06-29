import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json, date, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["student", "faculty", "admin"]);
export const leaveTypeEnum = pgEnum("leave_type", ["sick", "casual", "personal", "emergency", "other"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "teacher_approved", "hod_approved", "approved", "rejected", "cancelled"]);
export const priorityEnum = pgEnum("priority", ["normal", "urgent"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull(),
  studentId: text("student_id"),
  employeeId: text("employee_id"),
  department: text("department"),
  year: integer("year"),
  semester: integer("semester"),
  section: text("section"), // CSE1, CSE2, CSE3
  designation: text("designation"),
  phoneNumber: text("phone_number"),
  classTeacherId: integer("class_teacher_id"),
  hodId: integer("hod_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  profileImage: text("profile_image"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leaveBalance = pgTable("leave_balance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalLeaves: integer("total_leaves").default(30).notNull(),
  usedLeaves: integer("used_leaves").default(0).notNull(),
  pendingLeaves: integer("pending_leaves").default(0).notNull(),
  availableLeaves: integer("available_leaves").default(30).notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  fromDate: timestamp("from_date").notNull(),
  toDate: timestamp("to_date").notNull(),
  reason: text("reason").notNull(),
  status: leaveStatusEnum("status").default("pending").notNull(),
  priority: priorityEnum("priority").default("normal").notNull(),
  attachmentPath: text("attachment_path"),
  attachmentName: text("attachment_name"),
  attachmentSize: integer("attachment_size"),
  classTeacherId: integer("class_teacher_id").references(() => users.id),
  hodId: integer("hod_id").references(() => users.id),
  classTeacherApprovedAt: timestamp("class_teacher_approved_at"),
  hodApprovedAt: timestamp("hod_approved_at"),
  classTeacherComments: text("class_teacher_comments"),
  hodComments: text("hod_comments"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  leaveDays: integer("leave_days").notNull(),
  adminId: integer("admin_id").references(() => users.id),
  adminApprovedAt: timestamp("admin_approved_at"),
  adminComments: text("admin_comments"),
  isLongLeave: boolean("is_long_leave").notNull().default(false),
});

export const substituteAssignments = pgTable("substitute_assignments", {
  id: serial("id").primaryKey(),
  leaveApplicationId: integer("leave_application_id").references(() => leaveApplications.id).notNull(),
  originalFacultyId: integer("original_faculty_id").references(() => users.id).notNull(),
  substituteFacultyId: integer("substitute_faculty_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  classSection: text("class_section").notNull(),
  period: text("period").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").default("assigned").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // success, error, warning, info
  read: boolean("read").default(false).notNull(),
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leavePolicies = pgTable("leave_policies", {
  id: serial("id").primaryKey(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  maxDaysPerApplication: integer("max_days_per_application").notNull(),
  totalAnnualDays: integer("total_annual_days").notNull(),
  requiresApproval: boolean("requires_approval").default(true).notNull(),
  requiresDocument: boolean("requires_document").default(false).notNull(),
  escalationDays: integer("escalation_days").default(7).notNull(),
  applicableRoles: json("applicable_roles").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  leaveApplications: many(leaveApplications),
  leaveBalance: one(leaveBalance),
  notifications: many(notifications),
  reviewedApplications: many(leaveApplications, { relationName: "reviewer" }),
  originalAssignments: many(substituteAssignments, { relationName: "originalFaculty" }),
  substituteAssignments: many(substituteAssignments, { relationName: "substituteFaculty" }),
}));

export const leaveApplicationsRelations = relations(leaveApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [leaveApplications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [leaveApplications.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
  substituteAssignments: many(substituteAssignments),
}));

export const leaveBalanceRelations = relations(leaveBalance, ({ one }) => ({
  user: one(users, {
    fields: [leaveBalance.userId],
    references: [users.id],
  }),
}));

export const substituteAssignmentsRelations = relations(substituteAssignments, ({ one }) => ({
  leaveApplication: one(leaveApplications, {
    fields: [substituteAssignments.leaveApplicationId],
    references: [leaveApplications.id],
  }),
  originalFaculty: one(users, {
    fields: [substituteAssignments.originalFacultyId],
    references: [users.id],
    relationName: "originalFaculty",
  }),
  substituteFaculty: one(users, {
    fields: [substituteAssignments.substituteFacultyId],
    references: [users.id],
    relationName: "substituteFaculty",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
  studentId: true,
  employeeId: true,
  department: true,
  year: true,
  semester: true,
  section: true,
  designation: true,
  phoneNumber: true,
  address: true,
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).pick({
  leaveType: true,
  fromDate: true,
  toDate: true,
  reason: true,
  priority: true,
  attachmentPath: true,
  leaveDays: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  title: true,
  message: true,
  type: true,
  data: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type LeaveApplication = typeof leaveApplications.$inferSelect;
export type LeaveBalance = typeof leaveBalance.$inferSelect;
export type SubstituteAssignment = typeof substituteAssignments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LeavePolicy = typeof leavePolicies.$inferSelect;
