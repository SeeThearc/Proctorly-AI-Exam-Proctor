# AI-Based Online Exam Proctoring System

> **Extended MERN Stack with Machine Learning**

An AI-powered online examination platform built using the **Extended MERN Stack** that ensures secure, fair, and monitored online exams through real-time AI-based proctoring, role-based authentication, and automated violation handling.

---

## 📖 Project Overview

The **AI-Based Online Exam Proctoring System** integrates machine learning-based computer vision with a modern MERN architecture to monitor students during online examinations. The platform helps educational institutions conduct secure exams by detecting suspicious activities such as face absence, multiple faces, excessive head movement, tab switching, and window focus loss.

The system automatically warns students upon violations and submits the exam after repeated offenses, helping maintain academic integrity.

---

## 🚀 Problem Statement

Traditional online examination platforms lack effective monitoring mechanisms, making them vulnerable to:

- Impersonation
- Unfair practices
- Tab switching
- External assistance
- Exam rule violations

This project addresses these challenges through continuous AI-powered monitoring and secure authentication.

---

## 👥 Target Users

### Faculty

- Create and manage online examinations
- Monitor students during exams
- Review AI-generated violation reports
- Evaluate student performance

### Student

- Securely log in using authenticated credentials
- Attempt online examinations
- Be monitored continuously through AI-based webcam proctoring
- Receive real-time warnings for detected violations

---

## 🎯 Vision Statement

To provide a reliable, scalable, and intelligent online examination platform that maintains academic integrity through automated AI-based proctoring and secure system architecture.

---

## ✨ Features

### Authentication

- JWT-based Authentication
- Role-Based Access Control
- Faculty Dashboard
- Student Dashboard

### AI Proctoring

- Real-time Face Detection
- Multiple Face Detection
- Face Tracking
- Head Movement Analysis
- Continuous Webcam Monitoring

### Exam Monitoring

- Mandatory Full-Screen Mode
- Tab Switching Detection
- Window Minimize Detection
- Browser Focus Monitoring
- Automated Warning System

### Security

- Secure JWT Authentication
- Protected APIs
- Secure MongoDB Storage
- Exam Logs and Violation Reports

### Automated Actions

- Warning after every detected violation
- Automatic exam submission after three violations
- Faculty access to detailed violation reports

---

## 📊 Success Metrics

- Reduction in cheating incidents during online examinations
- Accurate detection of face and behavior-based violations
- Reliable auto-submission after reaching the violation threshold
- Positive faculty feedback regarding report clarity and usability
- Stable performance during concurrent examination sessions

---

## ⚠️ Assumptions

- Students have access to a webcam-enabled device.
- Users have a stable internet connection.
- Modern browsers supporting WebRTC are used.

---

## 🚧 Constraints

- Detection accuracy depends on lighting conditions.
- Detection quality depends on webcam quality.
- Browser-based monitoring cannot prevent every external cheating method.
- Real-time machine learning inference may affect performance on low-end devices.

---

## 📌 Project Scope (MoSCoW Prioritization)

| Priority | Features |
|----------|----------|
| ✅ Must Have | Login, Exam Monitoring, Face Detection |
| 🟡 Should Have | Face Tracker |
| 🔵 Could Have | Voice Detection |
| ❌ Won't Have | Mobile Application |

---

## 🌳 Branching Strategy

This project follows **GitHub Flow**.

```text
main
│
├── feature/authentication
├── feature/exam-module
├── feature/proctoring
├── feature/ml-model
└── feature/dashboard
```

### Workflow

1. Create a feature branch.
2. Implement the feature.
3. Commit changes.
4. Open a Pull Request.
5. Review and merge into the `main` branch.

---

## 🛠 Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express.js

### Database

- MongoDB

### Machine Learning

- OpenCV
- MediaPipe
- TensorFlow (or Custom ML Models)

### Authentication

- JWT

### DevOps

- Docker
- Docker Compose

---

## 🚀 Quick Start

### Prerequisites

Install the following software:

- Docker
- Docker Compose

### Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

### Run the Application

```bash
docker-compose up --build
```

### Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |

---

## 🎨 Software Design

The **Proctorly Faculty Exam Details** page is designed around **clarity**, **speed**, and **ease of decision-making**.

### Design Highlights

- Color-coded action buttons
- Persistent role and status badges
- Three-column information layout
- Progressive information disclosure using tabs
- Visible AI proctoring status indicators
- Minimal navigation for common faculty tasks

### Available Tabs

- Details
- Questions
- Sessions

Faculty members can quickly verify all security configurations before publishing an exam without navigating to a separate settings page.

---

## 🏗️ System Architecture

<p align="center">
  <img src="https://github.com/user-attachments/assets/4a2427c8-ff1a-451c-b947-1583c9f9312b" alt="System Architecture" width="900"/>
</p>

---

## 📄 License

This project is intended for educational and research purposes.
