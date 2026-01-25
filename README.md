AI-Based Online Exam Proctoring System
(Extended MERN Stack with Machine Learning)

Project Overview

An AI-powered online examination system built using the Extended MERN stack that ensures secure, fair, and monitored online exams. The platform integrates real-time computer vision–based proctoring, role-based authentication, and automated violation handling to prevent cheating and impersonation.

Problem It Solves

Traditional online exams lack effective monitoring, making them vulnerable to impersonation, unfair practices, and rule violations such as tab switching or external assistance. This system addresses these issues by enforcing continuous AI-based monitoring and strict exam environment controls.

Target Users (Personas)

Faculty: Conducts and evaluates online exams, reviews violation reports, and monitors exam integrity.

Students: Attempts online exams under secure authentication and continuous AI proctoring.

Vision Statement

To provide a reliable, scalable, and intelligent online examination platform that maintains academic integrity through automated AI-based proctoring and secure system design.

Key Features / Goals

JWT-based authentication with role-based access (Faculty & Student)

AI-based webcam proctoring (face detection, multiple face detection, head movement analysis)

Mandatory full-screen exam environment

Detection of tab switching, window minimizing, and focus loss

Centralized warning system with auto-submission after three violations

Secure storage of exam data, logs, and reports in MongoDB

Success Metrics

Reduction in cheating incidents during online exams

Accurate detection of face and behavior-based violations

Successful auto-submission after violation threshold

Positive faculty feedback on report clarity and usability

Stable performance during concurrent exam sessions

Assumptions & Constraints

Assumptions

Students have access to a webcam-enabled device and stable internet

Users attempt exams using modern browsers supporting WebRTC

Constraints

Accuracy depends on lighting and camera quality

Browser-based proctoring cannot prevent all external cheating methods

Real-time ML inference may impact performance on low-end devices
