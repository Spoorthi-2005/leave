// Subject definitions for each department and year
export const DEPARTMENT_SUBJECTS = {
  CSE: {
    1: ["Programming in C", "Mathematics-I", "Engineering Physics", "Engineering Chemistry", "Engineering Drawing", "English Communication"],
    2: ["Data Structures", "Mathematics-II", "Digital Logic Design", "Object Oriented Programming", "Database Management Systems", "Computer Organization"],
    3: ["Computer Networks", "Operating Systems", "Software Engineering", "Compiler Design", "Web Technologies", "Machine Learning"],
    4: ["Distributed Systems", "Cyber Security", "Project Work", "Mobile Application Development", "Cloud Computing", "Internship"]
  },
  ECE: {
    1: ["Basic Electronics", "Mathematics-I", "Engineering Physics", "Engineering Chemistry", "Engineering Drawing", "English Communication"],
    2: ["Electronic Circuits", "Mathematics-II", "Signals and Systems", "Digital Electronics", "Network Analysis", "Electromagnetic Theory"],
    3: ["Communication Systems", "Microprocessors", "Control Systems", "VLSI Design", "Digital Signal Processing", "Antenna Theory"],
    4: ["Embedded Systems", "Optical Communication", "Project Work", "Wireless Communication", "Satellite Communication", "Internship"]
  },
  IT: {
    1: ["Programming Fundamentals", "Mathematics-I", "Engineering Physics", "Engineering Chemistry", "Engineering Drawing", "English Communication"],
    2: ["Data Structures", "Mathematics-II", "Computer Networks", "Database Systems", "Web Development", "System Analysis"],
    3: ["Software Engineering", "Information Security", "Mobile Computing", "Cloud Technologies", "AI and ML", "Enterprise Systems"],
    4: ["Distributed Computing", "Project Management", "Project Work", "Advanced Databases", "DevOps", "Internship"]
  },
  CSM: {
    1: ["Mathematical Foundations", "Statistics", "Programming Basics", "Physics", "Chemistry", "English Communication"],
    2: ["Advanced Mathematics", "Probability Theory", "Data Structures", "Linear Algebra", "Discrete Mathematics", "Computer Programming"],
    3: ["Mathematical Modeling", "Optimization Techniques", "Numerical Methods", "Statistical Computing", "Applied Mathematics", "Research Methods"],
    4: ["Advanced Statistics", "Mathematical Software", "Project Work", "Industrial Mathematics", "Computational Mathematics", "Internship"]
  },
  EEE: {
    1: ["Electrical Circuits", "Mathematics-I", "Engineering Physics", "Engineering Chemistry", "Engineering Drawing", "English Communication"],
    2: ["Network Theory", "Mathematics-II", "Electronic Devices", "Electrical Machines", "Power Systems", "Control Engineering"],
    3: ["Power Electronics", "Electrical Drives", "Protection Systems", "Renewable Energy", "Industrial Automation", "Power Quality"],
    4: ["Smart Grids", "High Voltage Engineering", "Project Work", "Energy Management", "Electrical Design", "Internship"]
  }
};

export const COMMON_SUBJECTS = [
  "Mathematics-I", "Mathematics-II", "Engineering Physics", "Engineering Chemistry", 
  "Engineering Drawing", "English Communication", "Environmental Science", "Constitution of India"
];

export function getSubjectsForDepartmentYear(department: string, year: number): string[] {
  return DEPARTMENT_SUBJECTS[department as keyof typeof DEPARTMENT_SUBJECTS]?.[year] || [];
}

export function findQualifiedSubstitutes(requiredSubjects: string[], availableFaculty: any[]): any[] {
  return availableFaculty.filter(faculty => {
    if (!faculty.subjects || !Array.isArray(faculty.subjects)) return false;
    
    // Check if faculty can teach at least one of the required subjects
    return requiredSubjects.some(subject => 
      faculty.subjects.includes(subject) || 
      COMMON_SUBJECTS.includes(subject) && faculty.subjects.some((s: string) => COMMON_SUBJECTS.includes(s))
    );
  }).sort((a, b) => {
    // Sort by experience and number of matching subjects
    const aMatches = requiredSubjects.filter(subject => a.subjects.includes(subject)).length;
    const bMatches = requiredSubjects.filter(subject => b.subjects.includes(subject)).length;
    
    if (aMatches !== bMatches) return bMatches - aMatches;
    return (b.experience || 0) - (a.experience || 0);
  });
}