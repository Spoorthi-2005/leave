import { storage } from "./simple-storage";

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
    console.log("Creating demo users with hashed passwords");

    // Create Vice Principal (Admin)
    const adminUser = await storage.createUser({
      username: "admin",
      email: "admin@gvpcew.edu.in", 
      password: hashedPassword,
      fullName: "Dr. Priya Sharma",
      role: "admin",
      department: "Administration",
      phoneNumber: "+91-9876543210",
      isActive: true
    });

    // Create HODs for all departments (CSE, IT, ECE, EEE, CSM)
    const hodCSE = await storage.createUser({
      username: "hod_cse",
      email: "hod.cse@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr PVSL Jagadamba",
      role: "hod",
      department: "CSE",
      phoneNumber: "+91-9876543211",
      isActive: true
    });

    const hodIT = await storage.createUser({
      username: "hod_it",
      email: "hod.it@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Rajesh Kumar",
      role: "hod",
      department: "IT",
      phoneNumber: "+91-9876543221",
      isActive: true
    });

    const hodECE = await storage.createUser({
      username: "hod_ece",
      email: "hod.ece@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Sunita Reddy",
      role: "hod",
      department: "ECE",
      phoneNumber: "+91-9876543231",
      isActive: true
    });

    const hodEEE = await storage.createUser({
      username: "hod_eee",
      email: "hod.eee@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Anil Sharma",
      role: "hod",
      department: "EEE",
      phoneNumber: "+91-9876543241",
      isActive: true
    });

    const hodCSM = await storage.createUser({
      username: "hod_csm",
      email: "hod.csm@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Meera Patel",
      role: "hod",
      department: "CSM",
      phoneNumber: "+91-9876543251",
      isActive: true
    });

    // Create Faculty for all departments
    const facultyCSE = await storage.createUser({
      username: "faculty1",
      email: "faculty1@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. John Smith",
      role: "teacher",
      department: "CSE",
      phoneNumber: "+91-9876543212",
      isActive: true
    });

    const facultyIT = await storage.createUser({
      username: "faculty_it",
      email: "faculty.it@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Priya Gupta",
      role: "teacher",
      department: "IT",
      phoneNumber: "+91-9876543222",
      isActive: true
    });

    const facultyECE = await storage.createUser({
      username: "faculty_ece",
      email: "faculty.ece@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Ravi Verma",
      role: "teacher",
      department: "ECE",
      phoneNumber: "+91-9876543232",
      isActive: true
    });

    const facultyEEE = await storage.createUser({
      username: "faculty_eee",
      email: "faculty.eee@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Kavita Singh",
      role: "teacher",
      department: "EEE",
      phoneNumber: "+91-9876543242",
      isActive: true
    });

    const facultyCSM = await storage.createUser({
      username: "faculty_csm",
      email: "faculty.csm@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Neha Agarwal",
      role: "teacher",
      department: "CSM",
      phoneNumber: "+91-9876543252",
      isActive: true
    });

    // Create Students for all departments
    const studentCSE = await storage.createUser({
      username: "teststudent",
      email: "student@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Jane Doe",
      role: "student",
      department: "CSE",
      phoneNumber: "+91-9876543213",
      isActive: true
    });

    const studentIT = await storage.createUser({
      username: "student_it",
      email: "student.it@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Riya Sharma",
      role: "student",
      department: "IT",
      phoneNumber: "+91-9876543223",
      isActive: true
    });

    const studentECE = await storage.createUser({
      username: "student_ece",
      email: "student.ece@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Ananya Patel",
      role: "student",
      department: "ECE",
      phoneNumber: "+91-9876543233",
      isActive: true
    });

    const studentEEE = await storage.createUser({
      username: "student_eee",
      email: "student.eee@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Shreya Reddy",
      role: "student",
      department: "EEE",
      phoneNumber: "+91-9876543243",
      isActive: true
    });

    const studentCSM = await storage.createUser({
      username: "student_csm",
      email: "student.csm@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Pooja Kumar",
      role: "student",
      department: "CSM",
      phoneNumber: "+91-9876543253",
      isActive: true
    });

    console.log("Demo data initialized successfully!");
    console.log("Test accounts created:");
    console.log("- Admin: admin/password");
    console.log("- HODs: hod_cse/password, hod_it/password, hod_ece/password, hod_eee/password, hod_csm/password");
    console.log("- Faculty: faculty1/password, faculty_it/password, faculty_ece/password, faculty_eee/password, faculty_csm/password");
    console.log("- Students: teststudent/password, student_it/password, student_ece/password, student_eee/password, student_csm/password");

  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}