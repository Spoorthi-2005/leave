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

    // Create GVPCEW Class Teachers
    const gowthami = await storage.createUser({
      username: "gowthami",
      email: "gowthami@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "Gowthami",
      role: "faculty",
      department: "Computer Science Engineering",
      designation: "Class Teacher - CSE1",
      employeeId: "EMP003",
      phoneNumber: "+91-9876543213",
      address: "Faculty Quarters, GVPCEW"
    });

    const ySowmya = await storage.createUser({
      username: "ysowmya",
      email: "ysowmya@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "Y Sowmya",
      role: "faculty",
      department: "Computer Science Engineering",
      designation: "Class Teacher - CSE2",
      employeeId: "EMP004",
      phoneNumber: "+91-9876543214",
      address: "Faculty Quarters, GVPCEW"
    });

    const mPavani = await storage.createUser({
      username: "mpavani",
      email: "mpavani@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "M Pavani",
      role: "faculty",
      department: "Computer Science Engineering",
      designation: "Class Teacher - CSE3",
      employeeId: "EMP005",
      phoneNumber: "+91-9876543215",
      address: "Faculty Quarters, GVPCEW"
    });

    // Create students for different sections
    const studentCSE1 = await storage.createUser({
      username: "student1",
      email: "student1@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "Priya Sharma",
      role: "student",
      department: "Computer Science Engineering",
      studentId: "20CS001",
      year: 4,
      semester: 8,
      section: "CSE1",
      phoneNumber: "+91-9876543216",
      address: "Hostel Block A, Room 201"
    });

    const studentCSE2 = await storage.createUser({
      username: "student2",
      email: "student2@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "Ananya Reddy",
      role: "student",
      department: "Computer Science Engineering",
      studentId: "20CS002",
      year: 4,
      semester: 8,
      section: "CSE2",
      phoneNumber: "+91-9876543217",
      address: "Hostel Block B, Room 105"
    });

    const studentCSE3 = await storage.createUser({
      username: "student3",
      email: "student3@gvpcew.edu.in",
      password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W",
      fullName: "Kavya Krishnan",
      role: "student",
      department: "Computer Science Engineering",
      studentId: "20CS003",
      year: 4,
      semester: 8,
      section: "CSE3",
      phoneNumber: "+91-9876543218",
      address: "Hostel Block C, Room 303"
    });

    // Create leave balances for all users
    await storage.createLeaveBalance(adminUser.id, new Date().getFullYear());
    await storage.createLeaveBalance(facultyUser.id, new Date().getFullYear());
    await storage.createLeaveBalance(gowthami.id, new Date().getFullYear());
    await storage.createLeaveBalance(ySowmya.id, new Date().getFullYear());
    await storage.createLeaveBalance(mPavani.id, new Date().getFullYear());
    await storage.createLeaveBalance(studentCSE1.id, new Date().getFullYear());
    await storage.createLeaveBalance(studentCSE2.id, new Date().getFullYear());
    await storage.createLeaveBalance(studentCSE3.id, new Date().getFullYear());

    // Create demo leave applications
    const fromDate1 = new Date(Date.now() + 86400000); // Tomorrow
    const toDate1 = new Date(Date.now() + 172800000); // Day after tomorrow
    const leaveDays1 = Math.ceil((toDate1.getTime() - fromDate1.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const studentLeaveApp = await storage.createLeaveApplication(studentCSE1.id, {
      leaveType: "sick",
      fromDate: fromDate1,
      toDate: toDate1,
      reason: "Suffering from fever and need medical attention",
      priority: "normal",
      attachmentPath: null
    });

    const fromDate2 = new Date(Date.now() + 259200000); // 3 days from now
    const toDate2 = new Date(Date.now() + 518400000); // 6 days from now

    const facultyLeaveApp = await storage.createLeaveApplication(facultyUser.id, {
      leaveType: "personal",
      fromDate: fromDate2,
      toDate: toDate2,
      reason: "Attending family function in hometown",
      priority: "normal",
      attachmentPath: null
    });

    // Create demo notifications
    await storage.createNotification(adminUser.id, {
      title: "New Leave Application",
      message: `${studentCSE1.fullName} has submitted a sick leave application`,
      type: "info"
    });

    await storage.createNotification(studentCSE1.id, {
      title: "Welcome to GVPCEW",
      message: "Your account has been successfully created. You can now submit leave applications.",
      type: "success"
    });

    await storage.createNotification(facultyUser.id, {
      title: "System Update",
      message: "Leave management system has been upgraded with new features.",
      type: "info"
    });

    console.log("GVPCEW Demo data initialized successfully:");
    console.log("- Admin: admin/password");
    console.log("- Faculty: faculty1/password");
    console.log("- Class Teachers: gowthami/password, ysowmya/password, mpavani/password");
    console.log("- Students: student1/password (CSE1), student2/password (CSE2), student3/password (CSE3)");

  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}