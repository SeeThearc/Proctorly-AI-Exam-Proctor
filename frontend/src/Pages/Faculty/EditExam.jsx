import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Alert from '../../components/Common/Alert';
import './EditExam.css';

const EditExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Exam basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [scheduledDate, setScheduledDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Questions
  const [questions, setQuestions] = useState([]);

  // Proctoring settings
  const [proctoringSettings, setProctoringSettings] = useState({
    enableFaceDetection: true,
    enableMultipleFaceDetection: true,
    enableHeadMovement: true,
    enableTabSwitch: true,
    warningThreshold: 3,
    autoSubmitOnThreshold: true
  });

  // Exam settings
  const [examSettings, setExamSettings] = useState({
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultsImmediately: true,
    allowReviewAnswers: true,
    negativeMarking: {
      enabled: false,
      deduction: 0.25
    }
  });

  // Students
  const [allowedStudents, setAllowedStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExamDetails();
    fetchAllStudents();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/faculty/exams/${examId}`);
      
      if (response.data.success) {
        const exam = response.data.exam;
        
        // Set basic info
        setTitle(exam.title);
        setDescription(exam.description || '');
        setCourse(exam.course);
        setDuration(exam.duration);
        setTotalMarks(exam.totalMarks);
        setPassingMarks(exam.passingMarks);
        setScheduledDate(new Date(exam.scheduledDate).toISOString().slice(0, 16));
        setEndDate(new Date(exam.endDate).toISOString().slice(0, 16));
        setIsActive(exam.isActive);
        
        // Set questions
        setQuestions(exam.questions || []);
        
        // Set proctoring settings
        setProctoringSettings(exam.proctoringSettings || proctoringSettings);
        
        // Set exam settings
        setExamSettings(exam.settings || examSettings);
        
        // Set allowed students
        setAllowedStudents(exam.allowedStudents || []);
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api. get('/faculty/students');
      if (response.data.success) {
        setAllStudents(response.data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 1,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions. filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex]. options[optIndex] = value;
    setQuestions(updated);
  };

  const handleToggleStudent = (studentId) => {
    if (allowedStudents.includes(studentId)) {
      setAllowedStudents(allowedStudents.filter(id => id !== studentId));
    } else {
      setAllowedStudents([...allowedStudents, studentId]);
    }
  };

  const handleSelectAllStudents = () => {
    setAllowedStudents(allStudents.map(s => s._id));
  };

  const handleDeselectAllStudents = () => {
    setAllowedStudents([]);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  // Validation
  if (!title || !course || !scheduledDate || !endDate) {
    setError('Please fill all required fields');
    return;
  }

  // ✅ Validate dates
  const schedDate = new Date(scheduledDate);
  const endDateObj = new Date(endDate);

  if (endDateObj <= schedDate) {
    setError('End date must be after scheduled date');
    return;
  }

  if (questions.length === 0) {
    setError('Please add at least one question');
    return;
  }

  if (allowedStudents.length === 0) {
    setError('Please select at least one student');
    return;
  }

  // Validate questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText. trim()) {
      setError(`Question ${i + 1}:  Question text is required`);
      return;
    }
    if (q.options. some(opt => !opt.trim())) {
      setError(`Question ${i + 1}: All options must be filled`);
      return;
    }
  }

  // ✅ Calculate total marks
  const calculatedTotalMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

  // ✅ Validate passing marks
  if (Number(passingMarks) > calculatedTotalMarks) {
    setError(`Passing marks (${passingMarks}) cannot exceed total marks (${calculatedTotalMarks})`);
    return;
  }

  try {
    setSaving(true);

    const examData = {
      title,
      description,
      course,
      duration:  Number(duration),
      totalMarks: calculatedTotalMarks,  // ✅ Send calculated total marks
      passingMarks: Number(passingMarks),
      scheduledDate:  new Date(scheduledDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isActive,
      questions,
      allowedStudents,
      proctoringSettings,
      settings:  examSettings
    };

    console.log('📤 Submitting exam data:', examData);

    const response = await api.put(`/faculty/exams/${examId}`, examData);

    if (response.data.success) {
      setSuccess('Exam updated successfully! ');
      setTimeout(() => {
        navigate(`/faculty/exams/${examId}`);
      }, 1500);
    }
  } catch (error) {
    console.error('Error updating exam:', error);
    
    // ✅ Show detailed error messages
    if (error.response?.data?.errors) {
      setError(error.response.data.errors. join(', '));
    } else {
      setError(error.response?.data?.message || 'Failed to update exam');
    }
  } finally {
    setSaving(false);
  }
};

  const filteredStudents = allStudents.filter(student =>
    student.name?. toLowerCase().includes(searchTerm. toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="edit-exam-container">
          <div className="loading">Loading exam... </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="edit-exam-container">
        <div className="edit-exam-header">
          <h1>Edit Exam</h1>
          <Button variant="secondary" onClick={() => navigate(`/faculty/exams/${examId}`)}>
            ← Back to Exam Details
          </Button>
        </div>

        {error && <Alert type="error" message={error} dismissible onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card title="Basic Information">
            <div className="form-grid">
              <Input
                label="Exam Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Mid-Term Examination"
                required
              />

              <Input
                label="Course *"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g., Computer Science 101"
                required
              />

              <Input
                label="Duration (minutes) *"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                required
              />

              <Input
                label="Passing Marks *"
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
                min="0"
                required
              />

              <Input
                label="Scheduled Date *"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />

              <Input
                label="End Date *"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exam description (optional)"
                rows="3"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Exam is Active</span>
              </label>
            </div>
          </Card>

          {/* Questions */}
          <Card title={`Questions (${questions.length})`}>
            <div className="questions-section">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="question-card">
                  <div className="question-card-header">
                    <h3>Question {qIndex + 1}</h3>
                    <Button
                      type="button"
                      variant="danger"
                      size="small"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="form-group">
                    <label>Question Text *</label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, 'questionText', e.target.value)
                      }
                      placeholder="Enter your question here"
                      rows="3"
                      className="form-textarea"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Options *</label>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="option-input">
                        <span className="option-label">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(qIndex, optIndex, e.target.value)
                          }
                          placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                          className="form-input"
                          required
                        />
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === optIndex}
                          onChange={() =>
                            handleQuestionChange(qIndex, 'correctAnswer', optIndex)
                          }
                          title="Mark as correct answer"
                        />
                      </div>
                    ))}
                    <p className="help-text">Select the radio button to mark the correct answer</p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Marks *</label>
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, 'marks', Number(e.target.value))
                        }
                        min="1"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Explanation (optional)</label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, 'explanation', e.target.value)
                      }
                      placeholder="Explain the correct answer"
                      rows="2"
                      className="form-textarea"
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="secondary" onClick={handleAddQuestion} fullWidth>
                + Add Question
              </Button>
            </div>
          </Card>
          {/* Add this after the Questions card, before Allowed Students */}
            <div className="calculated-marks">
            <strong>Calculated Total Marks:</strong> {questions.reduce((sum, q) => sum + Number(q.marks), 0)}
            <br />
            <strong>Passing Marks:</strong> {passingMarks}
            {Number(passingMarks) > questions.reduce((sum, q) => sum + Number(q.marks), 0) && (
                <span style={{ color: 'red', marginLeft: '1rem' }}>
                ⚠️ Passing marks exceed total marks! 
                </span>
            )}
            </div>
          {/* Allowed Students */}
          <Card title="Allowed Students">
            <div className="students-section">
              <div className="students-actions">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e. target.value)}
                />
                <div className="students-buttons">
                  <Button type="button" variant="secondary" size="small" onClick={handleSelectAllStudents}>
                    Select All
                  </Button>
                  <Button type="button" variant="secondary" size="small" onClick={handleDeselectAllStudents}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="students-selected">
                <strong>{allowedStudents.length}</strong> student(s) selected
              </div>

              <div className="students-list">
                {filteredStudents.map((student) => (
                  <label key={student._id} className="student-item">
                    <input
                      type="checkbox"
                      checked={allowedStudents.includes(student._id)}
                      onChange={() => handleToggleStudent(student._id)}
                    />
                    <div className="student-info">
                      <span className="student-name">{student. name}</span>
                      <span className="student-email">{student.email}</span>
                      {student.studentId && (
                        <span className="student-id">{student.studentId}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {filteredStudents.length === 0 && (
                <p className="no-results">No students found</p>
              )}
            </div>
          </Card>

          {/* Proctoring Settings */}
          <Card title="Proctoring Settings">
            <div className="settings-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={proctoringSettings. enableFaceDetection}
                  onChange={(e) =>
                    setProctoringSettings({
                      ...proctoringSettings,
                      enableFaceDetection: e.target.checked
                    })
                  }
                />
                <span>Enable Face Detection</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={proctoringSettings.enableMultipleFaceDetection}
                  onChange={(e) =>
                    setProctoringSettings({
                      ...proctoringSettings,
                      enableMultipleFaceDetection: e.target.checked
                    })
                  }
                />
                <span>Detect Multiple Faces</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={proctoringSettings.enableHeadMovement}
                  onChange={(e) =>
                    setProctoringSettings({
                      ...proctoringSettings,
                      enableHeadMovement: e.target.checked
                    })
                  }
                />
                <span>Detect Head Movement</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={proctoringSettings.enableTabSwitch}
                  onChange={(e) =>
                    setProctoringSettings({
                      ...proctoringSettings,
                      enableTabSwitch:  e.target.checked
                    })
                  }
                />
                <span>Detect Tab Switching</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={proctoringSettings.autoSubmitOnThreshold}
                  onChange={(e) =>
                    setProctoringSettings({
                      ...proctoringSettings,
                      autoSubmitOnThreshold: e.target.checked
                    })
                  }
                />
                <span>Auto-submit on Threshold</span>
              </label>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Warning Threshold</label>
              <input
                type="number"
                value={proctoringSettings.warningThreshold}
                onChange={(e) =>
                  setProctoringSettings({
                    ...proctoringSettings,
                    warningThreshold: Number(e.target.value)
                  })
                }
                min="1"
                max="10"
                className="form-input"
                style={{ maxWidth: '200px' }}
              />
              <p className="help-text">
                Number of warnings before auto-submission
              </p>
            </div>
          </Card>

          {/* Exam Settings */}
          <Card title="Exam Settings">
            <div className="settings-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examSettings.shuffleQuestions}
                  onChange={(e) =>
                    setExamSettings({
                      ...examSettings,
                      shuffleQuestions: e.target.checked
                    })
                  }
                />
                <span>Shuffle Questions</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examSettings.shuffleOptions}
                  onChange={(e) =>
                    setExamSettings({
                      ...examSettings,
                      shuffleOptions: e.target.checked
                    })
                  }
                />
                <span>Shuffle Options</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examSettings.showResultsImmediately}
                  onChange={(e) =>
                    setExamSettings({
                      ...examSettings,
                      showResultsImmediately:  e.target.checked
                    })
                  }
                />
                <span>Show Results Immediately</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examSettings.allowReviewAnswers}
                  onChange={(e) =>
                    setExamSettings({
                      ... examSettings,
                      allowReviewAnswers: e.target. checked
                    })
                  }
                />
                <span>Allow Review Answers</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={examSettings.negativeMarking.enabled}
                  onChange={(e) =>
                    setExamSettings({
                      ...examSettings,
                      negativeMarking:  {
                        ...examSettings. negativeMarking,
                        enabled: e.target.checked
                      }
                    })
                  }
                />
                <span>Enable Negative Marking</span>
              </label>
            </div>

            {examSettings.negativeMarking.enabled && (
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Negative Marking Deduction</label>
                <input
                  type="number"
                  step="0.25"
                  value={examSettings.negativeMarking.deduction}
                  onChange={(e) =>
                    setExamSettings({
                      ...examSettings,
                      negativeMarking: {
                        ...examSettings.negativeMarking,
                        deduction: Number(e.target.value)
                      }
                    })
                  }
                  min="0"
                  className="form-input"
                  style={{ maxWidth: '200px' }}
                />
                <p className="help-text">
                  Marks to deduct for each wrong answer
                </p>
              </div>
            )}
          </Card>

          {/* Submit Button */}
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/faculty/exams/${examId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {saving ?  'Updating...' : 'Update Exam'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditExam;