import { storage } from "../storage";
import { whatsappService } from "./whatsapp";
import { emailService } from "./email";
import { getSubjectsForDepartmentYear, findQualifiedSubstitutes } from "../../shared/subjects";
import type { User, LeaveApplication } from "@shared/schema";

interface SubstituteAssignmentData {
  facultyOnLeave: User;
  leaveApplication: LeaveApplication;
  fromDate: Date;
  toDate: Date;
  subjects: string[];
}

export class SubstituteAssignmentService {
  
  async assignSubstitutes(assignmentData: SubstituteAssignmentData): Promise<void> {
    const { facultyOnLeave, leaveApplication, fromDate, toDate, subjects } = assignmentData;
    
    try {
      // Get available faculty from the same department
      const departmentFaculty = await storage.getUsersByRole('faculty');
      const availableFaculty = departmentFaculty.filter(faculty => 
        faculty.department === facultyOnLeave.department &&
        faculty.id !== facultyOnLeave.id &&
        faculty.isActive
      );

      // Find qualified substitutes
      const qualifiedSubstitutes = findQualifiedSubstitutes(subjects, availableFaculty);
      
      if (qualifiedSubstitutes.length === 0) {
        await this.handleNoSubstituteAvailable(facultyOnLeave, leaveApplication);
        return;
      }

      // Assign the best qualified substitute
      const selectedSubstitute = qualifiedSubstitutes[0];
      
      // Create substitute assignment record
      const assignment = await storage.createSubstituteAssignment({
        leaveApplicationId: leaveApplication.id,
        originalFacultyId: facultyOnLeave.id,
        substituteFacultyId: selectedSubstitute.id,
        fromDate,
        toDate,
        subjects: JSON.stringify(subjects),
        status: 'assigned',
        notes: `Auto-assigned based on subject expertise and availability`
      });

      // Send notifications
      await this.sendSubstituteNotifications(facultyOnLeave, selectedSubstitute, assignment, subjects, fromDate, toDate);
      
      // Notify HOD and students
      await this.notifyStakeholders(facultyOnLeave, selectedSubstitute, subjects, fromDate, toDate);

    } catch (error) {
      console.error('Error in substitute assignment:', error);
      await this.handleAssignmentError(facultyOnLeave, leaveApplication, error);
    }
  }

  private async sendSubstituteNotifications(
    originalFaculty: User,
    substituteFaculty: User,
    assignment: any,
    subjects: string[],
    fromDate: Date,
    toDate: Date
  ): Promise<void> {
    
    // Email to substitute faculty
    const substituteEmailContent = this.generateSubstituteEmailContent(
      originalFaculty, substituteFaculty, subjects, fromDate, toDate
    );
    
    await emailService.sendEmail(
      substituteFaculty.email,
      `🎯 Substitute Teaching Assignment - ${originalFaculty.department}`,
      substituteEmailContent
    );

    // WhatsApp to substitute faculty
    if (substituteFaculty.phoneNumber) {
      const whatsappMessage = this.generateSubstituteWhatsAppMessage(
        originalFaculty, substituteFaculty, subjects, fromDate, toDate
      );
      
      await whatsappService.sendMessage(substituteFaculty.phoneNumber, whatsappMessage);
    }

    // Create in-app notification
    await storage.createNotification(substituteFaculty.id, {
      title: "New Substitute Teaching Assignment",
      message: `You have been assigned as substitute for ${originalFaculty.fullName} from ${fromDate.toDateString()} to ${toDate.toDateString()}`,
      type: "substitute_assignment",
      data: JSON.stringify({
        assignmentId: assignment.id,
        originalFacultyId: originalFaculty.id,
        subjects,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      })
    });
  }

