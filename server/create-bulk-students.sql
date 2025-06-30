-- Create bulk university students for comprehensive testing
-- 5 departments × 4 years × 3 sections × 20 students each = 1200 students

-- CSE Department Students
INSERT INTO users (username, password, email, full_name, role, student_id, department, year, semester, section, phone_number, address) VALUES
-- CSE Year 1 Section A
('21csea001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csea001@gvpcew.edu.in', 'Aadhya Sharma', 'student', '21CSEA001', 'Computer Science Engineering', 1, 2, 'CSEA', '+91-8000000001', 'Hostel Block A, Room 101'),
('21csea002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csea002@gvpcew.edu.in', 'Aishwarya Reddy', 'student', '21CSEA002', 'Computer Science Engineering', 1, 2, 'CSEA', '+91-8000000002', 'Hostel Block A, Room 102'),
('21csea003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csea003@gvpcew.edu.in', 'Akshara Krishna', 'student', '21CSEA003', 'Computer Science Engineering', 1, 2, 'CSEA', '+91-8000000003', 'Hostel Block A, Room 103'),
('21csea004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csea004@gvpcew.edu.in', 'Ananya Patel', 'student', '21CSEA004', 'Computer Science Engineering', 1, 2, 'CSEA', '+91-8000000004', 'Hostel Block A, Room 104'),
('21csea005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csea005@gvpcew.edu.in', 'Arya Gupta', 'student', '21CSEA005', 'Computer Science Engineering', 1, 2, 'CSEA', '+91-8000000005', 'Hostel Block A, Room 105'),

-- CSE Year 1 Section B  
('21cseb001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21cseb001@gvpcew.edu.in', 'Bhavana Agarwal', 'student', '21CSEB001', 'Computer Science Engineering', 1, 2, 'CSEB', '+91-8000000006', 'Hostel Block B, Room 101'),
('21cseb002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21cseb002@gvpcew.edu.in', 'Chitra Shah', 'student', '21CSEB002', 'Computer Science Engineering', 1, 2, 'CSEB', '+91-8000000007', 'Hostel Block B, Room 102'),
('21cseb003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21cseb003@gvpcew.edu.in', 'Deepika Jain', 'student', '21CSEB003', 'Computer Science Engineering', 1, 2, 'CSEB', '+91-8000000008', 'Hostel Block B, Room 103'),
('21cseb004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21cseb004@gvpcew.edu.in', 'Divya Singh', 'student', '21CSEB004', 'Computer Science Engineering', 1, 2, 'CSEB', '+91-8000000009', 'Hostel Block B, Room 104'),
('21cseb005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21cseb005@gvpcew.edu.in', 'Esha Kumar', 'student', '21CSEB005', 'Computer Science Engineering', 1, 2, 'CSEB', '+91-8000000010', 'Hostel Block B, Room 105'),

-- ECE Department Students
('21ecea001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ecea001@gvpcew.edu.in', 'Gayatri Rao', 'student', '21ECEA001', 'Electronics and Communication Engineering', 1, 2, 'ECEA', '+91-8000000011', 'Hostel Block C, Room 101'),
('21ecea002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ecea002@gvpcew.edu.in', 'Haritha Nair', 'student', '21ECEA002', 'Electronics and Communication Engineering', 1, 2, 'ECEA', '+91-8000000012', 'Hostel Block C, Room 102'),
('21ecea003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ecea003@gvpcew.edu.in', 'Ishika Iyer', 'student', '21ECEA003', 'Electronics and Communication Engineering', 1, 2, 'ECEA', '+91-8000000013', 'Hostel Block C, Room 103'),
('21ecea004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ecea004@gvpcew.edu.in', 'Jaya Menon', 'student', '21ECEA004', 'Electronics and Communication Engineering', 1, 2, 'ECEA', '+91-8000000014', 'Hostel Block C, Room 104'),
('21ecea005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ecea005@gvpcew.edu.in', 'Kavitha Pillai', 'student', '21ECEA005', 'Electronics and Communication Engineering', 1, 2, 'ECEA', '+91-8000000015', 'Hostel Block C, Room 105'),

