import { pgTable, serial, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
export const leaveTypeEnum = pgEnum("leave_type", ["sick", "personal", "emergency", "vacation"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull(),
  department: text("department"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leave applications table
export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: leaveTypeEnum("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason").notNull(),
  status: leaveStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leave balance table
export const leaveBalance = pgTable("leave_balance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  total: integer("total").default(20).notNull(),
  used: integer("used").default(0).notNull(),
  available: integer("available").default(20).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  leaveApplications: many(leaveApplications),
  leaveBalance: many(leaveBalance),
}));

export const leaveApplicationsRelations = relations(leaveApplications, ({ one }) => ({
  user: one(users, {
    fields: [leaveApplications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [leaveApplications.reviewedBy],
    references: [users.id],
  }),
}));

export const leaveBalanceRelations = relations(leaveBalance, ({ one }) => ({
  user: one(users, {
    fields: [leaveBalance.userId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
  department: true,
  phoneNumber: true,
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).pick({
  type: true,
  startDate: true,
  endDate: true,
  reason: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type LeaveApplication = typeof leaveApplications.$inferSelect;
export type LeaveBalance = typeof leaveBalance.$inferSelect;