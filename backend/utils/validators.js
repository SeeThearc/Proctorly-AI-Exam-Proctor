// Email validation
exports.validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Password strength validation
exports.validatePassword = (password) => {
  // At least 6 characters
  if (password. length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }

  return { valid: true, message: 'Password is valid' };
};

// Student ID validation
exports.validateStudentId = (studentId) => {
  // Customize based on your institution's format
  if (!studentId || studentId.trim().length === 0) {
    return { valid: false, message:  'Student ID is required' };
  }

  return { valid: true, message: 'Student ID is valid' };
};

// Faculty ID validation
exports.validateFacultyId = (facultyId) => {
  // Customize based on your institution's format
  if (!facultyId || facultyId.trim().length === 0) {
    return { valid: false, message: 'Faculty ID is required' };
  }

  return { valid: true, message:  'Faculty ID is valid' };
};

// Exam validation
exports.validateExam = (examData) => {
  const errors = [];

  if (!examData.title) {
    errors.push('Exam title is required');
  }

  if (!examData.course) {
    errors.push('Course is required');
  }

  if (!examData.duration || examData.duration < 5) {
    errors.push('Duration must be at least 5 minutes');
  }

  if (!examData.questions || examData.questions.length === 0) {
    errors.push('At least one question is required');
  }

  if (examData.questions) {
    examData.questions. forEach((q, index) => {
      if (!q.questionText) {
        errors.push(`Question ${index + 1}:  Question text is required`);
      }

      if (!q.options || q.options.length < 2) {
        errors.push(`Question ${index + 1}: At least 2 options are required`);
      }

      if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= (q.options?. length || 0)) {
        errors.push(`Question ${index + 1}: Valid correct answer is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Question validation
exports.validateQuestion = (question) => {
  const errors = [];

  if (!question. questionText) {
    errors.push('Question text is required');
  }

  if (!question. options || ! Array.isArray(question.options)) {
    errors.push('Options must be an array');
  } else if (question.options.length < 2) {
    errors.push('At least 2 options are required');
  } else if (question.options.length > 6) {
    errors.push('Maximum 6 options allowed');
  }

  if (question. correctAnswer === undefined) {
    errors.push('Correct answer is required');
  } else if (question.correctAnswer < 0 || question.correctAnswer >= (question.options?.length || 0)) {
    errors.push('Correct answer must be a valid option index');
  }

  if (question.marks !== undefined && question.marks < 1) {
    errors.push('Marks must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};