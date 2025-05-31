'use client'
import React, { createContext, useContext, useState } from "react"

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
    startDate: string;
    endDate: string;
    timeLimit: number;
    createdAt: string;
    updatedAt: string;
}

interface EssayContextType {
    essay: Essay | null;
    setEssay: React.Dispatch<React.SetStateAction<Essay | null>>;
}

const EssayContext = createContext<EssayContextType | undefined>(undefined);

export const useEssay = () => {
    const context = useContext(EssayContext);
    if (!context) {
        throw new Error('useEssay must be used within a EssayProvider');
    }
    return context;
};

export const EssayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [essay, setEssay] = useState<Essay | null>(null);

    return (
        <EssayContext.Provider value={{ essay, setEssay }}>
            {children}
        </EssayContext.Provider>
    );
};