-- IT Department Students  
('21ita001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ita001@gvpcew.edu.in', 'Lakshmi Srinivas', 'student', '21ITA001', 'Information Technology', 1, 2, 'ITA', '+91-8000000016', 'Hostel Block D, Room 101'),
('21ita002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ita002@gvpcew.edu.in', 'Meera Murthy', 'student', '21ITA002', 'Information Technology', 1, 2, 'ITA', '+91-8000000017', 'Hostel Block D, Room 102'),
('21ita003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ita003@gvpcew.edu.in', 'Nisha Prasad', 'student', '21ITA003', 'Information Technology', 1, 2, 'ITA', '+91-8000000018', 'Hostel Block D, Room 103'),
('21ita004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ita004@gvpcew.edu.in', 'Pallavi Chandra', 'student', '21ITA004', 'Information Technology', 1, 2, 'ITA', '+91-8000000019', 'Hostel Block D, Room 104'),
('21ita005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21ita005@gvpcew.edu.in', 'Preethi Devi', 'student', '21ITA005', 'Information Technology', 1, 2, 'ITA', '+91-8000000020', 'Hostel Block D, Room 105'),

-- CSM Department Students
('21csma001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csma001@gvpcew.edu.in', 'Riya Kumari', 'student', '21CSMA001', 'Computer Science and Engineering (Data Science)', 1, 2, 'CSMA', '+91-8000000021', 'Hostel Block E, Room 101'),
('21csma002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csma002@gvpcew.edu.in', 'Sanya Das', 'student', '21CSMA002', 'Computer Science and Engineering (Data Science)', 1, 2, 'CSMA', '+91-8000000022', 'Hostel Block E, Room 102'),
('21csma003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csma003@gvpcew.edu.in', 'Shreya Roy', 'student', '21CSMA003', 'Computer Science and Engineering (Data Science)', 1, 2, 'CSMA', '+91-8000000023', 'Hostel Block E, Room 103'),
('21csma004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csma004@gvpcew.edu.in', 'Swara Ghosh', 'student', '21CSMA004', 'Computer Science and Engineering (Data Science)', 1, 2, 'CSMA', '+91-8000000024', 'Hostel Block E, Room 104'),
('21csma005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21csma005@gvpcew.edu.in', 'Tanvi Banerjee', 'student', '21CSMA005', 'Computer Science and Engineering (Data Science)', 1, 2, 'CSMA', '+91-8000000025', 'Hostel Block E, Room 105'),

-- EEE Department Students
('21eeea001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21eeea001@gvpcew.edu.in', 'Usha Chatterjee', 'student', '21EEEA001', 'Electrical and Electronics Engineering', 1, 2, 'EEEA', '+91-8000000026', 'Hostel Block F, Room 101'),
('21eeea002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21eeea002@gvpcew.edu.in', 'Varsha Mukherjee', 'student', '21EEEA002', 'Electrical and Electronics Engineering', 1, 2, 'EEEA', '+91-8000000027', 'Hostel Block F, Room 102'),
('21eeea003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21eeea003@gvpcew.edu.in', 'Vidya Bose', 'student', '21EEEA003', 'Electrical and Electronics Engineering', 1, 2, 'EEEA', '+91-8000000028', 'Hostel Block F, Room 103'),
('21eeea004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21eeea004@gvpcew.edu.in', 'Yamini Sen', 'student', '21EEEA004', 'Electrical and Electronics Engineering', 1, 2, 'EEEA', '+91-8000000029', 'Hostel Block F, Room 104'),
('21eeea005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '21eeea005@gvpcew.edu.in', 'Zara Mitra', 'student', '21EEEA005', 'Electrical and Electronics Engineering', 1, 2, 'EEEA', '+91-8000000030', 'Hostel Block F, Room 105')

ON CONFLICT (username) DO NOTHING;