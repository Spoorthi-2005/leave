import * as XLSX from 'xlsx';
import { storage } from './storage';
import * as path from 'path';

interface StudentData {
  name: string;
  rollNumber: string;
  section: string;
  email?: string;
  phoneNumber?: string;
}

export async function importStudentData() {
  try {
    // Read the Excel file
    const filePath = path.join(process.cwd(), 'attached_assets', 'Student Detail Sheet(1)_1751096477975.xlsx');
    const workbook = XLSX.readFile(filePath);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('Raw Excel data:', jsonData.slice(0, 3)); // Log first 3 rows to understand structure
    
    const students: StudentData[] = [];
    
    // Process each row (assuming standard Excel format)
    jsonData.forEach((row: any, index) => {
      try {
        // Try different possible column names
        const name = row['Name'] || row['Student Name'] || row['STUDENT NAME'] || row['name'] || 
                    row['Full Name'] || row['FULL NAME'] || row['Student_Name'] || '';
        
        const rollNumber = row['Roll Number'] || row['Roll No'] || row['ROLL NUMBER'] || row['roll_number'] || 
                          row['Registration Number'] || row['Reg No'] || row['REG NO'] || '';
        
        const section = row['Section'] || row['SECTION'] || row['section'] || row['Class'] || 
                       row['CLASS'] || row['class'] || '';
        
        const email = row['Email'] || row['EMAIL'] || row['email'] || row['Email ID'] || 
                     row['EMAIL ID'] || '';
        
        const phoneNumber = row['Phone'] || row['PHONE'] || row['phone'] || row['Mobile'] || 
                           row['MOBILE'] || row['mobile'] || row['Phone Number'] || row['Contact'] || '';
        
        if (name && rollNumber) {
          students.push({
            name: String(name).trim(),
            rollNumber: String(rollNumber).trim(),
            section: String(section || 'CSE1').trim(),
            email: email ? String(email).trim() : undefined,
            phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined
          });
        }
      } catch (error) {
        console.log(`Error processing row ${index}:`, error);
      }
    });
    
    console.log(`Processed ${students.length} students from Excel file`);
    
    // Create users in the database
    let created = 0;
    let skipped = 0;
    
    for (const student of students) {
      try {
        // Check if user already exists
        const existingUser = await storage.getUserByUsername(student.rollNumber.toLowerCase());
        if (existingUser) {
          console.log(`User ${student.name} (${student.rollNumber}) already exists, skipping`);
          skipped++;
          continue;
        }
        
        // Determine section and assign class teacher
        let section = student.section.toUpperCase();
        if (!section.startsWith('CSE')) {
          // If section doesn't start with CSE, assign based on roll number or distribute evenly
          const sectionNum = (created % 3) + 1;
          section = `CSE${sectionNum}`;
        }
        
        const newUser = await storage.createUser({
          username: student.rollNumber.toLowerCase(),
          email: student.email || `${student.rollNumber.toLowerCase()}@gvpcew.edu.in`,
          password: "$2a$10$8K1p/a0dLOZ0rE5R5pVpKOy8k7.8JQZ4sV5Hj9.pLm7.8TqU9vY8W", // Default: password
          fullName: student.name,
          role: "student",
          department: "Computer Science Engineering",
          studentId: student.rollNumber,
          year: 4,
          semester: 8,
          section: section,
          phoneNumber: student.phoneNumber || "+91-9876543200",
          address: "Student Address"
        });
        
        // Create initial leave balance for the student
        await storage.createLeaveBalance(newUser.id, new Date().getFullYear());
        
        console.log(`Created user: ${student.name} (${student.rollNumber}) - Section: ${section}`);
        created++;
        
      } catch (error) {
        console.error(`Error creating user ${student.name}:`, error);
      }
    }
    
    console.log(`\nImport Summary:`);
    console.log(`Total students processed: ${students.length}`);
    console.log(`Students created: ${created}`);
    console.log(`Students skipped (already exist): ${skipped}`);
    
    return { total: students.length, created, skipped };
    
  } catch (error) {
    console.error('Error importing student data:', error);
    throw error;
  }
}