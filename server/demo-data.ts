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

    // Create HOD for CSE
    const hodUser = await storage.createUser({
      username: "hod_cse",
      email: "hod.cse@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr PVSL Jagadamba",
      role: "hod",
      department: "CSE",
      phoneNumber: "+91-9876543211",
      isActive: true
    });

    // Create Faculty
    const facultyUser = await storage.createUser({
      username: "faculty1",
      email: "faculty1@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. John Smith",
      role: "teacher",
      department: "CSE",
      phoneNumber: "+91-9876543212",
      isActive: true
    });

    // Create Student
    const studentUser = await storage.createUser({
      username: "teststudent",
      email: "student@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Jane Doe",
      role: "student",
      department: "CSE",
      phoneNumber: "+91-9876543213",
      isActive: true
    });

    console.log("Demo data initialized successfully!");
    console.log("Test accounts created:");
    console.log("- Admin: admin/password");
    console.log("- HOD: hod_cse/password"); 
    console.log("- Faculty: faculty1/password");
    console.log("- Student: teststudent/password");

  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}