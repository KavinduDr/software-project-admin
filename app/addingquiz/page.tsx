'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@nextui-org/button';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Clock,
  Calendar,
  Key,
  Save,
  X,
  PlusCircle,
  Trash2,
  CheckCircle,
  ListChecks,
  Edit3,
  HelpCircle,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function QuizForm() {
  const { admin } = useAdmin();
  const [type, setType] = useState('mcq');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('Test your knowledge');
  const [questions, setQuestions] = useState([
    { type: 'mcq', questionText: '', answers: ['', '', '', ''], correct: [false, false, false, false] },
  ]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mainStartTime, setMainStartTime] = useState('');
  const [mainEndTime, setMainEndTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [intendedBatch, setIntendedBatch] = useState(''); // New state for intended batch
  const [maxRetries] = useState(3); // Set maximum retries
  const [intendedBatch, setIntendedBatch] = useState('');
  const router = useRouter();

  // Set default dates when component mounts
  useEffect(() => {
    if (!startDate || !mainStartTime || !mainEndTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (!startDate) {
        const startDate = new Date(tomorrow);
        startDate.setHours(0, 0, 0, 0);
        setStartDate(startDate.toISOString().slice(0, 16));
      }

      if (!mainStartTime) {
        const startTime = new Date(tomorrow);
        startTime.setHours(9, 0, 0, 0);
        setMainStartTime(startTime.toISOString().slice(0, 16));
      }

      if (!mainEndTime) {
        const endTime = new Date(tomorrow);
        endTime.setHours(17, 0, 0, 0);
        setMainEndTime(endTime.toISOString().slice(0, 16));
      }
    }
  }, []);

  // Initialize questions based on type
  const setTypeAndInitializeQuestions = (newType) => {
    setType(newType);
  
    if (newType === 'mcq') {
      setQuestions([{ 
        type: 'mcq', 
        questionText: '', 
        answers: ['', '', '', ''], 
        correct: [false, false, false, false] 
      }]);
    } else if (newType === 'essay') {
      setQuestions([{ 
        type: 'essay', 
        questionText: '', 
        answer: '' 
      }]);
    }
  };

  const addQuestion = (type, afterIndex = null) => {
    const newQuestion =
      type === 'mcq'
        ? { 
            type: 'mcq', 
            questionText: '', 
            answers: ['', '', '', ''], 
            correct: [false, false, false, false] 
          }
        : { 
            type: 'essay', 
            questionText: '', 
            answer: '' 
          };
  
    if (afterIndex === null) {
      setQuestions([...questions, newQuestion]);
    } else {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(afterIndex + 1, 0, newQuestion);
      setQuestions(updatedQuestions);
    }
  };

  interface Question {
    questionText: string;
    answers: string[];
    correct: boolean[];
    pointsForQuestion: number; // Optional property for points
  }

  const deleteQuestion = (index: number): void => {
    if (questions.length === 1) {
      setAlertMessage('You need at least one question');
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        setAlertMessage('');
      }, 2000);
      return;
    }

    setQuestions(prev => prev.filter((_, qIndex) => qIndex !== index));
    setAlertMessage(`Deleted question ${index + 1}`);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      setAlertMessage('');
    }, 1500);
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const validateForm = () => {
    if (!title.trim()) {
      setAlertMessage('Assignment title is required.');
      setShowAlert(true);
      return false;
    }

    if (!intendedBatch.trim()) {
      setAlertMessage('Intended batch is required.');
      setShowAlert(true);
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.questionText.trim()) {
        setAlertMessage(`Question ${i+1} text is required.`);
        setShowAlert(true);
        return false;
      }
      
      if (q.type === 'mcq') {
        if (q.answers.some((answer) => !answer.trim())) {
          setAlertMessage(`All answers for question ${i+1} must have text.`);
          setShowAlert(true);
          return false;
        }
        
        if (!q.correct.includes(true)) {
          setAlertMessage(`Question ${i+1} must have at least one correct answer.`);
          setShowAlert(true);
          return false;
        }
      } else if (q.type === 'essay') {
        if (!q.answer || !q.answer.trim()) {
          setAlertMessage(`Model answer for essay question ${i+1} is required.`);
          setShowAlert(true);
          return false;
        }
      }
    }

    if (!password.trim()) {
      setAlertMessage('Password is required.');
      setShowAlert(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setRetryCount(0);
    setAlertMessage('Processing your request...');
    setShowAlert(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlertMessage('No authentication token found. Please login.');
        setShowAlert(true);
        router.push('/login');
        return;
      }

      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;

      const formattedQuestions = questions.map((q) => {
        if (q.type === 'mcq') {
          return {
            type: 'mcq',
            questionText: q.questionText,
            options: q.answers.map((answer, idx) => ({
              text: answer,
              isCorrect: q.correct[idx],
            })),
          };
        } else {
          return {
            type: 'essay',
            questionText: q.questionText,
            answer: q.answer || '',
          };
        }
      });

      const assignmentData = {
        title,
        description,
        timeLimit: parseInt(timeLimit, 10),
        password,
        teacherId: admin?._id,
        startDate,
        endDate: mainEndTime,
        guidelines: ["Guideline 1", "Guideline 2", "Guideline 3", "Guideline 4"],
        intendedBatch: parseInt(intendedBatch, 10),
        questions: formattedQuestions,
      };

      const endpoint = type === 'mcq'
        ? `${apiUrl}/api/v1/create-assignment`
        : `${apiUrl}/api/v1/essay/create`;

      const response = await axios.post(endpoint, assignmentData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response && response.data) {
        setAlertMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} assignment created successfully!`);
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setAlertMessage('An error occurred while creating the assignment.');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      {/* Decorative elements */}
      <div className="fixed top-20 right-40 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="fixed bottom-40 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              {type === 'mcq' ?
                <ListChecks className="mr-3 h-6 w-6" /> :
                <Edit3 className="mr-3 h-6 w-6" />
              }
              Create {type === 'mcq' ? 'Quiz' : 'Essay'} Assignment
            </h1>

            {/* Dropdown menu section */}
            <div className="relative">
              <motion.button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl backdrop-blur-sm transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Assignment Type</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 overflow-hidden border border-gray-100"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: '#e6f7ff' }}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-2 ${type === 'mcq'
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-700 bg-white'
                        }`}
                      onClick={() => {
                        setTypeAndInitializeQuestions('mcq');
                        setShowDropdown(false);
                      }}
                    >
                      <ListChecks className={`h-5 w-5 ${type === 'mcq' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span>Multiple Choice</span>
                      {type === 'mcq' && <CheckCircle className="h-4 w-4 ml-auto text-blue-600" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ backgroundColor: '#e6f7ff' }}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-2 ${type === 'essay'
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-700 bg-white'
                        }`}
                      onClick={() => {
                        setTypeAndInitializeQuestions('essay');
                        setShowDropdown(false);
                      }}
                    >
                      <Edit3 className={`h-5 w-5 ${type === 'essay' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span>Essay</span>
                      {type === 'essay' && <CheckCircle className="h-4 w-4 ml-auto text-blue-600" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ backgroundColor: '#e6f7ff' }}
                      className="w-full text-left px-4 py-3 flex items-center space-x-2 text-gray-700 bg-white"
                      onClick={() => {
                        console.log("Navigating to mixed page");
                        router.push('/mixed')
                        setShowDropdown(false);
                      }}
                    >
                      <HelpCircle className="h-5 w-5 text-gray-600" />
                      <span>Mixed</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="mt-2 text-blue-50">Create interactive assignments to engage your students</p>
        </div>

        {/* Alert popup */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            >
              <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
                {alertMessage.includes('Retrying') && (
                  <div className="flex justify-center mb-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-6 w-6 text-blue-500" />
                    </motion.div>
                  </div>
                )}

                <p className={`text-lg ${alertMessage.includes('Error') || alertMessage.includes('timed out')
                  ? 'text-red-600'
                  : alertMessage.includes('Processing') || alertMessage.includes('Retrying')
                    ? 'text-blue-600'
                    : 'text-green-600'
                  } font-medium mb-4 text-center`}>
                  {alertMessage}
                </p>

                {/* Only show the button for non-processing states */}
                {!alertMessage.includes('Processing') && !alertMessage.includes('Retrying') && (
                  <Button
                    color={
                      alertMessage.includes('Error') || alertMessage.includes('timed out')
                        ? "danger"
                        : "success"
                    }
                    className="w-full"
                    onClick={() => setShowAlert(false)}
                  >
                    OK
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8">
          {/* Title and Description */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Assignment Title</label>
              <input
                type="text"
                placeholder={type === 'mcq' ? "e.g., Geography Quiz" : "e.g., Critical Analysis Essay"}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Assignment Description</label>
              <textarea
                placeholder="Provide instructions for your students"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Time and Date Settings */}
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Time Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="p-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all w-full"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={mainEndTime}
                  onChange={(e) => setMainEndTime(e.target.value)}
                  className="p-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all w-full"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="mt-8">
            <label className="flex items-center text-sm font-semibold mb-2 text-gray-700">
              <Key className="mr-2 h-4 w-4 text-blue-600" />
              Assignment Password
            </label>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all w-full md:w-1/3"
            />
            <p className="mt-1 text-sm text-gray-500">Students will need this password to access the assignment</p>
          </div>

          <div className="mt-8">
            <label className="flex items-center text-sm font-semibold mb-2 text-gray-700">
              <FileText className="mr-2 h-4 w-4 text-blue-600" />
              Intended Batch
            </label>
            <input
              type="number"
              placeholder="Enter Batch (e.g., 2025)"
              value={intendedBatch}
              onChange={(e) => setIntendedBatch(e.target.value)}
              className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all w-full md:w-1/3"
            />
            <p className="mt-1 text-sm text-gray-500">Specify the batch this assignment is intended for (e.g., 2025).</p>
          </div>

          {/* Questions Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-blue-600" />
              {type === 'mcq' ? 'MCQ Questions' : type === 'essay' ? 'Essay Questions' : 'Mixed Questions'}
            </h2>

            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) return;
                const reordered = Array.from(questions);
                const [removed] = reordered.splice(result.source.index, 1);
                reordered.splice(result.destination.index, 0, removed);
                setQuestions(reordered);
              }}
            >
              <Droppable droppableId="questions-droppable">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    <AnimatePresence mode="popLayout">
                      {questions.map((q, qIndex) => (
                        <Draggable key={qIndex} draggableId={qIndex.toString()} index={qIndex}>
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className={`mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'ring-2 ring-blue-400' : ''
                              }`}
                            >
                              {q.type === 'mcq' ? (
                                <>
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-800">MCQ Question {qIndex + 1}</h3>
                                    <motion.button
                                      onClick={() => deleteQuestion(qIndex)}
                                      className="text-red-500 hover:text-red-700 flex items-center space-x-1"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="text-sm">Delete</span>
                                    </motion.button>
                                  </div>

                                  <input
                                    type="text"
                                    placeholder="Enter your question"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                                    value={q.questionText}
                                    onChange={(e) =>
                                      setQuestions((prev) => {
                                        const updated = [...prev];
                                        updated[qIndex].questionText = e.target.value;
                                        return updated;
                                      })
                                    }
                                  />

                                  <div className="space-y-3 mt-4">
                                    <p className="text-sm font-medium text-gray-700">Answer Options:</p>
                                    {q.answers.map((answer, aIndex) => (
                                      <div key={aIndex} className="flex items-center space-x-3">
                                        <input
                                          type="text"
                                          placeholder={`Option ${aIndex + 1}`}
                                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                          value={answer}
                                          onChange={(e) =>
                                            setQuestions((prev) => {
                                              const updated = [...prev];
                                              updated[qIndex].answers[aIndex] = e.target.value;
                                              return updated;
                                            })
                                          }
                                        />
                                        <input
                                          type="checkbox"
                                          checked={q.correct[aIndex]}
                                          onChange={(e) =>
                                            setQuestions((prev) => {
                                              const updated = [...prev];
                                              updated[qIndex].correct[aIndex] = e.target.checked;
                                              return updated;
                                            })
                                          }
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-800">Essay Question {qIndex + 1}</h3>
                                    <motion.button
                                      onClick={() => deleteQuestion(qIndex)}
                                      className="text-red-500 hover:text-red-700 flex items-center space-x-1"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="text-sm">Delete</span>
                                    </motion.button>
                                  </div>

                                  <textarea
                                    placeholder="Enter your essay question here..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all min-h-[100px]"
                                    value={q.questionText}
                                    onChange={(e) =>
                                      setQuestions((prev) => {
                                        const updated = [...prev];
                                        updated[qIndex].questionText = e.target.value;
                                        return updated;
                                      })
                                    }
                                  />

                                  <textarea
                                    placeholder="Provide a model answer for reference..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all min-h-[200px] mt-4"
                                    value={q.answer}
                                    onChange={(e) =>
                                      setQuestions((prev) => {
                                        const updated = [...prev];
                                        updated[qIndex].answer = e.target.value;
                                        return updated;
                                      })
                                    }
                                  />
                                </>
                              )}

                              {/* Add buttons to insert MCQ or Essay below the current question */}
                              {type === 'mcq' && (
                                <div className="mt-4 flex justify-center">
                                  <motion.button
                                    onClick={() => addQuestion('mcq', qIndex)}
                                    className="flex items-center space-x-2 text-green-600 hover:text-green-700 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Add MCQ</span>
                                  </motion.button>
                                </div>
                              )}
                              {type === 'essay' && (
                                <div className="mt-4 flex justify-center">
                                  <motion.button
                                    onClick={() => addQuestion('essay', qIndex)}
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Add Essay</span>
                                  </motion.button>
                                </div>
                              )}
                              {type === 'mixed' && (
                                <div className="mt-4 flex justify-center space-x-4">
                                  <motion.button
                                    onClick={() => addQuestion('mcq', qIndex)}
                                    className="flex items-center space-x-2 text-green-600 hover:text-green-700 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Add MCQ</span>
                                  </motion.button>
                                  <motion.button
                                    onClick={() => addQuestion('essay', qIndex)}
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Add Essay</span>
                                  </motion.button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </AnimatePresence>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Intended Batch */}
          <div className='mt-8'>
            <label className="flex items-center text-sm font-semibold mb-2 text-gray-700">
              <ListChecks className="mr-2 h-4 w-4 text-blue-600" />
              Intended Batch
            </label>
            <input
              type="text"
              placeholder="Enter intended batch (e.g., 2023-2024)"
              value={intendedBatch}
              onChange={(e) => setIntendedBatch(e.target.value)}
              className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all w-full md:w-1/3"
            />
          </div>

          {/* Buttons */}
          <div className="mt-12 flex flex-col md:flex-row gap-4 justify-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                color="danger"
                variant="flat"
                onClick={handleCancel}
                className="flex items-center justify-center w-full md:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                color="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-green-500 text-white flex items-center justify-center w-full md:w-auto"
              >
                {!isSubmitting && <Save className="h-4 w-4 mr-2" />}
                {isSubmitting ? (retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Creating...') : `Create ${type === 'mcq' ? 'Quiz' : 'Essay'}`}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}