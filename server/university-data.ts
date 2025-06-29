import { storage } from "./storage";

export async function initializeUniversityData() {
  try {
    console.log("Initializing comprehensive university data for GVPCEW...");
    
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash("password", 10);

    // All departments in GVPCEW
    const departments = [
      { code: "CSE", name: "Computer Science Engineering" },
      { code: "ECE", name: "Electronics and Communication Engineering" },
      { code: "IT", name: "Information Technology" },
      { code: "CSM", name: "Computer Science and Mathematics" },
      { code: "EEE", name: "Electrical and Electronics Engineering" }
    ];

    const years = [1, 2, 3, 4];
    const sections = ["A", "B", "C"];

    // Create comprehensive student data across all years and departments
    const students = [];
    let studentIdCounter = 1;

    for (const dept of departments) {
      for (const year of years) {
        for (const section of sections) {
          // Create 10 students per section for demonstration
          for (let i = 1; i <= 10; i++) {
            const sectionCode = `${dept.code}${year}${section}`;
            const studentId = `22761A${dept.code === "CSE" ? "05" : dept.code === "ECE" ? "04" : dept.code === "IT" ? "12" : dept.code === "CSM" ? "54" : dept.code === "EEE" ? "03" : "99"}${String(studentIdCounter).padStart(2, '0')}`;
            
            const student = await storage.createUser({
              username: `student_${sectionCode.toLowerCase()}_${i}`,
              email: `${studentId.toLowerCase()}@gvpcew.edu.in`,
              password: hashedPassword,
              fullName: generateStudentName(i, dept.code),
              role: "student",
              department: dept.name,
              year: year,
              semester: year * 2,
              section: sectionCode,
              studentId: studentId,
              phoneNumber: `+91-${9000000000 + studentIdCounter}`,
              address: `Student Hostel, Block ${section}, Room ${100 + i}`
            });
            
            students.push(student);
            studentIdCounter++;
          }
        }
      }
    }

    // Create class teachers for all sections across all departments and years
    const classTeachers = [];
    let empIdCounter = 100;

    for (const dept of departments) {
      for (const year of years) {
        for (const section of sections) {
          const sectionCode = `${dept.code}${year}${section}`;
          const teacher = await storage.createUser({
            username: `teacher_${sectionCode.toLowerCase()}`,
            email: `teacher.${sectionCode.toLowerCase()}@gvpcew.edu.in`,
            password: hashedPassword,
            fullName: generateTeacherName(empIdCounter, dept.code),
            role: "faculty",
            department: dept.name,
            designation: `Assistant Professor & Class Teacher - ${sectionCode}`,
            employeeId: `EMP${empIdCounter}`,
            phoneNumber: `+91-${9100000000 + empIdCounter}`,
            address: "Faculty Quarters, GVPCEW",
            section: sectionCode
          });
          
          classTeachers.push(teacher);
          empIdCounter++;
        }
      }
    }

    // Create HODs for all departments
    const hods = [];
    for (const dept of departments) {
      const hod = await storage.createUser({
        username: `hod_${dept.code.toLowerCase()}`,
        email: `hod.${dept.code.toLowerCase()}@gvpcew.edu.in`,
        password: hashedPassword,
        fullName: generateHODName(dept.code),
        role: "faculty",
        department: dept.name,
        designation: `Head of Department - ${dept.name}`,
        employeeId: `HOD${dept.code}`,
        phoneNumber: `+91-${9200000000 + dept.code.charCodeAt(0)}`,
        address: "Faculty Quarters, GVPCEW"
      });
      hods.push(hod);
    }

    // Create Vice Principal and Principal
    const admin = await storage.createUser({
      username: "vice_principal",
      email: "vp@gvpcew.edu.in",
      password: hashedPassword,
      fullName: "Dr. Priya Sharma",
      role: "admin",
      department: "Administration",
      designation: "Vice Principal",
      employeeId: "VP001",
      phoneNumber: "+91-9876543210",
      address: "Administrative Block, GVPCEW"
    });

    // Create leave balances for all users
    const currentYear = new Date().getFullYear();
    const allUsers = [...students, ...classTeachers, ...hods, admin];
    
    for (const user of allUsers) {
      await storage.createLeaveBalance(user.id, currentYear);
    }

    console.log(`Created ${students.length} students across ${departments.length} departments`);
    console.log(`Created ${classTeachers.length} class teachers`);
    console.log(`Created ${hods.length} HODs`);
    console.log("University data initialization complete!");

  } catch (error) {
    console.error("Error initializing university data:", error);
  }
}

function generateStudentName(index: number, deptCode: string): string {
  const firstNames = [
    "Aadhya", "Bharathi", "Chandana", "Divya", "Eesha", "Fathima", "Gayathri", "Haritha", "Ishitha", "Jyothi",
    "Kavitha", "Lakshmi", "Meera", "Nandini", "Priya", "Rachana", "Sita", "Tanuja", "Uma", "Varsha",
    "Spoorthi", "Sneha", "Pooja", "Ramya", "Swathi", "Tejaswi", "Vaishnavi", "Yamini", "Zara", "Anitha"
  ];
  
  const lastNames = [
    "Reddy", "Sharma", "Devi", "Kumari", "Rao", "Krishna", "Prasad", "Chandra", "Sree", "Lakshmi",
    "Bhavani", "Saraswathi", "Durga", "Ganga", "Indira", "Jaya", "Kala", "Lalitha", "Mala", "Naga"
  ];
  
  const firstName = firstNames[(index - 1) % firstNames.length];
  const lastName = lastNames[Math.floor((index - 1) / firstNames.length) % lastNames.length];
  
  return `${firstName} ${lastName}`;
}

function generateTeacherName(empId: number, deptCode: string): string {
  const titles = ["Dr.", "Prof.", "Mrs.", "Ms."];
  const names = [
    "Gowthami Reddy", "Sowmya Devi", "Pavani Sharma", "Ramya Krishna", "Sujatha Rao",
    "Madhavi Prasad", "Sunitha Chandra", "Kavitha Sree", "Radha Lakshmi", "Manjula Bhavani",
    "Nirmala Saraswathi", "Padmavathi Durga", "Rajani Ganga", "Sarita Indira", "Tulasi Jaya"
  ];
  
  const title = titles[empId % titles.length];
  const name = names[empId % names.length];
  
  return `${title} ${name}`;
}

function generateHODName(deptCode: string): string {
  const hodNames = {
    "CSE": "Dr. Rajesh Kumar Reddy",
    "ECE": "Dr. Meera Lakshmi Devi", 
    "EEE": "Dr. Sita Rama Krishna",
    "MECH": "Dr. Rama Krishna Rao",
    "CIVIL": "Dr. Lakshmi Prasad Sharma",
    "IT": "Dr. Vani Sree Chandra",
    "AIDS": "Dr. Deepika Bhavani",
    "AIML": "Dr. Sangeetha Durga"
  };
  
  return hodNames[deptCode as keyof typeof hodNames] || `Dr. ${deptCode} Department Head`;
}

function generateEmergencyContact(index: number): string {
  const relations = ["Father", "Mother", "Guardian", "Uncle", "Aunt"];
  const names = [
    "Ravi Kumar", "Lakshmi Devi", "Srinivas Rao", "Padmavathi", "Krishna Murthy",
    "Saraswathi", "Venkata Reddy", "Durga Prasad", "Rama Devi", "Ganga Rao"
  ];
  
  const relation = relations[index % relations.length];
  const name = names[index % names.length];
  
  return `${name} (${relation})`;
}