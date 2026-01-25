import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import Alert from '../../components/Common/Alert';
import './CreateExam.css';

const CreateExam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [examData, setExamData] = useState({
    title: '',
    description: '',
    course: '',
    duration: 60,
    passingMarks: 40,
    scheduledDate: '',
    endDate: '',
    proctoringSettings: {
      enableFaceDetection: true,
      enableMultipleFaceDetection: true,
      enableHeadMovement: true,
      enableTabSwitch: true,
      warningThreshold: 3
    },
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultsImmediately: true,
      negativeMarking:  {
        enabled: false,
        deduction: 0.25
      }
    }
  });

  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1
    }
  ]);

  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // ✅ Calculate total marks
  const calculateTotalMarks = () => {
    return questions.reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);
  };

  // Check if user is faculty
  useEffect(() => {
    if (!user) {
      setError('Please login to access this page');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (user.role !== 'faculty') {
      setError(`Access denied. This page is for faculty only.  Your role:  ${user.role}`);
      setTimeout(() => navigate(`/${user.role}`), 2000);
    }
  }, [user, navigate]);

  // Load all students on mount
  useEffect(() => {
    if (! user || user.role !== 'faculty') {
      return;
    }

    const loadAllStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await api.get('/faculty/students');
        setAllStudents(response.data.students || []);
      } catch (error) {
        console.error('Error loading students:', error);
        if (error.response?.status === 403) {
          setError('Access denied. Please make sure you are logged in as faculty.');
        } else {
          setError('Failed to load students list');
        }
      } finally {
        setLoadingStudents(false);
      }
    };

    loadAllStudents();
  }, [user]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studentSearch. trim()) {
        searchStudents(studentSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearch, allStudents]);

  const searchStudents = (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = allStudents.filter(student => 
      student.name?. toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm) ||
      student.studentId?.toLowerCase().includes(searchTerm)
    ).slice(0, 20);

    setSearchResults(filtered);
  };

  const handleExamChange = (field, value) => {
    setExamData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProctoringChange = (field, value) => {
    setExamData(prev => ({
      ...prev,
      proctoringSettings: {
        ... prev.proctoringSettings,
        [field]: value
      }
    }));
  };

  const handleSettingsChange = (field, value) => {
    setExamData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleNegativeMarkingChange = (field, value) => {
    setExamData(prev => ({
      ... prev,
      settings: {
        ...prev.settings,
        negativeMarking: {
          ...prev.settings.negativeMarking,
          [field]: value
        }
      }
    }));
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks:  1
    }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [... questions];
    if (updated[qIndex].options.length < 6) {
      updated[qIndex].options.push('');
      setQuestions(updated);
    }
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options. length > 2) {
      updated[qIndex].options.splice(oIndex, 1);
      if (updated[qIndex].correctAnswer >= updated[qIndex].options.length) {
        updated[qIndex]. correctAnswer = updated[qIndex]. options.length - 1;
      }
      setQuestions(updated);
    }
  };

  const addStudent = (student) => {
    if (!students.find(s => s._id === student._id)) {
      setStudents([...students, student]);
    }
    setStudentSearch('');
    setSearchResults([]);
  };

  const removeStudent = (studentId) => {
    setStudents(students.filter(s => s._id !== studentId));
  };

  const validateForm = () => {
    if (!examData.title || !examData.course) {
      setError('Please fill in all required fields');
      return false;
    }

    if (! examData.scheduledDate || !examData.endDate) {
      setError('Please set exam schedule dates');
      return false;
    }

    if (new Date(examData.endDate) <= new Date(examData.scheduledDate)) {
      setError('End date must be after start date');
      return false;
    }

    if (questions.length === 0) {
      setError('Please add at least one question');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText) {
        setError(`Question ${i + 1}:  Please enter question text`);
        return false;
      }
      if (q.options.some(opt => ! opt)) {
        setError(`Question ${i + 1}: Please fill in all options`);
        return false;
      }
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        setError(`Question ${i + 1}: Please select a correct answer`);
        return false;
      }
    }

    if (students.length === 0) {
      setError('Please add at least one student');
      return false;
    }

    // ✅ Validate passing marks
    const totalMarks = calculateTotalMarks();
    if (examData.passingMarks > totalMarks) {
      setError(`Passing marks (${examData.passingMarks}) cannot exceed total marks (${totalMarks})`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...examData,
        questions,
        allowedStudents: students.map(s => s._id)
      };

      const response = await api.post('/faculty/exams', payload);

      if (response.data.success) {
        setSuccess('Exam created successfully!');
        setTimeout(() => {
          navigate(`/faculty`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      setError(error.response?.data?.message || 'Failed to create exam');
      setLoading(false);
    }
  };

  // Don't render form if not faculty
  if (! user || user.role !== 'faculty') {
    return (
      <>
        <Navbar />
        <div className="create-exam-container">
          <Alert type="error" message={error || 'Checking permissions.. .'} />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="create-exam-container">
        <div className="page-header">
          <h1>Create New Exam</h1>
          <p>Set up a new MCQ exam with proctoring</p>
        </div>

        {error && <Alert type="error" message={error} dismissible onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <Card title="📋 Basic Details">
            <div className="form-grid">
              <Input
                label="Exam Title"
                name="title"
                value={examData.title}
                onChange={(e) => handleExamChange('title', e.target.value)}
                placeholder="e.g., Data Structures Mid-Term"
                required
              />

              <Input
                label="Course"
                name="course"
                value={examData.course}
                onChange={(e) => handleExamChange('course', e. target.value)}
                placeholder="e.g., CSE101"
                required
              />

              <Input
                label="Duration (minutes)"
                type="number"
                name="duration"
                value={examData. duration}
                onChange={(e) => handleExamChange('duration', parseInt(e.target.value))}
                required
                min="5"
                max="300"
              />

              <Input
                label="Passing Marks"
                type="number"
                name="passingMarks"
                value={examData.passingMarks}
                onChange={(e) => handleExamChange('passingMarks', parseInt(e.target.value))}
                required
                min="0"
                max={calculateTotalMarks() || 100}
                helperText={`Total Marks: ${calculateTotalMarks()}`}
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">Description</label>
              <textarea
                className="input-field"
                value={examData.description}
                onChange={(e) => handleExamChange('description', e.target. value)}
                placeholder="Brief description of the exam"
                rows="3"
              />
            </div>

            <div className="form-grid">
              <Input
                label="Scheduled Date & Time"
                type="datetime-local"
                name="scheduledDate"
                value={examData.scheduledDate}
                onChange={(e) => handleExamChange('scheduledDate', e.target.value)}
                required
              />

              <Input
                label="End Date & Time"
                type="datetime-local"
                name="endDate"
                value={examData. endDate}
                onChange={(e) => handleExamChange('endDate', e.target.value)}
                required
              />
            </div>
          </Card>

          {/* Questions */}
          <Card title="❓ Questions">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="question-builder">
                <div className="question-builder-header">
                  <h4>Question {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="small"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="input-wrapper">
                  <label className="input-label">Question Text *</label>
                  <textarea
                    className="input-field"
                    value={question. questionText}
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e. target.value)}
                    placeholder="Enter your question here"
                    rows="3"
                    required
                  />
                </div>

                <div className="options-builder">
                  <label className="input-label">Options *</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-builder">
                      <label className="option-radio-label">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                        />
                        <span className="option-letter">{String.fromCharCode(65 + oIndex)}</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        required
                      />
                      {question.options.length > 2 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="small"
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  {question.options.length < 6 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => addOption(qIndex)}
                    >
                      + Add Option
                    </Button>
                  )}
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <Input
                    label="Marks"
                    type="number"
                    value={question.marks}
                    onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 1)}
                    min="1"
                    required
                  />
                </div>
              </div>
            ))}

            <Button type="button" variant="primary" onClick={addQuestion}>
              + Add Question
            </Button>
          </Card>

          {/* Students */}
          <Card title="👥 Assign Students">
            <div className="student-search">
              <Input
                label="Search Students"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name, email or student ID (min 2 characters)"
                disabled={loadingStudents}
              />
              {loadingStudents && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  Loading students...
                </p>
              )}
              {searchResults. length > 0 && (
                <div className="search-results">
                  {searchResults. map(student => (
                    <div
                      key={student._id}
                      className="search-result-item"
                      onClick={() => addStudent(student)}
                    >
                      <span>{student.name}</span>
                      <span className="student-id">{student.studentId}</span>
                    </div>
                  ))}
                </div>
              )}
              {studentSearch. length >= 2 && searchResults.length === 0 && ! loadingStudents && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  No students found
                </p>
              )}
            </div>

            <div className="selected-students">
              <h4>Selected Students ({students.length})</h4>
              {students.length === 0 ? (
                <p className="empty-message">No students selected yet</p>
              ) : (
                <div className="students-list">
                  {students.map(student => (
                    <div key={student._id} className="student-chip">
                      <span>{student.name} ({student.studentId})</span>
                      <button
                        type="button"
                        onClick={() => removeStudent(student._id)}
                        className="remove-student"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Proctoring Settings */}
          <Card title="🔒 Proctoring Settings">
            <div className="settings-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData.proctoringSettings.enableFaceDetection}
                  onChange={(e) => handleProctoringChange('enableFaceDetection', e.target.checked)}
                />
                <span>Enable Face Detection</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData.proctoringSettings.enableMultipleFaceDetection}
                  onChange={(e) => handleProctoringChange('enableMultipleFaceDetection', e.target.checked)}
                />
                <span>Detect Multiple Faces</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData.proctoringSettings. enableHeadMovement}
                  onChange={(e) => handleProctoringChange('enableHeadMovement', e.target.checked)}
                />
                <span>Track Head Movement</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData.proctoringSettings.enableTabSwitch}
                  onChange={(e) => handleProctoringChange('enableTabSwitch', e.target.checked)}
                />
                <span>Detect Tab Switching</span>
              </label>
            </div>

            <Input
              label="Warning Threshold"
              type="number"
              value={examData.proctoringSettings.warningThreshold}
              onChange={(e) => handleProctoringChange('warningThreshold', parseInt(e.target. value))}
              min="1"
              max="10"
              helperText="Number of warnings before auto-submission"
            />
          </Card>

          {/* Exam Settings */}
          <Card title="⚙️ Exam Settings">
            <div className="settings-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData.settings.shuffleQuestions}
                  onChange={(e) => handleSettingsChange('shuffleQuestions', e.target.checked)}
                />
                <span>Shuffle Questions</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData.settings. shuffleOptions}
                  onChange={(e) => handleSettingsChange('shuffleOptions', e.target. checked)}
                />
                <span>Shuffle Options</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData.settings.showResultsImmediately}
                  onChange={(e) => handleSettingsChange('showResultsImmediately', e.target.checked)}
                />
                <span>Show Results Immediately</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examData. settings.negativeMarking.enabled}
                  onChange={(e) => handleNegativeMarkingChange('enabled', e.target.checked)}
                />
                <span>Enable Negative Marking</span>
              </label>
            </div>

            {examData.settings.negativeMarking.enabled && (
              <Input
                label="Deduction per Wrong Answer"
                type="number"
                step="0.25"
                value={examData.settings.negativeMarking.deduction}
                onChange={(e) => handleNegativeMarkingChange('deduction', parseFloat(e.target.value))}
                min="0"
                max="5"
              />
            )}
          </Card>

          {/* Submit */}
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              size="large"
              onClick={() => navigate('/faculty/exams')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
            >
              Create Exam
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateExam;