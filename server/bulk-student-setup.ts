import { db } from './db';
import { users } from '@shared/schema';

// Create 600+ students efficiently using bulk insert
export async function createBulkStudents() {
  console.log('Creating 600+ university students...');
  
  const DEPARTMENTS = ['CSE', 'ECE', 'IT', 'CSM', 'EEE'];
  const SECTIONS = ['A', 'B', 'C'];
  const YEARS = [1, 2, 3, 4];
  const STUDENTS_PER_SECTION = 30; // 30 students per section = 1800 total students
  
  const studentData = [];
  let phoneIndex = 7000000000;
  
  for (const dept of DEPARTMENTS) {
    for (const year of YEARS) {
      for (const section of SECTIONS) {
        for (let i = 1; i <= STUDENTS_PER_SECTION; i++) {
          const rollNumber = `20${dept}${section}${i.toString().padStart(3, '0')}`;
          const studentName = generateName(i);
          
          studentData.push({
            username: rollNumber.toLowerCase(),
            password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            email: `${rollNumber.toLowerCase()}@gvpcew.edu.in`,
            fullName: studentName,
            role: 'student',
            studentId: rollNumber,
            department: getDepartmentName(dept),
            year: year,
            semester: year * 2,
            section: `${dept}${section}`,
            phoneNumber: `+91-${phoneIndex++}`,
            address: `Hostel Block ${section}, Room ${100 + i}`
          });
        }
      }
    }
  }
  
  // Bulk insert in batches
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < studentData.length; i += batchSize) {
    const batch = studentData.slice(i, i + batchSize);
    try {
      await db.insert(users).values(batch).onConflictDoNothing();
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${studentData.length} students`);
    } catch (error) {
      console.error(`Error inserting batch starting at ${i}:`, error);
    }
  }
  
  console.log(`✅ Created ${inserted} students total`);
  return inserted;
}

function generateName(index: number): string {
  const names = [
    'Priya Sharma', 'Ananya Reddy', 'Kavya Krishna', 'Divya Patel', 'Sneha Gupta',
    'Pooja Agarwal', 'Meera Shah', 'Anjali Jain', 'Riya Singh', 'Shruthi Kumar',
    'Lakshmi Rao', 'Sowmya Nair', 'Pavani Iyer', 'Ramya Menon', 'Keerthi Pillai',
    'Swathi Srinivas', 'Bhavana Murthy', 'Deepika Prasad', 'Haritha Chandra', 'Yamini Devi',
    'Navya Kumari', 'Sruthi Das', 'Mounika Roy', 'Nikitha Ghosh', 'Varsha Banerjee',
    'Tejaswi Chatterjee', 'Manasa Mukherjee', 'Hema Bose', 'Jyothi Sen', 'Prasanna Mitra'
  ];
  return names[index % names.length];
}

function getDepartmentName(code: string): string {
  const depts = {
    'CSE': 'Computer Science Engineering',
    'ECE': 'Electronics and Communication Engineering', 
    'IT': 'Information Technology',
    'CSM': 'Computer Science and Engineering (Data Science)',
    'EEE': 'Electrical and Electronics Engineering'
  };
  return depts[code as keyof typeof depts];
}