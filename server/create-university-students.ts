import { storage } from './storage';
import { InsertUser } from '@shared/schema';

interface StudentData {
  name: string;
  rollNumber: string;
  section: string;
  year: number;
  department: string;
  phoneNumber: string;
  email: string;
}

// Generate comprehensive student data for all 5 departments
const DEPARTMENTS = ['CSE', 'ECE', 'IT', 'CSM', 'EEE'];
const SECTIONS = ['A', 'B', 'C']; // 3 sections per department
const YEARS = [1, 2, 3, 4]; // 4 years
const STUDENTS_PER_SECTION = 40; // 40 students per section

const FIRST_NAMES = [
  'Priya', 'Ananya', 'Kavya', 'Divya', 'Sneha', 'Pooja', 'Meera', 'Anjali', 'Riya', 'Shruthi',
  'Lakshmi', 'Sowmya', 'Pavani', 'Ramya', 'Keerthi', 'Swathi', 'Bhavana', 'Deepika', 'Haritha', 'Yamini',
  'Navya', 'Sruthi', 'Mounika', 'Nikitha', 'Varsha', 'Tejaswi', 'Manasa', 'Hema', 'Jyothi', 'Prasanna',
  'Vani', 'Sandhya', 'Gayatri', 'Madhavi', 'Sushma', 'Rekha', 'Sunitha', 'Usha', 'Radha', 'Sita'
];

const LAST_NAMES = [
  'Sharma', 'Reddy', 'Krishnan', 'Patel', 'Gupta', 'Agarwal', 'Mehta', 'Shah', 'Jain', 'Bansal',
  'Singh', 'Kumar', 'Rao', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Srinivas', 'Murthy', 'Prasad',
  'Chandra', 'Devi', 'Kumari', 'Bai', 'Das', 'Roy', 'Ghosh', 'Chatterjee', 'Mukherjee', 'Banerjee'
];

function generateStudentName(index: number): string {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  return `${firstName} ${lastName}`;
}

function generateRollNumber(department: string, year: number, section: string, studentNum: number): string {
  const yearCode = (new Date().getFullYear() - (4 - year)).toString().slice(-2);
  const deptCode = department;
  const sectionCode = section;
  const studentCode = studentNum.toString().padStart(3, '0');
  return `${yearCode}${deptCode}${sectionCode}${studentCode}`;
}

function generatePhoneNumber(index: number): string {
  const baseNumber = 9876543000;
  return `+91-${(baseNumber + index).toString()}`;
}

function generateEmail(rollNumber: string): string {
  return `${rollNumber.toLowerCase()}@gvpcew.edu.in`;
}

export async function createUniversityStudents() {
  console.log('Creating comprehensive university student database...');
  
  let totalStudents = 0;
  let studentIndex = 0;

  for (const department of DEPARTMENTS) {
    for (const year of YEARS) {
      for (const section of SECTIONS) {
        const sectionName = `${department}${section}`;
        
        for (let studentNum = 1; studentNum <= STUDENTS_PER_SECTION; studentNum++) {
          const rollNumber = generateRollNumber(department, year, section, studentNum);
          const fullName = generateStudentName(studentIndex);
          const phoneNumber = generatePhoneNumber(studentIndex + 1000);
          const email = generateEmail(rollNumber);
          
          const studentData: InsertUser = {
            username: rollNumber.toLowerCase(),
            password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
            email: email,
            fullName: fullName,
            role: 'student',
            studentId: rollNumber,
            department: getDepartmentFullName(department),
            year: year,
            semester: year * 2,
            section: sectionName,
            phoneNumber: phoneNumber,
            address: `Hostel Block ${section}, Room ${100 + studentNum}`
          };

          try {
            const existingStudent = await storage.getUserByUsername(studentData.username);
            if (!existingStudent) {
              await storage.createUser(studentData);
              totalStudents++;
            }
          } catch (error) {
            console.error(`Error creating student ${rollNumber}:`, error);
          }
          
          studentIndex++;
        }
        
        console.log(`Created students for ${department} Year ${year} Section ${section}`);
      }
    }
  }
  
  console.log(`\n✅ University Student Database Created Successfully!`);
  console.log(`📊 Total Students: ${totalStudents}`);
  console.log(`🏫 Departments: ${DEPARTMENTS.length} (${DEPARTMENTS.join(', ')})`);
  console.log(`👥 Sections per Department: ${SECTIONS.length} per year`);
  console.log(`📚 Years: ${YEARS.length} (1st to 4th year)`);
  console.log(`🎓 Students per Section: ${STUDENTS_PER_SECTION}`);
  console.log(`\n📞 All students have unique phone numbers for WhatsApp notifications`);
  console.log(`✉️ All students have university email addresses`);
  console.log(`🔐 All students can login with their roll number and password: 'password'`);
  
  return totalStudents;
}

function getDepartmentFullName(deptCode: string): string {
  const departments = {
    'CSE': 'Computer Science Engineering',
    'ECE': 'Electronics and Communication Engineering',
    'IT': 'Information Technology',
    'CSM': 'Computer Science and Engineering (Data Science)',
    'EEE': 'Electrical and Electronics Engineering'
  };
  return departments[deptCode as keyof typeof departments] || deptCode;
}

// Function to test random student leave applications
export async function testRandomStudentApplications(count: number = 10) {
  console.log(`\n🧪 Testing ${count} random student leave applications...`);
  
  const leaveTypes = ['sick', 'personal', 'emergency', 'casual'];
  const reasons = [
    'Suffering from fever and need medical attention',
    'Family function attendance required',
    'Medical emergency in family',
    'Personal work to be completed',
    'Attending cousin\'s wedding ceremony',
    'Grandmother admitted to hospital',
    'Important family meeting',
    'Medical check-up appointment'
  ];

  for (let i = 0; i < count; i++) {
    try {
      // Generate random student data
      const randomDept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
      const randomYear = YEARS[Math.floor(Math.random() * YEARS.length)];
      const randomSection = SECTIONS[Math.floor(Math.random() * SECTIONS.length)];
      const randomStudentNum = Math.floor(Math.random() * STUDENTS_PER_SECTION) + 1;
      
      const rollNumber = generateRollNumber(randomDept, randomYear, randomSection, randomStudentNum);
      const student = await storage.getUserByUsername(rollNumber.toLowerCase());
      
      if (student) {
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() + Math.floor(Math.random() * 30) + 1);
        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + Math.floor(Math.random() * 3) + 1);
        
        const application = await storage.createLeaveApplication(student.id, {
          leaveType: leaveType as any,
          fromDate: fromDate,
          toDate: toDate,
          reason: reason,
          priority: Math.random() > 0.8 ? 'urgent' : 'normal'
        });
        
        console.log(`✅ Application ${i + 1}: ${student.fullName} (${student.section}) - ${leaveType} leave`);
      }
    } catch (error) {
      console.error(`❌ Error creating test application ${i + 1}:`, error);
    }
  }
  
  console.log(`\n🎉 Created ${count} test applications from random students across all departments!`);
}