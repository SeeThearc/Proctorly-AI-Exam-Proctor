import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import Modal from '../../components/Common/Modal';
import Alert from '../../components/Common/Alert';
import './ExamList.css';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, examId: null, examTitle: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [filter, exams]);

  const fetchExams = async () => {
    try {
      const response = await api.get('/faculty/exams');
      setExams(response.data. exams);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setLoading(false);
    }
  };

  const filterExams = () => {
    const now = new Date();
    if (filter === 'all') {
      setFilteredExams(exams);
    } else if (filter === 'active') {
      setFilteredExams(exams.filter(e => e.isActive));
    } else if (filter === 'inactive') {
      setFilteredExams(exams.filter(e => !e.isActive));
    } else if (filter === 'upcoming') {
      setFilteredExams(exams.filter(e => new Date(e.scheduledDate) > now));
    } else if (filter === 'past') {
      setFilteredExams(exams.filter(e => new Date(e.endDate) < now));
    }
  };

  const handleToggleStatus = async (examId, currentStatus) => {
    try {
      const response = await api.put(`/faculty/exams/${examId}/toggle`);
      if (response.data.success) {
        setExams(exams.map(e => 
          e._id === examId ? { ...e, isActive: response.data.isActive } : e
        ));
        setMessage({ 
          type: 'success', 
          text: `Exam ${response.data.isActive ? 'activated' : 'deactivated'} successfully` 
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update exam status' });
    }
  };

  const handleDeleteExam = async () => {
    try {
      const response = await api.delete(`/faculty/exams/${deleteModal. examId}`);
      if (response.data.success) {
        setExams(exams. filter(e => e._id !== deleteModal.examId));
        setMessage({ type: 'success', text: 'Exam deleted successfully' });
        setDeleteModal({ isOpen: false, examId: null, examTitle:  '' });
        setTimeout(() => setMessage({ type:  '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete exam' });
      setDeleteModal({ isOpen: false, examId: null, examTitle:  '' });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading exams..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="exam-list-container">
        <div className="page-header">
          <div>
            <h1>My Exams</h1>
            <p>Manage your exams and view submissions</p>
          </div>
          <Link to="/faculty/exams/create">
            <Button variant="primary" size="large">
              ➕ Create New Exam
            </Button>
          </Link>
        </div>

        {message.text && (
          <Alert 
            type={message.type} 
            message={message.text} 
            dismissible 
            onClose={() => setMessage({ type: '', text:  '' })} 
          />
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({exams.length})
          </button>
          <button className={`filter-tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
            Active ({exams.filter(e => e.isActive).length})
          </button>
          <button className={`filter-tab ${filter === 'inactive' ? 'active' : ''}`} onClick={() => setFilter('inactive')}>
            Inactive ({exams.filter(e => !e.isActive).length})
          </button>
          <button className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>
            Upcoming ({exams.filter(e => new Date(e.scheduledDate) > new Date()).length})
          </button>
          <button className={`filter-tab ${filter === 'past' ? 'active' :  ''}`} onClick={() => setFilter('past')}>
            Past ({exams.filter(e => new Date(e.endDate) < new Date()).length})
          </button>
        </div>

        {/* Exams List */}
        {filteredExams.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-icon">📚</span>
              <h3>No exams found</h3>
              <p>Create your first exam to get started</p>
              <Link to="/faculty/exams/create">
                <Button variant="primary">Create Exam</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="exams-grid">
            {filteredExams.map(exam => (
              <Card key={exam._id} hoverable>
                <div className="exam-card">
                  <div className="exam-card-header">
                    <h3>{exam.title}</h3>
                    <span className={`status-badge ${exam.isActive ?  'badge-active' : 'badge-inactive'}`}>
                      {exam.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="exam-description">{exam.description || 'No description'}</p>

                  <div className="exam-details">
                    <div className="detail-item">
                      <span className="detail-label">Course:</span>
                      <span className="detail-value">{exam.course}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{exam.duration} mins</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Marks:</span>
                      <span className="detail-value">{exam.totalMarks}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Questions:</span>
                      <span className="detail-value">{exam.questions?. length || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Students:</span>
                      <span className="detail-value">{exam.allowedStudents?.length || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Scheduled: </span>
                      <span className="detail-value">{new Date(exam.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="exam-card-actions">
                    <Link to={`/faculty/exams/${exam._id}`}>
                      <Button variant="primary" size="small" fullWidth>
                        View Details
                      </Button>
                    </Link>
                    <Link to={`/faculty/exams/${exam._id}/sessions`}>
                      <Button variant="secondary" size="small" fullWidth>
                        View Submissions
                      </Button>
                    </Link>
                    <div className="action-row">
                      <Link to={`/faculty/exams/${exam._id}/edit`}>
                        <Button variant="outline" size="small">
                          ✏️ Edit
                        </Button>
                      </Link>
                      <Button 
                        variant={exam.isActive ? 'warning' : 'success'}
                        size="small"
                        onClick={() => handleToggleStatus(exam._id, exam.isActive)}
                      >
                        {exam.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                      </Button>
                      <Button 
                        variant="danger" 
                        size="small"
                        onClick={() => setDeleteModal({ isOpen: true, examId: exam._id, examTitle: exam.title })}
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, examId: null, examTitle: '' })}
          title="Delete Exam"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteModal({ isOpen: false, examId: null, examTitle: '' })}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteExam}>
                Delete
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete <strong>{deleteModal.examTitle}</strong>?</p>
          <p className="warning-text">This action cannot be undone.</p>
        </Modal>
      </div>
    </>
  );
};

export default ExamList;