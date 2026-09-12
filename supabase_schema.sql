-- =========================================================
-- School Tuition Management System (Class 1 to X)
-- Supabase PostgreSQL Database Schema with Real-Time
-- =========================================================

-- 1. Class Levels (Class 1 to 10 pre-configured, extensible for 11 & 12)
CREATE TABLE IF NOT EXISTS class_levels (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL, -- Primary (1-5), Middle (6-8), High (9-10)
    default_monthly_fee NUMERIC(10,2) DEFAULT 800.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial Class 1 to 10
INSERT INTO class_levels (code, display_name, category, default_monthly_fee) VALUES
('CLASS_1', 'Class 1', 'Primary', 500.00),
('CLASS_2', 'Class 2', 'Primary', 550.00),
('CLASS_3', 'Class 3', 'Primary', 600.00),
('CLASS_4', 'Class 4', 'Primary', 650.00),
('CLASS_5', 'Class 5', 'Primary', 700.00),
('CLASS_6', 'Class 6', 'Middle', 800.00),
('CLASS_7', 'Class 7', 'Middle', 850.00),
('CLASS_8', 'Class 8', 'Middle', 900.00),
('CLASS_9', 'Class 9', 'High School', 1100.00),
('CLASS_10', 'Class 10 (SSC/CBSE)', 'High School', 1200.00)
ON CONFLICT (code) DO NOTHING;

-- 2. Batches (Sections / Time slots per class)
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(20) REFERENCES class_levels(code) ON DELETE CASCADE,
    timing VARCHAR(50) NOT NULL, -- e.g. "5:00 PM - 6:30 PM"
    tutor_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    max_capacity INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Students
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    admission_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE,
    class_code VARCHAR(20) REFERENCES class_levels(code) ON DELETE RESTRICT,
    batch_id INT REFERENCES batches(id) ON DELETE SET NULL,
    school_name VARCHAR(150),
    parent_name VARCHAR(150) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(100),
    address TEXT,
    monthly_fee NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    admission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
    class_code VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(15) NOT NULL, -- PRESENT, ABSENT, LATE
    remarks TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 5. Monthly Fee Records
CREATE TABLE IF NOT EXISTS fee_records (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    month_year VARCHAR(20) NOT NULL, -- e.g. "March 2026"
    amount_due NUMERIC(10,2) NOT NULL,
    amount_paid NUMERIC(10,2) DEFAULT 0.00,
    balance NUMERIC(10,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, month_year)
);

-- 6. Payment Receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
    id SERIAL PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    fee_record_id INT REFERENCES fee_records(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(20) NOT NULL, -- CASH, UPI, PHONEPE, GPAY, BANK
    transaction_ref VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Exams & Tests (Weekly / Monthly)
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    class_code VARCHAR(20) REFERENCES class_levels(code) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    total_marks INT NOT NULL DEFAULT 50,
    passing_marks INT NOT NULL DEFAULT 18,
    exam_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Exam Marks
CREATE TABLE IF NOT EXISTS exam_marks (
    id SERIAL PRIMARY KEY,
    exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL,
    remarks VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- 7. Announcements / Broadcast Notifications (Sunday tuition, timing changes, holidays)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_type VARCHAR(50) DEFAULT 'ALL', -- ALL, BATCH, CLASS
    target_id VARCHAR(50),
    target_name VARCHAR(100),
    posted_by VARCHAR(100) DEFAULT 'Admin',
    announcement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Staff & Faculty Accounts (Teachers & Admin accounts, passwords, assigned batches & students)
CREATE TABLE IF NOT EXISTS staff_accounts (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    pin VARCHAR(20) DEFAULT '1234',
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL, -- ADMIN, TEACHER
    title VARCHAR(150),
    subject VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    assigned_batch_ids JSONB DEFAULT '[]'::jsonb,
    assigned_student_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- Enable Supabase Realtime Replication on Key Tables
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE fee_records;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE exams;
ALTER PUBLICATION supabase_realtime ADD TABLE exam_marks;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_accounts;

-- RLS (Row Level Security) - Permissive for tuition institute staff
ALTER TABLE class_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for class_levels" ON class_levels FOR ALL USING (true);
CREATE POLICY "Allow public read/write for batches" ON batches FOR ALL USING (true);
CREATE POLICY "Allow public read/write for students" ON students FOR ALL USING (true);
CREATE POLICY "Allow public read/write for attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow public read/write for fee_records" ON fee_records FOR ALL USING (true);
CREATE POLICY "Allow public read/write for payment_receipts" ON payment_receipts FOR ALL USING (true);
CREATE POLICY "Allow public read/write for exams" ON exams FOR ALL USING (true);
CREATE POLICY "Allow public read/write for exam_marks" ON exam_marks FOR ALL USING (true);
CREATE POLICY "Allow public read/write for announcements" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow public read/write for staff_accounts" ON staff_accounts FOR ALL USING (true);

