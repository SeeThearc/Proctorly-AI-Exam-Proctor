import React, { createContext, useState, useContext } from 'react';

export const ExamContext = createContext();

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within ExamProvider');
  }
  return context;
};

export const ExamProvider = ({ children }) => {
  const [currentExam, setCurrentExam] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [answers, setAnswers] = useState({});

  const startExam = (exam, session) => {
    setCurrentExam(exam);
    setCurrentSession(session);
    setAnswers({});
  };

  const saveAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const clearExam = () => {
    setCurrentExam(null);
    setCurrentSession(null);
    setAnswers({});
  };

  const value = {
    currentExam,
    currentSession,
    answers,
    startExam,
    saveAnswer,
    clearExam
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};