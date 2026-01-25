🧠 AI-Based Online Exam Proctoring System
Extended MERN Stack with Role-Based Authentication

📌 Overview
An AI-powered online examination platform built using the Extended MERN Stack that ensures secure, fair, and tamper-proof exams through real-time webcam proctoring, role-based access control, and automated violation handling.

👥 User Roles
Faculty: Creates exams, evaluates results, reviews violation reports
Student: Attempts exams under continuous AI monitoring

🔐 Authentication & Security
JWT-based login and protected routes
Role-based authorization (Admin / Faculty / Student)
Encrypted credentials and secure MongoDB storage

🧠 AI Proctoring Features
Face detection & recognition (identity verification)
Multiple face detection (unauthorized presence)
Head movement analysis (suspicious behavior)
Implemented using OpenCV, Haar Cascades, CNNs, TensorFlow.js.

🖥️ Exam Monitoring
Mandatory full-screen mode
Detection of tab switching, minimizing, or screen exit
All violations logged in real time

⚠️ Warning System
Centralized violation counter
Each violation increments warnings
3 warnings → auto-submit exam + terminate session
Detailed violation report generated for faculty

🏗️ Tech Stack
Frontend: React.js, TensorFlow.js, WebRTC
Backend: Node.js, Express.js, JWT
Database: MongoDB
ML: OpenCV, CNNs, Haar Cascade

🚀 Setup
git clone <repo-url>
cd backend
npm install && npm start
cd frontend
npm install && npm start

📁 Database Collections
Users
Exams
Exam Sessions
Violations
Results

🎓 Use Case
Suitable for academic evaluations, online assessments, and secure remote examinations with real-world AI integration.
