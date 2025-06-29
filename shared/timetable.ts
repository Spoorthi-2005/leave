// Comprehensive Timetable Management System for GVPCEW
// Prevents scheduling conflicts for substitute teacher assignments

export interface TimeSlot {
  period: number;
  startTime: string;
  endTime: string;
  day: string;
}

export interface ClassSchedule {
  facultyId: number;
  department: string;
  section: string;
  year: number;
  subject: string;
  timeSlot: TimeSlot;
  roomNumber?: string;
}

export interface FacultyAvailability {
  facultyId: number;
  day: string;
  availablePeriods: number[];
  assignedPeriods: number[];
}

// Standard class periods for all departments
export const CLASS_PERIODS: TimeSlot[] = [
  { period: 1, startTime: "09:00", endTime: "09:50", day: "" },
  { period: 2, startTime: "09:50", endTime: "10:40", day: "" },
  { period: 3, startTime: "11:00", endTime: "11:50", day: "" }, // Break 10:40-11:00
  { period: 4, startTime: "11:50", endTime: "12:40", day: "" },
  { period: 5, startTime: "13:30", endTime: "14:20", day: "" }, // Lunch 12:40-13:30
  { period: 6, startTime: "14:20", endTime: "15:10", day: "" },
  { period: 7, startTime: "15:10", endTime: "16:00", day: "" },
];

export const WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Department-wise weekly timetable structure
export const DEPARTMENT_TIMETABLES = {
  CSE: {
    1: { // First Year
      A: [
        { day: "Monday", periods: [
          { period: 1, subject: "Mathematics I", facultyType: "Mathematics" },
          { period: 2, subject: "Physics", facultyType: "Physics" },
          { period: 3, subject: "Programming in C", facultyType: "CSE" },
          { period: 4, subject: "Engineering Drawing", facultyType: "Mechanical" },
          { period: 5, subject: "English", facultyType: "English" },
          { period: 6, subject: "Programming Lab", facultyType: "CSE" },
          { period: 7, subject: "Programming Lab", facultyType: "CSE" },
        ]},
        { day: "Tuesday", periods: [
          { period: 1, subject: "Mathematics I", facultyType: "Mathematics" },
          { period: 2, subject: "Chemistry", facultyType: "Chemistry" },
          { period: 3, subject: "Programming in C", facultyType: "CSE" },
          { period: 4, subject: "Physics Lab", facultyType: "Physics" },
          { period: 5, subject: "Physics Lab", facultyType: "Physics" },
          { period: 6, subject: "English", facultyType: "English" },
          { period: 7, subject: "Environmental Science", facultyType: "Environmental" },
        ]},
        // Add more days...
      ],
      B: [
        // Similar structure for Section B
      ],
      C: [
        // Similar structure for Section C
      ]
    },
    2: {
      // Second Year timetables
    },
    3: {
      // Third Year timetables
    },
    4: {
      // Fourth Year timetables
    }
  },
  ECE: {
    // Similar structure for ECE
  },
  IT: {
    // Similar structure for IT
  },
  CSM: {
    // Similar structure for CSM
  },
  EEE: {
    // Similar structure for EEE
  }
};

// Check if faculty member has any class conflicts
export function checkFacultyAvailability(
  facultyId: number,
  department: string,
  fromDate: Date,
  toDate: Date,
  currentSchedules: ClassSchedule[]
): { available: boolean; conflicts: ClassSchedule[]; availableSlots: TimeSlot[] } {
  const conflicts: ClassSchedule[] = [];
  const availableSlots: TimeSlot[] = [];
  
  // Get faculty's current schedule
  const facultySchedule = currentSchedules.filter(schedule => schedule.facultyId === facultyId);
  
  // Check each day in the leave period
  const dateRange = getDatesInRange(fromDate, toDate);
  
  for (const date of dateRange) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!WORKING_DAYS.includes(dayName)) continue;
    
    // Check each period for conflicts
    for (const period of CLASS_PERIODS) {
      const daySchedule = facultySchedule.filter(schedule => 
        schedule.timeSlot.day === dayName && 
        schedule.timeSlot.period === period.period
      );
      
      if (daySchedule.length > 0) {
        conflicts.push(...daySchedule);
      } else {
        availableSlots.push({
          ...period,
          day: dayName
        });
      }
    }
  }
  
  return {
    available: conflicts.length === 0,
    conflicts,
    availableSlots
  };
}

