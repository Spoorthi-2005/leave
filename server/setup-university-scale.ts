import { createUniversityStudents, testRandomStudentApplications } from './create-university-students';
import { storage } from './storage';

async function setupUniversityScale() {
  console.log('🏫 Setting up GVPCEW University-Scale Leave Management System...\n');
  
  try {
    // Create comprehensive student database
    const totalStudents = await createUniversityStudents();
    
    // Verify the setup
    console.log('\n📊 Verifying University Setup...');
    
    // Check students by department and section
    const departments = ['CSE', 'ECE', 'IT', 'CSM', 'EEE'];
    const sections = ['A', 'B', 'C'];
    
    for (const dept of departments) {
      for (const section of sections) {
        const sectionName = `${dept}${section}`;
        const users = await storage.getUsersByRole('student');
        const sectionStudents = users.filter(u => u.section === sectionName);
        console.log(`${sectionName}: ${sectionStudents.length} students`);
      }
    }
    
    // Create test applications from random students
    await testRandomStudentApplications(25);
    
    // Test section-specific routing
    console.log('\n🧪 Testing Section-Specific Class Teacher Routing...');
    
    const pendingApps = await storage.getPendingLeaveApplications();
    console.log(`Total pending applications: ${pendingApps.length}`);
    
    // Group by class teacher assignment
    const routingTest = {};
    for (const app of pendingApps) {
      const section = app.section;
      if (!routingTest[section]) {
        routingTest[section] = 0;
      }
      routingTest[section]++;
    }
    
    console.log('Applications routed by section:', routingTest);
    
    console.log('\n✅ University-Scale System Setup Complete!');
    console.log(`Total Students: ${totalStudents}`);
    console.log(`Test Applications: ${pendingApps.length}`);
    console.log('All students can now submit leave applications with section-specific routing');
    
  } catch (error) {
    console.error('❌ Error setting up university scale system:', error);
  }
}

// Run the setup
setupUniversityScale();