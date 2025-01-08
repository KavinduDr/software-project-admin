'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@nextui-org/button';
import { Checkbox } from '@nextui-org/checkbox';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';

export default function QuizForm() {
  const { admin } = useAdmin();
  const [type, setType] = useState('mcq'); // Track the assignment type
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('Test your basic skills');
  const [questions, setQuestions] = useState([
    { questionText: '', answers: ['', '', '', ''], correct: [false, false, false, false] },
  ]);
  const [essayQuestion, setEssayQuestion] = useState({ questionText: '', answer: '' });
  const [timeLimit, setTimeLimit] = useState(30);
  const [password, setPassword] = useState('');
  const router = useRouter();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', answers: ['', '', '', ''], correct: [false, false, false, false] },
    ]);
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const handleSubmit = async () => {
    const validateForm = () => {
      if (!title.trim()) {
        alert('Quiz title is required.');
        return false;
      }
      if (type === 'mcq') {
        if (questions.some((q) => !q.questionText.trim())) {
          alert('Each question must have text.');
          return false;
        }
        if (questions.some((q) => q.answers.some((answer) => !answer.trim()))) {
          alert('All answers must have text.');
          return false;
        }
        if (questions.some((q) => !q.correct.includes(true))) {
          alert('Each question must have at least one correct answer.');
          return false;
        }
      } else if (type === 'essay') {
        if (!essayQuestion.questionText.trim() || !essayQuestion.answer.trim()) {
          alert('Essay question and answer are required.');
          return false;
        }
      }
      if (!password.trim()) {
        alert('Password is required.');
        return false;
      }
      return true;
    };

    if (!validateForm()) return;

    const quizData = {
      type,
      title,
      description,
      timeLimit: type === 'mcq' ? timeLimit.toString() : timeLimit.toString(),
      questions:
        type === 'mcq'
          ? questions.map((q) => ({
            questionText: q.questionText,
            options: q.answers.map((answer, idx) => ({
              text: answer,
              isCorrect: q.correct[idx],
            })),
          }))
          : [essayQuestion],
      teacherId: admin?._id,
      password,
    };

    // const essayData = {
    //   type,
    //   title,
    //   description,
    //   timeLimit: type === 'essay'? timeLimit.toString() : undefined,
    //   questions: [essayQuestion],
    //   teacherId: admin?._id,
    //   password,
    // }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please login.');
        router.push('/login');
        return;
      }

      console.log(quizData);

      let apiUrl;
      // Determine the correct API URL based on the hostname
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost') {
          apiUrl = 'http://localhost:4000';
        } else {
          apiUrl = process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
          console.log('Deployment URL:', apiUrl);
        }
      }

      if (type === 'mcq') {
        const response = await axios.post(`${apiUrl}/api/v1/create-assignment`, quizData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        alert('Assignment created successfully!');
        router.push('/dashboard');
      } else {
        const response = await axios.post(`${apiUrl}/api/v1/essay/create`, quizData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        alert('Assignment created successfully!');
        router.push('/dashboard');
      }

      // const response = await axios.post('http://localhost:4000/api/v1/create-assignment', quizData, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // alert('Assignment created successfully!');
      // router.push('/dashboard');
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-6">Create an Assignment</h1>
        <div className="flex items-center gap-4">
          <label className="block text-sm font-semibold">Type</label>
          <select
            name="type"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <option value="mcq">MCQ</option>
            <option value="essay">Essay</option>
          </select>
        </div>
      </div>

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

      {type === 'mcq' &&
        questions.map((q, qIndex) => (
          <div key={qIndex} className="mt-8">
            <h2 className="text-xl font-semibold">Question {qIndex + 1}</h2>
            <input
              type="text"
              placeholder="Enter Question"
              className="w-full p-4 bg-gray-100 rounded-lg"
              value={q.questionText}
              onChange={(e) =>
                setQuestions((prev) => {
                  const updated = [...prev];
                  updated[qIndex].questionText = e.target.value;
                  return updated;
                })
              }
            />
            <div className="mt-4 space-y-2">
              {q.answers.map((answer, aIndex) => (
                <div key={aIndex} className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder={`Answer ${aIndex + 1}`}
                    className="flex-1 p-4 bg-gray-100 rounded-lg"
                    value={answer}
                    onChange={(e) =>
                      setQuestions((prev) => {
                        const updated = [...prev];
                        updated[qIndex].answers[aIndex] = e.target.value;
                        return updated;
                      })
                    }
                  />
                  <Checkbox
                    isSelected={q.correct[aIndex]}
                    onChange={(e) =>
                      setQuestions((prev) => {
                        const updated = [...prev];
                        updated[qIndex].correct[aIndex] = e.target.checked;
                        return updated;
                      })
                    }
                  >
                    Correct
                  </Checkbox>
                </div>
              ))}
            </div>
          </div>
        ))}

      {type === 'essay' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Essay Question</h2>
          <input
            type="text"
            placeholder="Enter Question"
            className="w-full p-4 bg-gray-100 rounded-lg"
            value={essayQuestion.questionText}
            onChange={(e) => setEssayQuestion({ ...essayQuestion, questionText: e.target.value })}
          />
          <textarea
            placeholder="Enter Answer"
            className="w-full p-4 bg-gray-100 rounded-lg mt-4"
            value={essayQuestion.answer}
            onChange={(e) => setEssayQuestion({ ...essayQuestion, answer: e.target.value })}
          />
        </div>
      )}

      <div className="mt-8">
        <label className="block text-sm font-semibold mb-2">Password:</label>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 bg-gray-100 rounded-lg"
        />
      </div>

      {type === 'mcq' && (
        <button
          onClick={addQuestion}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mt-4"
        >
          Add More Questions
        </button>
      )}

      <div className="mt-8 flex gap-4">
        <Button color="success" variant="ghost" onClick={handleSubmit}>
          Create
        </Button>
        <Button color="danger" variant="ghost" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
