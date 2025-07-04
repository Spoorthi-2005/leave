import { storage } from './simple-storage';

export async function testLeaveWorkflow() {
  console.log('\n🧪 Testing Complete Leave Management Workflow');
  console.log('════════════════════════════════════════════════');

  try {
    // Test student (should already exist from demo data)
    const student = await storage.getUserByUsername('teststudent');
    if (!student) {
      console.log('❌ Test student not found');
      return;
    }

    console.log(`👤 Testing with student: ${student.fullName}`);

    // Check initial leave balance
    let balance = await storage.getUserLeaveBalance(student.id, 2025);
    if (!balance) {
      balance = await storage.createLeaveBalance(student.id, 2025);
    }
    
    console.log(`📊 Initial Balance - Total: ${balance.total}, Used: ${balance.used}, Pending: ${balance.pending}, Available: ${balance.available}`);

    // Step 1: Submit leave application
    console.log('\n📝 Step 1: Submitting leave application');
    const application = await storage.createLeaveApplication({
      userId: student.id,
      type: 'sick',
      startDate: new Date('2025-07-10'),
      endDate: new Date('2025-07-12'),
      reason: 'Testing leave workflow - 3 days',
      status: 'pending'
    });

    console.log(`✅ Application created: ID ${application.id}`);
    
    // Check balance after submission
    balance = await storage.getUserLeaveBalance(student.id, 2025);
    console.log(`📊 After Submission - Total: ${balance!.total}, Used: ${balance!.used}, Pending: ${balance!.pending}, Available: ${balance!.available}`);

    // Step 2: Get user's applications (should show in history)
    const userApplications = await storage.getUserLeaveApplications(student.id);
    console.log(`📋 User has ${userApplications.length} applications in history`);

    // Step 3: Approve the application
    console.log('\n✅ Step 2: Approving leave application');
    const teacher = await storage.getUserByUsername('faculty1');
    if (teacher) {
      await storage.updateLeaveApplication(application.id, 'approved', teacher.id, 'Approved for testing workflow');
      
      // Check balance after approval
      balance = await storage.getUserLeaveBalance(student.id, 2025);
      console.log(`📊 After Approval - Total: ${balance!.total}, Used: ${balance!.used}, Pending: ${balance!.pending}, Available: ${balance!.available}`);
    }

    // Step 4: Check applications are still in history
    const userApplicationsAfterApproval = await storage.getUserLeaveApplications(student.id);
    console.log(`📋 After approval, user still has ${userApplicationsAfterApproval.length} applications in history`);
    console.log(`📋 Application status: ${userApplicationsAfterApproval[userApplicationsAfterApproval.length - 1].status}`);

    // Step 5: Test rejection workflow
    console.log('\n❌ Step 3: Testing rejection workflow');
    const rejectionApp = await storage.createLeaveApplication({
      userId: student.id,
      type: 'personal',
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-07-16'),
      reason: 'Testing rejection workflow - 2 days',
      status: 'pending'
    });

    // Check balance after second submission
    balance = await storage.getUserLeaveBalance(student.id, 2025);
    console.log(`📊 After 2nd Submission - Total: ${balance!.total}, Used: ${balance!.used}, Pending: ${balance!.pending}, Available: ${balance!.available}`);

    // Reject the application
    if (teacher) {
      await storage.updateLeaveApplication(rejectionApp.id, 'rejected', teacher.id, 'Rejected for testing workflow');
      
      // Check balance after rejection
      balance = await storage.getUserLeaveBalance(student.id, 2025);
      console.log(`📊 After Rejection - Total: ${balance!.total}, Used: ${balance!.used}, Pending: ${balance!.pending}, Available: ${balance!.available}`);
    }

    // Final check: All applications in history
    const finalApplications = await storage.getUserLeaveApplications(student.id);
    console.log(`📋 Final check: User has ${finalApplications.length} applications in history`);
    finalApplications.forEach(app => {
      console.log(`   - Application ${app.id}: ${app.type} leave (${app.status})`);
    });

    console.log('\n✅ Leave workflow test completed successfully!');
    console.log('════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Leave workflow test failed:', error);
  }
}