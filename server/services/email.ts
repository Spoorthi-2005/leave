import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@gvpcew.edu',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'default_pass'
      }
    };

    this.transporter = nodemailer.createTransporter(config);
  }

  async sendLeaveApplicationNotification(
    to: string,
    applicantName: string,
    leaveType: string,
    fromDate: string,
    toDate: string
  ) {
    const subject = `New Leave Application - ${applicantName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">GVPCEW Leave Management System</h2>
        <h3>New Leave Application Received</h3>
        <p>A new leave application has been submitted and requires your review:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Applicant:</strong> ${applicantName}</p>
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Duration:</strong> ${fromDate} to ${toDate}</p>
        </div>
        
        <p>Please log in to the Leave Management System to review and process this application.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated message from GVPCEW Leave Management System.</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"GVPCEW LMS" <${process.env.SMTP_USER || 'noreply@gvpcew.edu'}>`,
      to,
      subject,
      html
    });
  }

  async sendLeaveStatusNotification(
    to: string,
    applicantName: string,
    leaveType: string,
    status: string,
    reviewerName: string,
    comments?: string
  ) {
    const statusColor = status === 'approved' ? '#059669' : '#DC2626';
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    
    const subject = `Leave Application ${statusText} - ${leaveType}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">GVPCEW Leave Management System</h2>
        <h3 style="color: ${statusColor};">Leave Application ${statusText}</h3>
        
        <p>Dear ${applicantName},</p>
        <p>Your leave application has been <strong style="color: ${statusColor};">${status}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
          <p><strong>Reviewed by:</strong> ${reviewerName}</p>
          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        </div>
        
        <p>You can view the complete details by logging into the Leave Management System.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated message from GVPCEW Leave Management System.</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"GVPCEW LMS" <${process.env.SMTP_USER || 'noreply@gvpcew.edu'}>`,
      to,
      subject,
      html
    });
  }

  async sendWelcomeEmail(to: string, name: string, role: string, username: string) {
    const subject = 'Welcome to GVPCEW Leave Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Welcome to GVPCEW Leave Management System</h2>
        
        <p>Dear ${name},</p>
        <p>Your account has been successfully created in the GVPCEW Leave Management System.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>
        
        <p>You can now log in to the system to:</p>
        <ul>
          ${role === 'student' ? '<li>Apply for leave</li><li>Track your leave applications</li><li>View leave balance</li>' : ''}
          ${role === 'faculty' ? '<li>Review student leave applications</li><li>Manage substitute assignments</li><li>Apply for your own leave</li>' : ''}
          ${role === 'admin' ? '<li>Manage users and system settings</li><li>Generate reports</li><li>Configure leave policies</li>' : ''}
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated message from GVPCEW Leave Management System.</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"GVPCEW LMS" <${process.env.SMTP_USER || 'noreply@gvpcew.edu'}>`,
      to,
      subject,
      html
    });
  }
}

export const emailService = new EmailService();