  private async notifyStakeholders(
    originalFaculty: User,
    substituteFaculty: User,
    subjects: string[],
    fromDate: Date,
    toDate: Date
  ): Promise<void> {
    
    // Notify HOD
    if (originalFaculty.hodId) {
      const hod = await storage.getUser(originalFaculty.hodId);
      if (hod) {
        const hodMessage = `
📋 *GVPCEW Substitute Assignment*

*Original Faculty:* ${originalFaculty.fullName}
*Substitute:* ${substituteFaculty.fullName}
*Department:* ${originalFaculty.department}
*Period:* ${fromDate.toDateString()} to ${toDate.toDateString()}
*Subjects:* ${subjects.join(', ')}

The substitute assignment has been automatically processed.

*GVPCEW Administration*
        `.trim();

        if (hod.phoneNumber) {
          await whatsappService.sendMessage(hod.phoneNumber, hodMessage);
        }

        await storage.createNotification(hod.id, {
          title: "Substitute Assignment Notification",
          message: `${substituteFaculty.fullName} assigned as substitute for ${originalFaculty.fullName}`,
          type: "hod_notification",
          data: JSON.stringify({
            originalFacultyId: originalFaculty.id,
            substituteFacultyId: substituteFaculty.id,
            subjects,
            fromDate: fromDate.toISOString(),
            toDate: toDate.toISOString()
          })
        });
      }
    }

    // Notify affected students (section-wise)
    if (originalFaculty.section) {
      await this.notifyStudents(originalFaculty, substituteFaculty, subjects, fromDate, toDate);
    }
  }

  private async notifyStudents(
    originalFaculty: User,
    substituteFaculty: User,
    subjects: string[],
    fromDate: Date,
    toDate: Date
  ): Promise<void> {
    
    // Get students from the faculty's section
    const allStudents = await storage.getUsersByRole('student');
    const sectionStudents = allStudents.filter(student => 
      student.section === originalFaculty.section && student.isActive
    );

    const studentMessage = `
📚 *GVPCEW Class Update*

Dear Students,

*Class Teacher Change Notification:*
Your regular faculty ${originalFaculty.fullName} will be on leave from ${fromDate.toDateString()} to ${toDate.toDateString()}.

*Substitute Faculty:* ${substituteFaculty.fullName}
*Subjects:* ${subjects.join(', ')}

Please attend classes as scheduled. For any queries, contact the substitute faculty or department office.

*${originalFaculty.department} Department*
*GVPCEW*
    `.trim();

    // Send to class representatives (first 3 students as sample)
    const classReps = sectionStudents.slice(0, 3);
    
    for (const student of classReps) {
      if (student.phoneNumber) {
        await whatsappService.sendMessage(student.phoneNumber, studentMessage);
      }
      
      await storage.createNotification(student.id, {
        title: "Substitute Faculty Assignment",
        message: `${substituteFaculty.fullName} will substitute for ${originalFaculty.fullName}`,
        type: "student_notification",
        data: JSON.stringify({
          originalFacultyId: originalFaculty.id,
          substituteFacultyId: substituteFaculty.id,
          subjects,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString()
        })
      });
    }
  }

  private async handleNoSubstituteAvailable(
    facultyOnLeave: User,
    leaveApplication: LeaveApplication
  ): Promise<void> {
    
    // Notify HOD about unavailable substitute
    if (facultyOnLeave.hodId) {
      const hod = await storage.getUser(facultyOnLeave.hodId);
      if (hod) {
        const alertMessage = `
⚠️ *URGENT: No Substitute Available*

*Faculty:* ${facultyOnLeave.fullName}
*Department:* ${facultyOnLeave.department}
*Leave Period:* ${new Date(leaveApplication.fromDate).toDateString()} to ${new Date(leaveApplication.toDate).toDateString()}

No qualified substitute faculty available. Please arrange manual assignment.

*GVPCEW Administration*
        `.trim();

        if (hod.phoneNumber) {
          await whatsappService.sendMessage(hod.phoneNumber, alertMessage);
        }

        await storage.createNotification(hod.id, {
          title: "Critical: No Substitute Available",
          message: `No substitute found for ${facultyOnLeave.fullName}. Manual intervention required.`,
          type: "critical_alert",
          data: JSON.stringify({
            facultyId: facultyOnLeave.id,
            leaveApplicationId: leaveApplication.id
          })
        });
      }
    }
  }

