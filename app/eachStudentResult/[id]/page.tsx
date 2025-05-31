'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation'; // Import useParams for extracting params from URL

interface Result {
  score: number;
  timeTaken: number;
  submittedAt: string;
  answers: Array<{
    _id: string;
    questionId: string;
    selectedOption: string;
  }>;
}

export default function ViewResult() {
  const router = useRouter();
  const { quizId, studentId } = useParams(); // Use useParams to get quizId and studentId from the URL
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure quizId and studentId are available before making the API call
    if (!quizId || !studentId) return;

    const fetchResults = async () => {
      const token = localStorage.getItem('token');
      let apiUrl;

      if (typeof window !== 'undefined') {
        apiUrl =
          window.location.hostname === 'localhost'
            ? 'http://localhost:4000'
            : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
      }

      try {
        const response = await fetch(`${apiUrl}/api/v1/viewResult/${quizId}/student/${studentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        setResult(data.results); // Store the result
      } catch (error) {
        console.error('Failed to fetch result:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId, studentId]); // Trigger re-fetch if quizId or studentId change

  if (!quizId || !studentId) {
    return <p>Loading...</p>; // Render loading state or wait for parameters
  }

  return (
    <div className="w-full h-full px-8 py-12 bg-white flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Student Result</h1>
      {loading ? (
        <p>Loading result...</p>
      ) : result ? (
        <div className="w-full">
          <h2 className="text-xl mb-4">Results for Student {studentId}</h2>
          <p className="mb-4">Score: {result.score}</p>
          <p className="mb-4">Time Taken: {result.timeTaken.toFixed(2)} minutes</p>
          <p className="mb-4">Submitted At: {new Date(result.submittedAt).toLocaleString()}</p>

          <h3 className="text-lg font-semibold mt-6 mb-4">Answers</h3>
          <ul className="list-none">
            {result.answers.map((answer) => (
              <li key={answer._id} className="mb-2">
                <strong>Question ID:</strong> {answer.questionId} <br />
                <strong>Selected Option ID:</strong> {answer.selectedOption}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No result found.</p>
      )}
      <button
        onClick={() => router.push('/dashboard')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