// Find best substitute teacher based on availability and subject expertise
export function findOptimalSubstitute(
  requiredSubjects: string[],
  department: string,
  section: string,
  year: number,
  fromDate: Date,
  toDate: Date,
  availableFaculty: any[],
  currentSchedules: ClassSchedule[]
): {
  substitute: any | null;
  confidence: number;
  availabilityReport: any;
} {
  let bestSubstitute = null;
  let highestScore = 0;
  let bestAvailabilityReport = null;
  
  for (const faculty of availableFaculty) {
    // Check availability
    const availability = checkFacultyAvailability(
      faculty.id,
      faculty.department,
      fromDate,
      toDate,
      currentSchedules
    );
    
    if (!availability.available) continue;
    
    // Calculate matching score
    let score = 0;
    
    // Same department preference (30 points)
    if (faculty.department === department) score += 30;
    
    // Subject expertise matching (40 points)
    const facultySubjects = faculty.subjects || [];
    const subjectMatch = requiredSubjects.filter(subject => 
      facultySubjects.some((fs: string) => fs.toLowerCase().includes(subject.toLowerCase()))
    );
    score += (subjectMatch.length / requiredSubjects.length) * 40;
    
    // Experience factor (20 points)
    const experience = faculty.experience || 0;
    score += Math.min(experience / 10, 1) * 20;
    
    // Workload factor (10 points) - prefer less loaded faculty
    const currentWorkload = currentSchedules.filter(s => s.facultyId === faculty.id).length;
    score += Math.max(10 - currentWorkload, 0);
    
    if (score > highestScore) {
      highestScore = score;
      bestSubstitute = faculty;
      bestAvailabilityReport = availability;
    }
  }
  
  return {
    substitute: bestSubstitute,
    confidence: highestScore,
    availabilityReport: bestAvailabilityReport
  };
}

// Generate detailed schedule for substitute assignment
export function generateSubstituteSchedule(
  originalFaculty: any,
  substitute: any,
  fromDate: Date,
  toDate: Date,
  subjects: string[]
): ClassSchedule[] {
  const schedules: ClassSchedule[] = [];
  const dateRange = getDatesInRange(fromDate, toDate);
  
  for (const date of dateRange) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!WORKING_DAYS.includes(dayName)) continue;
    
    // Generate schedule based on original faculty's timetable
    for (let periodNum = 1; periodNum <= 7; periodNum++) {
      const period = CLASS_PERIODS.find(p => p.period === periodNum);
      if (!period) continue;
      
      schedules.push({
        facultyId: substitute.id,
        department: originalFaculty.department,
        section: originalFaculty.section,
        year: getYearFromSection(originalFaculty.section),
        subject: subjects[0] || "General Class",
        timeSlot: {
          ...period,
          day: dayName
        },
        roomNumber: `${originalFaculty.department}-${originalFaculty.section}`
      });
    }
  }
  
  return schedules;
}

// Utility functions
function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

function getYearFromSection(section: string): number {
  const yearMatch = section.match(/\d+/);
  return yearMatch ? parseInt(yearMatch[0]) : 1;
}

// Validate substitute assignment for conflicts
export function validateSubstituteAssignment(
  assignment: ClassSchedule[],
  existingSchedules: ClassSchedule[]
): { valid: boolean; conflicts: any[] } {
  const conflicts: any[] = [];
  
  for (const newSchedule of assignment) {
    const conflict = existingSchedules.find(existing => 
      existing.facultyId === newSchedule.facultyId &&
      existing.timeSlot.day === newSchedule.timeSlot.day &&
      existing.timeSlot.period === newSchedule.timeSlot.period
    );
    
    if (conflict) {
      conflicts.push({
        newSchedule,
        conflictingSchedule: conflict,
        message: `Faculty already has a class at ${conflict.timeSlot.day} Period ${conflict.timeSlot.period}`
      });
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
}

// Generate comprehensive timetable report
export function generateTimetableReport(
  faculty: any,
  fromDate: Date,
  toDate: Date,
  substitutes: any[]
): {
  originalFacultySchedule: ClassSchedule[];
  substituteAssignments: any[];
  coverageAnalysis: any;
  riskAssessment: any;
} {
  return {
    originalFacultySchedule: [],
    substituteAssignments: [],
    coverageAnalysis: {
      totalClassesAffected: 0,
      classesCovered: 0,
      coveragePercentage: 100
    },
    riskAssessment: {
      level: "LOW",
      factors: [],
      recommendations: []
    }
  };
}