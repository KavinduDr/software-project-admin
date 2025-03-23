'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@nextui-org/button';
import { Checkbox } from '@nextui-org/checkbox';
import { Alert } from '@heroui/alert';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';

interface BaseQuestion {
  id: string;
  type: 'mcq' | 'essay';
  questionText: string;
}

interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  answers: string[];
  correct: boolean[];
}

interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  answer: string;
}

type Question = MCQQuestion | EssayQuestion;

export default function QuizForm() {
  const { admin } = useAdmin();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('Test your basic skills');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  const addMCQQuestion = () => {
    const newQuestion: MCQQuestion = {
      id: Date.now().toString(),
      type: 'mcq',
      questionText: '',
      answers: ['', '', '', ''],
      correct: [false, false, false, false],
    };
    setQuestions([...questions, newQuestion]);
  };

  const addEssayQuestion = () => {
    const newQuestion: EssayQuestion = {
      id: Date.now().toString(),
      type: 'essay',
      questionText: '',
      answer: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const insertQuestion = (index: number, type: 'mcq' | 'essay') => {
    const newQuestion = type === 'mcq' 
      ? {
          id: Date.now().toString(),
          type: 'mcq',
          questionText: '',
          answers: ['', '', '', ''],
          correct: [false, false, false, false],
        } as MCQQuestion
      : {
          id: Date.now().toString(),
          type: 'essay',
          questionText: '',
          answer: '',
        } as EssayQuestion;

    setQuestions(prev => [
      ...prev.slice(0, index + 1),
      newQuestion,
      ...prev.slice(index + 1)
    ]);
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, qIndex) => qIndex !== index));
    setAlertMessage(`Deleted question ${index + 1}`);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      setAlertMessage('');
    }, 1000);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const validateForm = () => {
    if (!title.trim()) {
      alert('Quiz title is required.');
      return false;
    }

    for (const question of questions) {
      if (!question.questionText.trim()) {
        alert('All questions must have text.');
        return false;
      }

      if (question.type === 'mcq') {
        if (question.answers.some(answer => !answer.trim())) {
          alert('All MCQ answers must have text.');
          return false;
        }
        if (!question.correct.includes(true)) {
          alert('Each MCQ must have at least one correct answer.');
          return false;
        }
      } else if (question.type === 'essay' && !question.answer.trim()) {
        alert('All essay questions must have an answer.');
        return false;
      }
    }

    if (!password.trim()) {
      alert('Password is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please login.');
        router.push('/login');
        return;
      }

      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:4000' 
        : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;

      const quizData = {
        title,
        description,
        timeLimit: timeLimit.toString(),
        questions: questions.map(q => ({
          type: q.type,
          questionText: q.questionText,
          ...(q.type === 'mcq' ? {
            options: q.answers.map((answer, idx) => ({
              text: answer,
              isCorrect: q.correct[idx],
            })),
          } : {
            answer: q.answer,
          }),
        })),
        teacherId: admin?._id,
        password,
      };

      const response = await axios.post(`${apiUrl}/api/v1/create-mixed-quiz`, quizData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setAlertMessage('Quiz created successfully!');
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        setAlertMessage('');
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error creating quiz:', error);
      setAlertMessage('Failed to create quiz');
      setShowAlert(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">Create Mixed Assignment</h1>

      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Alert description={alertMessage} title="Success" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Assignment Title"
          className="w-full p-4 bg-gray-100 rounded-lg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Assignment Description"
          className="w-full p-4 bg-gray-100 rounded-lg"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Time Limit (Minutes):</label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="p-2 bg-gray-100 rounded-lg"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Password:</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-100 rounded-lg"
          />
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={addMCQQuestion}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add MCQ Question
        </button>
        <button
          onClick={addEssayQuestion}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Add Essay Question
        </button>
      </div>

      {questions.map((question, index) => (
        <div key={question.id}>
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Question {index + 1} ({question.type.toUpperCase()})
              </h2>
              <Button color="danger" variant="ghost" onClick={() => deleteQuestion(index)}>
                Delete Question
              </Button>
            </div>

            <input
              type="text"
              placeholder="Enter Question"
              className="w-full p-4 bg-gray-100 rounded-lg mb-4"
              value={question.questionText}
              onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
            />

            {question.type === 'mcq' && (
              <div className="mt-4 space-y-2">
                {question.answers.map((answer, aIndex) => (
                  <div key={aIndex} className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder={`Answer ${aIndex + 1}`}
                      className="flex-1 p-4 bg-gray-100 rounded-lg"
                      value={answer}
                      onChange={(e) => {
                        const newAnswers = [...question.answers];
                        newAnswers[aIndex] = e.target.value;
                        updateQuestion(index, { answers: newAnswers });
                      }}
                    />
                    <Checkbox
                      isSelected={question.correct[aIndex]}
                      onChange={(e) => {
                        const newCorrect = [...question.correct];
                        newCorrect[aIndex] = e.target.checked;
                        updateQuestion(index, { correct: newCorrect });
                      }}
                    >
                      Correct
                    </Checkbox>
                  </div>
                ))}
              </div>
            )}

            {question.type === 'essay' && (
              <textarea
                placeholder="Model Answer"
                className="w-full p-4 bg-gray-100 rounded-lg mt-4"
                value={question.answer}
                onChange={(e) => updateQuestion(index, { answer: e.target.value })}
              />
            )}
          </div>

          <div className="mt-4 flex gap-4 justify-center border-t pt-4">
            <button
              onClick={() => insertQuestion(index, 'mcq')}
              className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-2"
            >
              <span>+</span> MCQ Question
            </button>
            <button
              onClick={() => insertQuestion(index, 'essay')}
              className="px-4 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-2"
            >
              <span>+</span> Essay Question
            </button>
          </div>
        </div>
      ))}

      <div className="mt-8 flex gap-4">
        <Button color="success" variant="ghost" onClick={handleSubmit}>
          Create
        </Button>
        <Button color="danger" variant="ghost" onClick={() => router.push('/dashboard')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}