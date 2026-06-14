-- Standard Online Examination Platform Database Schema (PostgreSQL/MySQL)

-- 1. USERS TABLE (Students and Instructors)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student', -- 'student' or 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. EXAMS TABLE (Exam Rules and Windows)
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    passing_score_percentage DECIMAL(5,2) DEFAULT 50.00,
    start_window TIMESTAMP NOT NULL, -- When the exam becomes available
    end_window TIMESTAMP NOT NULL,   -- When the exam closes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. QUESTIONS TABLE (The Question Bank)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'MCQ', -- 'MCQ', 'ESSAY', 'FILL_BLANK'
    options JSONB, -- Stores A, B, C, D options for MCQs
    correct_answer TEXT NOT NULL,
    points INT DEFAULT 1
);

-- 4. EXAM ATTEMPTS TABLE (The most critical table for security)
-- Tracks when a student starts, ensuring they can't exceed the duration
CREATE TABLE exam_attempts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'ABANDONED'
    score INT,
    ip_address VARCHAR(45),
    cheat_warnings INT DEFAULT 0,
    UNIQUE(user_id, exam_id) -- Prevents taking the same exam twice (unless allowed)
);

-- 5. STUDENT ANSWERS TABLE (Heartbeat & Final Submissions)
CREATE TABLE student_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INT REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    provided_answer TEXT,
    is_correct BOOLEAN,
    points_awarded INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);