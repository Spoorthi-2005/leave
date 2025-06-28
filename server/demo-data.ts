import { storage } from "./storage";

export async function initializeDemoData() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Demo data already initialized");
      return;
    }

    // Create demo users
    const adminUser = await storage.createUser({
      username: "admin",
      email: "admin@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W", // password: "password"
      fullName: "Dr. Priya Sharma",
      role: "admin",
      department: "Computer Science Engineering",
      designation: "Principal",
      employeeId: "EMP001",
      phoneNumber: "+91-9876543210",
      address: "GVPCEW Campus, Bhimavaram"
    });

    const facultyUser = await storage.createUser({
      username: "faculty1",
      email: "faculty1@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "Prof. Lakshmi Devi",
      role: "faculty",
      department: "Computer Science Engineering",
      designation: "Associate Professor",
      employeeId: "EMP002",
      phoneNumber: "+91-9876543211",
      address: "Faculty Quarters, GVPCEW"
    });

    const studentUser = await storage.createUser({
      username: "student1",
      email: "student1@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "Sreeja Reddy",
      role: "student",
      department: "Computer Science Engineering",
      studentId: "20CS001",
      year: 3,
      semester: 1,
      phoneNumber: "+91-9876543212",
      address: "Hostel Block A, Room 201"
    });

    // Create leave balances for demo users
    await storage.createLeaveBalance(studentUser.id, new Date().getFullYear());
    await storage.createLeaveBalance(facultyUser.id, new Date().getFullYear());
    await storage.createLeaveBalance(adminUser.id, new Date().getFullYear());

    // Create demo leave applications
    const studentLeaveApp = await storage.createLeaveApplication(studentUser.id, {
      leaveType: "sick",
      fromDate: new Date(Date.now() + 86400000), // Tomorrow
      toDate: new Date(Date.now() + 172800000), // Day after tomorrow
      reason: "Suffering from fever and need medical attention",
      priority: "normal",
      attachmentPath: null
    });

    const facultyLeaveApp = await storage.createLeaveApplication(facultyUser.id, {
      leaveType: "personal",
      fromDate: new Date(Date.now() + 259200000), // 3 days from now
      toDate: new Date(Date.now() + 518400000), // 6 days from now
      reason: "Attending family function in hometown",
      priority: "normal",
      attachmentPath: null
    });

    // Create demo notifications
    await storage.createNotification(adminUser.id, {
      title: "New Leave Application",
      message: `${studentUser.fullName} has submitted a sick leave application`,
      type: "info"
    });

    await storage.createNotification(studentUser.id, {
      title: "Welcome to GVPCEW",
      message: "Your account has been successfully created. You can now submit leave applications.",
      type: "success"
    });

    await storage.createNotification(facultyUser.id, {
      title: "System Update",
      message: "Leave management system has been upgraded with new features.",
      type: "info"
    });

    console.log("Demo data initialized successfully:");
    console.log("- Admin: admin/password");
    console.log("- Faculty: faculty1/password");
    console.log("- Student: student1/password");

  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}