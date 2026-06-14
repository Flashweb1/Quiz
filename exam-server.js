/**
 * Standard Online Examination Platform - Backend API
 * Stack: Node.js, Express
 * Run with: npm init -y && npm install express cors body-parser
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Database (In production, replace with PostgreSQL/Sequelize queries)
const db = {
    exams: {
        1: { id: 1, title: "Final Semester Examination", durationMinutes: 60 }
    },
    attempts: {} // Stores active attempts
};

// 1. START EXAM ENDPOINT
app.post('/api/exam/start', (req, res) => {
    const { userId, examId } = req.body;
    const exam = db.exams[examId];

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // Check if attempt already exists
    const attemptKey = `${userId}_${examId}`;
    if (db.attempts[attemptKey]) {
        return res.status(400).json({ error: "Exam already started." });
    }

    // Register secure start time on the server
    const startTime = new Date();
    const maxEndTime = new Date(startTime.getTime() + (exam.durationMinutes * 60000));

    db.attempts[attemptKey] = {
        userId,
        examId,
        startTime,
        maxEndTime,
        status: 'IN_PROGRESS',
        answers: {}
    };

    res.json({
        message: "Exam started securely.",
        serverStartTime: startTime,
        durationMinutes: exam.durationMinutes
    });
});

// 2. HEARTBEAT ENDPOINT (Auto-save)
app.post('/api/exam/heartbeat', (req, res) => {
    const { userId, examId, answers, cheatWarnings } = req.body;
    const attemptKey = `${userId}_${examId}`;
    const attempt = db.attempts[attemptKey];

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
        return res.status(403).json({ error: "Invalid or expired exam session." });
    }

    // Save progress to database
    attempt.answers = { ...attempt.answers, ...answers };
    attempt.cheatWarnings = cheatWarnings;

    res.json({ message: "Progress securely saved." });
});

// 3. SUBMIT EXAM ENDPOINT
app.post('/api/exam/submit', (req, res) => {
    const { userId, examId, answers } = req.body;
    const attemptKey = `${userId}_${examId}`;
    const attempt = db.attempts[attemptKey];

    if (!attempt) return res.status(404).json({ error: "Attempt not found." });

    // Server-Side Timer Validation (The Anti-Cheat Core)
    const now = new Date();
    // Add a 30-second grace period for network latency
    if (now > new Date(attempt.maxEndTime.getTime() + 30000)) {
        attempt.status = 'AUTO_SUBMITTED_LATE';
        return res.status(403).json({ error: "Time expired. Attempt flagged as late." });
    }

    attempt.status = 'COMPLETED';
    attempt.answers = answers;

    // Auto-grading logic would go here
    res.json({ message: "Exam submitted successfully.", status: attempt.status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Standard Exam Server running on port ${PORT}`));