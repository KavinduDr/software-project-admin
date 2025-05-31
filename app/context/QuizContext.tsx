'use client'; // Add this at the top

import React, { createContext, useContext, useState } from "react";

interface QuestionOption {
    text: string;
    isCorrect: boolean;
    _id: string;
}

interface Question {
    questionText: string;
    options: QuestionOption[];
    _id: string;
}

interface Quiz {
    _id: string;
    title: string;
    difficulty: string;
    category: string;
    startDate: string;
    endDate: string;
    description: string;
    questions: Question[];
    teacherId: string;
    timeLimit: number;
    createdAt: string;
    updatedAt: string;
}

interface QuizContextType {
    quiz: Quiz | null;
    setQuiz: React.Dispatch<React.SetStateAction<Quiz | null>>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const useQuiz = () => {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within a QuizProvider');
    }
    return context;
};

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);

    return (
        <QuizContext.Provider value={{ quiz, setQuiz }}>
            {children}
        </QuizContext.Provider>
    );
};
