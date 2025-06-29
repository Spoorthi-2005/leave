import { storage } from "./storage";

export async function initializeDemoData() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Demo data already initialized");
      return;
    }

    // Import hash function for consistent password hashing
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash("password", 10);
    console.log("Created hashed password for demo users");

    // Create Vice Principal (Admin)
    const adminUser = await storage.createUser({
      username: "admin",
      email: "admin@gvpcew.edu.in", 
      password: hashedPassword,
      fullName: "Dr. Priya Sharma",
      role: "admin",
      department: "Administration",
      designation: "Vice Principal",
      employeeId: "VP001",
      phoneNumber: "+91-9876543210",
      address: "GVPCEW Campus, Madhurawada, Visakhapatnam"
    });

    // Create HODs for all departments
    const cseHod = await storage.createUser({
      username: "cse_hod",
      email: "cse.hod@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Rajesh Kumar",
      role: "faculty",
      department: "Computer Science Engineering",
      designation: "HOD - CSE",
      employeeId: "HOD001",
      phoneNumber: "+91-9876543211",
      address: "Faculty Quarters, GVPCEW"
    });

    const eceHod = await storage.createUser({
      username: "ece_hod",
      email: "ece.hod@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Meera Rao",
      role: "faculty",
      department: "Electronics and Communication Engineering",
      designation: "HOD - ECE",
      employeeId: "HOD002",
      phoneNumber: "+91-9876543212",
      address: "Faculty Quarters, GVPCEW"
    });

    const eeeHod = await storage.createUser({
      username: "eee_hod",
      email: "eee.hod@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Sita Devi",
      role: "faculty",
      department: "Electrical and Electronics Engineering",
      designation: "HOD - EEE",
      employeeId: "HOD003",
      phoneNumber: "+91-9876543213",
      address: "Faculty Quarters, GVPCEW"
    });

    const mechHod = await storage.createUser({
      username: "mech_hod",
      email: "mech.hod@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Rama Krishna",
      role: "faculty",
      department: "Mechanical Engineering",
      designation: "HOD - MECH",
      employeeId: "HOD004",
      phoneNumber: "+91-9876543214",
      address: "Faculty Quarters, GVPCEW"
    });

    const civilHod = await storage.createUser({
      username: "civil_hod",
      email: "civil.hod@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Lakshmi Prasad",
      role: "faculty",
      department: "Civil Engineering",
      designation: "HOD - CIVIL",
      employeeId: "HOD005",
      phoneNumber: "+91-9876543215",
      address: "Faculty Quarters, GVPCEW"
    });

    // Create CSE Class Teachers for all years and sections
    const gowthami = await storage.createUser({
      username: "gowthami",
      email: "gowthami@gvpcew.edu.in",
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
    await storage.createLeaveBalance(cseHod.id, new Date().getFullYear());
    await storage.createLeaveBalance(eceHod.id, new Date().getFullYear());
    await storage.createLeaveBalance(eeeHod.id, new Date().getFullYear());
    await storage.createLeaveBalance(mechHod.id, new Date().getFullYear());
    await storage.createLeaveBalance(civilHod.id, new Date().getFullYear());
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
      attachmentPath: null,
      leaveDays: leaveDays1
    });

    const fromDate2 = new Date(Date.now() + 259200000); // 3 days from now
    const toDate2 = new Date(Date.now() + 518400000); // 6 days from now
    const leaveDays2 = Math.ceil((toDate2.getTime() - fromDate2.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const facultyLeaveApp = await storage.createLeaveApplication(gowthami.id, {
      leaveType: "personal",
      fromDate: fromDate2,
      toDate: toDate2,
      reason: "Attending family function in hometown",
      priority: "normal",
      attachmentPath: null,
      leaveDays: leaveDays2
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