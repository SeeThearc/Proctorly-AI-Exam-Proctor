**AI-Based Online Exam Proctoring System**
(Extended MERN Stack with Machine Learning)

**Project Overview**

An AI-powered online examination system built using the Extended MERN stack that ensures secure, fair, and monitored online exams. The platform integrates real-time computer vision–based proctoring, role-based authentication, and automated violation handling to prevent cheating and impersonation.

**Problem It Solves**

Traditional online exams lack effective monitoring, making them vulnerable to impersonation, unfair practices, and rule violations such as tab switching or external assistance. This system addresses these issues by enforcing continuous AI-based monitoring and strict exam environment controls.

**Target Users (Personas)**

Faculty: Conducts and evaluates online exams, reviews violation reports, and monitors exam integrity.

Students: Attempts online exams under secure authentication and continuous AI proctoring.

**Vision Statement**

To provide a reliable, scalable, and intelligent online examination platform that maintains academic integrity through automated AI-based proctoring and secure system design.

**Key Features / Goals**

JWT-based authentication with role-based access (Faculty & Student)

AI-based webcam proctoring (face detection, multiple face detection, head movement analysis)

Mandatory full-screen exam environment

Detection of tab switching, window minimizing, and focus loss

Centralized warning system with auto-submission after three violations

Secure storage of exam data, logs, and reports in MongoDB

**Success Metrics**

Reduction in cheating incidents during online exams

Accurate detection of face and behavior-based violations

Successful auto-submission after violation threshold

Positive faculty feedback on report clarity and usability

Stable performance during concurrent exam sessions

**Assumptions & Constraints**

**Assumptions**

Students have access to a webcam-enabled device and stable internet

Users attempt exams using modern browsers supporting WebRTC

**Constraints**

Accuracy depends on lighting and camera quality

Browser-based proctoring cannot prevent all external cheating methods

Real-time ML inference may impact performance on low-end devices

| Priority    | Features                               |
| ----------- | -------------------------------------- |
| Must Have   | Login, Exam Monitoring, Face Detection |
| Should Have | Face Tracker                           |
| Could Have  | Voice Detection                        |
| Won’t Have  | Mobile App                             |

## Branching Strategy

We follow GitHub Flow:
main branch is always stable

feature branches are created for new features

pull requests are used before merging


## Quick Start – Local Development

Follow these steps to run the frontend (Vite) and backend (Node.js) together using Docker.

**Prerequisites**

Make sure you have the following installed:

Docker

Docker Compose

**From the project root directory, run:

docker-compose up --build**

**Access the Application**

Frontend (Vite): http://localhost:5173

Backend (Node API): http://localhost:5000

**SOFTWARE DESIGN**

The Proctorly Faculty Exam Details page is designed around clarity and speed of decision-making, using colour-coded action buttons, persistent role/status badges, and a clean three-column information grid so faculty can assess exam status and take action without unnecessary navigation. Information is progressively disclosed through tabs — Details, Questions, and Sessions — keeping the initial view focused rather than overwhelming. Proctoring settings are surfaced directly on the main details page with visible status indicators so faculty can verify security configurations are active before an exam goes live, eliminating the need for a separate settings screen.
