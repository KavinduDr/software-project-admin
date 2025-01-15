'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@nextui-org/button';
import { useRouter, useParams } from 'next/navigation';

interface Option {
    text: string;
    isCorrect: boolean;
    _id: string;
}

interface Question {
    questionText: string;
    options: Option[];
    _id: string;
}

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: Question[];
}

export default function EditQuiz() {
    const router = useRouter();
    const { id } = useParams(); // Catch the quiz ID from the URL
    const [editableQuiz, setEditableQuiz] = useState<Quiz | null>(null);

    useEffect(() => {
        const fetchQuiz = async () => {
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
            try {
                const response = await fetch(`${apiUrl}/api/v1/${id}`);

                const data = await response.json();
                setEditableQuiz(data.assignment);
            } catch (error) {
                console.error('Error fetching quiz:', error);
            }
        };

        if (id) {
            fetchQuiz();
        }
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number, optionIndex?: number) => {
        const { name, value, checked, type } = e.target;

        if (editableQuiz) {
            const updatedQuestions = [...editableQuiz.questions];

            if (optionIndex !== undefined) {
                if (name === 'text' || name === 'isCorrect') {
                    updatedQuestions[questionIndex].options[optionIndex] = {
                        ...updatedQuestions[questionIndex].options[optionIndex],
                        [name]: type === 'checkbox' ? checked : value
                    };
                }
            } else if (name === 'questionText') {
                updatedQuestions[questionIndex].questionText = value;
            }

            setEditableQuiz({
                ...editableQuiz,
                questions: updatedQuestions
            });
        }
    };

    const addOption = (questionIndex: number) => {
        if (editableQuiz) {
            const updatedQuestions = [...editableQuiz.questions];
            const newOption: Option = {
                text: '',
                isCorrect: false,
                _id: `${Date.now()}`
            };
            updatedQuestions[questionIndex].options.push(newOption);
            setEditableQuiz({
                ...editableQuiz,
                questions: updatedQuestions
            });
        }
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        if (editableQuiz) {
            const updatedQuestions = [...editableQuiz.questions];
            updatedQuestions[questionIndex].options.splice(optionIndex, 1);
            setEditableQuiz({
                ...editableQuiz,
                questions: updatedQuestions
            });
        }
    };

    const addQuestion = () => {
        if (editableQuiz) {
            const newQuestion: Question = {
                questionText: '',
                options: [{ text: '', isCorrect: false, _id: `${Date.now()}` }],
                _id: `${Date.now()}`
            };
            setEditableQuiz({
                ...editableQuiz,
                questions: [...editableQuiz.questions, newQuestion]
            });
        }
    };

    const removeQuestion = (questionIndex: number) => {
        if (editableQuiz) {
            const updatedQuestions = [...editableQuiz.questions];
            updatedQuestions.splice(questionIndex, 1);
            setEditableQuiz({
                ...editableQuiz,
                questions: updatedQuestions
            });
        }
    };

    const handleSave = async () => {
        if (editableQuiz) {
            // Create a copy of the editableQuiz and omit _id fields from questions and options
            const quizToUpdate = {
                title: editableQuiz.title,
                description: editableQuiz.description,
                questions: editableQuiz.questions.map(({ _id, options, ...restQuestion }) => ({
                    ...restQuestion, // Spread other properties of the question (like questionText)
                    options: options.map(({ _id, ...restOption }) => restOption) // Omit the _id from options
                }))
            };
    
            try {
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
                const response = await fetch(`${apiUrl}/api/v1/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(quizToUpdate) // Send the modified quiz data without _id fields
                });
    
                if (response.ok) {
                    alert('Quiz updated successfully!');
                    router.push('/dashboard');
                } else {
                    alert('Failed to update quiz');
                }
            } catch (error) {
                console.error('Error updating quiz:', error);
            }
        }
    };
    

    const handleGoBack = () => {
        router.push('/dashboard');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-10">
            <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-lg border-2 border-green-500">
                <h1 className="text-3xl font-semibold mb-4 text-center">{editableQuiz ? editableQuiz.title : 'Loading...'}</h1>
                <p className="text-lg mb-6 text-center">{editableQuiz ? editableQuiz.description : 'Loading...'}</p>

                {editableQuiz?.questions.map((question, questionIndex) => (
                    <div key={question._id} className="flex flex-col justify-center mb-6 w-full">
                        <h3 className="text-xl font-semibold mb-2">Question {questionIndex + 1}</h3>
                        <input
                            type="text"
                            name="questionText"
                            value={question.questionText}
                            onChange={(e) => handleInputChange(e, questionIndex)}
                            placeholder="Enter question text"
                            className="w-full h-[58px] p-4 text-xl text-black rounded-lg border-2 border-green-500"
                        />
                        {question.options.map((option, optionIndex) => (
                            <div key={option._id} className="flex items-center mb-2">
                                <input
                                    type="text"
                                    name="text"
                                    value={option.text}
                                    onChange={(e) => handleInputChange(e, questionIndex, optionIndex)}
                                    placeholder="Enter option text"
                                    className="w-full p-2 mr-2 border-2 border-green-400 rounded-md"
                                />
                                <label className="flex items-center justify-between space-x-2">
                                    <input
                                        type="checkbox"
                                        name="isCorrect"
                                        checked={option.isCorrect}
                                        onChange={(e) => handleInputChange(e, questionIndex, optionIndex)}
                                        className="mr-2"
                                    />
                                    <span>Correct Answer</span>
                                </label>
                                <Button className="ml-4" onClick={() => removeOption(questionIndex, optionIndex)}>
                                    Remove Option
                                </Button>
                            </div>
                        ))}
                        <div className="flex space-x-4">
                            <Button onClick={() => addOption(questionIndex)}>Add Option</Button>
                            <Button onClick={() => removeQuestion(questionIndex)}>Remove Question</Button>
                        </div>
                    </div>
                ))}

                <div className="flex space-x-4 justify-center mt-6">
                    <Button onClick={addQuestion}>Add Question</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button onClick={handleGoBack}>Go Back</Button>
                </div>
            </div>
        </div>
    );
}