  private async handleAssignmentError(
    facultyOnLeave: User,
    leaveApplication: LeaveApplication,
    error: any
  ): Promise<void> {
    
    console.error('Substitute assignment failed:', error);
    
    // Create error notification for admin
    const adminUsers = await storage.getUsersByRole('admin');
    const admin = adminUsers[0];
    
    if (admin) {
      await storage.createNotification(admin.id, {
        title: "Substitute Assignment Failed",
        message: `Failed to assign substitute for ${facultyOnLeave.fullName}. Error: ${error.message}`,
        type: "system_error",
        data: JSON.stringify({
          facultyId: facultyOnLeave.id,
          leaveApplicationId: leaveApplication.id,
          error: error.message
        })
      });
    }
  }

  private generateSubstituteEmailContent(
    originalFaculty: User,
    substituteFaculty: User,
    subjects: string[],
    fromDate: Date,
    toDate: Date
  ): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🎯 Substitute Teaching Assignment</h1>
        <p style="margin: 10px 0 0 0;">Gayatri Vidya Parishad College of Engineering for Women</p>
      </div>
      
      <div style="padding: 20px; background: white;">
        <h2 style="color: #333;">Hello ${substituteFaculty.fullName},</h2>
        
        <p>You have been assigned as a substitute teacher for the following:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #495057; margin-top: 0;">Assignment Details</h3>
          <p><strong>Original Faculty:</strong> ${originalFaculty.fullName}</p>
          <p><strong>Department:</strong> ${originalFaculty.department}</p>
          <p><strong>Section:</strong> ${originalFaculty.section}</p>
          <p><strong>Period:</strong> ${fromDate.toDateString()} to ${toDate.toDateString()}</p>
          <p><strong>Subjects:</strong> ${subjects.join(', ')}</p>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">📝 Instructions</h3>
          <ul style="color: #333;">
            <li>Please coordinate with the original faculty for lesson plans and materials</li>
            <li>Maintain the regular class schedule and attendance</li>
            <li>Report any issues to the HOD immediately</li>
            <li>Access the faculty portal for additional resources</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          For any queries, please contact the department office or HOD.
        </p>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated notification from GVPCEW Leave Management System</p>
        </div>
      </div>
    </div>`;
  }

  private generateSubstituteWhatsAppMessage(
    originalFaculty: User,
    substituteFaculty: User,
    subjects: string[],
    fromDate: Date,
    toDate: Date
  ): string {
    return `
🎯 *GVPCEW Substitute Assignment*

Hello ${substituteFaculty.fullName},

You have been assigned as substitute teacher:

👤 *For:* ${originalFaculty.fullName}
🏢 *Department:* ${originalFaculty.department}
📚 *Section:* ${originalFaculty.section}
📅 *Period:* ${fromDate.toDateString()} to ${toDate.toDateString()}
📖 *Subjects:* ${subjects.join(', ')}

📝 *Next Steps:*
• Coordinate with original faculty
• Check class schedules
• Access faculty portal
• Contact HOD for any queries

Thank you for your cooperation!

---
*GVPCEW Administration*
    `.trim();
  }

  // Method to handle substitute assignment when leave is approved
  async processLeaveApproval(leaveApplication: LeaveApplication): Promise<void> {
    const faculty = await storage.getUser(leaveApplication.userId);
    
    if (!faculty || faculty.role !== 'faculty') {
      return; // Only process for faculty leaves
    }

    // Get subjects for the faculty's department and year
    const subjects = getSubjectsForDepartmentYear(
      faculty.department?.replace(/\s.*/, '') || '', // Extract department code
      faculty.year || 1
    );

    // If no specific subjects, use faculty's assigned subjects or default
    const facultySubjects = faculty.subjects || subjects || ['General Subjects'];

    await this.assignSubstitutes({
      facultyOnLeave: faculty,
      leaveApplication,
      fromDate: new Date(leaveApplication.fromDate),
      toDate: new Date(leaveApplication.toDate),
      subjects: facultySubjects
    });
  }
}

export const substituteAssignmentService = new SubstituteAssignmentService();