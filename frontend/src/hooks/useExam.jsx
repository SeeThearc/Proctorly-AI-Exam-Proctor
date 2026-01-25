import { useContext } from 'react';
import { ExamContext } from '../context/ExamContext';

/**
 * Custom hook to use Exam context
 * This is a convenience wrapper around useContext(ExamContext)
 */
const useExam = () => {
  const context = useContext(ExamContext);
  
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  
  return context;
};

export default useExam;