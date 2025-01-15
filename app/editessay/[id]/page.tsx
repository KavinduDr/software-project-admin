'use client'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Question {
    questionText: string;
    _id: string;
    answer: string;
}

interface Essay {
    _id: string;
    title: string;
    description: string;
    questions: Question[];
    teacherId: string;
    timeLimit: number;
}



const page = () => {
    const { id } = useParams(); // Catch the quiz ID from the URL
    const router = useRouter();
    const [editableEssay, setEditableEssay] = useState<Essay | null>(null);

    useEffect(() => {
        const fetchEssay = async () => {
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
                const response = await fetch(`${apiUrl}/api/v1/essay/${id}`);

                const data = await response.json();
                setEditableEssay(data.essayAssignment);
                console.log(data.essayAssignment);
            } catch (error) {
                console.error('Error fetching quiz:', error);
            }
        };
        if (id) {
            fetchEssay();
        }
    })

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-10">
            <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-lg border-2 border-green-500">
                <h1 className="text-3xl font-semibold mb-4 text-center">{editableEssay ? editableEssay.title : 'Loading...'}</h1>
                <p className="text-lg mb-6 text-center">{editableEssay ? editableEssay.description : 'Loading...'}</p>

                {editableEssay?.questions.map((question, questionIndex) => (
                    <div key={question._id} className="flex flex-col justify-center mb-6 w-full">
                    <h3 className="text-xl font-semibold mb-2">Question {questionIndex + 1}</h3>
                    <input
                        type="text"
                        name="questionText"
                        value={question.questionText}
                        // onChange={(e) => handleInputChange(e, questionIndex)}
                        placeholder="Enter question text"
                        className="w-full h-[58px] p-4 text-xl text-black rounded-lg border-2 border-green-500"
                    />
                    <input
                        type="text"
                        name="answer"
                        value={question.answer}
                        // onChange={(e) => handleInputChange(e, questionIndex)}
                        placeholder="Enter answer"
                        className="w-full h-[88px] p-4 text-xl text-black rounded-lg border-2 border-green-500"
                    />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default page