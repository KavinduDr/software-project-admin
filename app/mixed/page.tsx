'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Save, X, ListChecks, Edit3, HelpCircle, ChevronDown, CheckCircle } from 'lucide-react';

export default function MixedForm() {
  const [questions, setQuestions] = useState([
    { type: 'mcq', questionText: '', answers: ['', '', '', ''], correct: [false, false, false, false] },
    { type: 'essay', questionText: '', answer: '' },
  ]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [type, setType] = useState('mcq'); // Default to 'mcq'
  const router = useRouter();

  const addQuestion = (type, afterIndex = null) => {
    const newQuestion =
      type === 'mcq'
        ? { type: 'mcq', questionText: '', answers: ['', '', '', ''], correct: [false, false, false, false] }
        : { type: 'essay', questionText: '', answer: '' };

    if (afterIndex === null) {
      setQuestions([...questions, newQuestion]);
    } else {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(afterIndex + 1, 0, newQuestion);
      setQuestions(updatedQuestions);
    }
  };

  const confirmDeleteQuestion = (index) => {
    setDeleteIndex(index);
    setShowDeletePopup(true);
  };

  const deleteQuestion = () => {
    setQuestions((prev) => prev.filter((_, qIndex) => qIndex !== deleteIndex));
    setShowDeletePopup(false);
    setDeleteIndex(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

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

    const payload = {
      title,
      description,
      questions: formattedQuestions,
    };

    console.log('Submitting Mixed Assignment:', payload);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/dashboard');
    }, 2000);
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
              <PlusCircle className="mr-3 h-6 w-6" />
              Create Mixed Assignment
            </h1>
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
                    {/* MCQ Option */}
                    <motion.button
                      whileHover={{ backgroundColor: '#e6f7ff' }}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-2 ${
                        type === 'mcq' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 bg-white'
                      }`}
                      onClick={() => {
                        router.push('/addingquiz'); // Navigate to MCQ form in addingquiz/page.tsx
                        setShowDropdown(false);
                      }}
                    >
                      <ListChecks className={`h-5 w-5 ${type === 'mcq' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span>Multiple Choice</span>
                      {type === 'mcq' && <CheckCircle className="h-4 w-4 ml-auto text-blue-600" />}
                    </motion.button>

                    {/* Essay Option */}
                    <motion.button
                      whileHover={{ backgroundColor: '#e6f7ff' }}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-2 ${
                        type === 'essay' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 bg-white'
                      }`}
                      onClick={() => {
                        router.push('/addingquiz'); // Navigate to Essay form in addingquiz/page.tsx
                        setShowDropdown(false);
                      }}
                    >
                      <Edit3 className={`h-5 w-5 ${type === 'essay' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span>Essay</span>
                      {type === 'essay' && <CheckCircle className="h-4 w-4 ml-auto text-blue-600" />}
                    </motion.button>

                    {/* Mixed Option */}
                    <motion.button
                      whileHover={{ backgroundColor: '#e6f7ff' }}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-2 ${
                        type === 'mixed' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 bg-white'
                      }`}
                      onClick={() => {
                        setType('mixed'); // Stay on the current Mixed page
                        setShowDropdown(false);
                      }}
                    >
                      <HelpCircle className={`h-5 w-5 ${type === 'mixed' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span>Mixed</span>
                      {type === 'mixed' && <CheckCircle className="h-4 w-4 ml-auto text-blue-600" />}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Title and Description */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Assignment Title</label>
              <input
                type="text"
                placeholder="Enter assignment title"
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

          {/* Questions Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800">Questions</h2>

            <AnimatePresence>
              {questions.map((q, qIndex) => (
                <motion.div
                  key={qIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      {q.type === 'mcq' ? `MCQ Question ${qIndex + 1}` : `Essay Question ${qIndex + 1}`}
                    </h3>
                    <motion.button
                      onClick={() => confirmDeleteQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700 flex items-center space-x-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm">Delete</span>
                    </motion.button>
                  </div>

                  {q.type === 'mcq' ? (
                    <>
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
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
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

                  <div className="mt-4 flex justify-center space-x-4">
                    <motion.button
                      onClick={() => addQuestion('mcq', qIndex)}
                      className="flex items-center space-x-2 text-green-600 hover:text-green-700 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Add MCQ</span>
                    </motion.button>
                    <motion.button
                      onClick={() => addQuestion('essay', qIndex)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Add Essay</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <div className="mt-12 flex justify-end space-x-4">
            <motion.button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              className="flex items-center space-x-2 text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Create Mixed Assignment'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Are you sure you want to delete this question?</h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeletePopup(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={deleteQuestion}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}