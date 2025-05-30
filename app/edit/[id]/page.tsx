'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { PlusCircle, MinusCircle, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
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
    const { id } = useParams();
    const [editableQuiz, setEditableQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            setIsLoading(true);
            let apiUrl;
            if (typeof window !== 'undefined') {
                apiUrl = window.location.hostname === 'localhost' 
                    ? 'http://localhost:4000' 
                    : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
            }
            try {
                const response = await fetch(`${apiUrl}/api/v1/${id}`);
                const data = await response.json();
                setEditableQuiz(data.assignment);
            } catch (error) {
                console.error('Error fetching quiz:', error);
                toast.error('Failed to load quiz');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchQuiz();
        }
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number, optionIndex?: number) => {
        if (!editableQuiz) return;
        
        const { name, value, checked, type } = e.target;
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
    };

    const addOption = (questionIndex: number) => {
        if (!editableQuiz) return;
        
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
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        if (!editableQuiz) return;
        
        const updatedQuestions = [...editableQuiz.questions];
        updatedQuestions[questionIndex].options.splice(optionIndex, 1);
        setEditableQuiz({
            ...editableQuiz,
            questions: updatedQuestions
        });
    };

    const addQuestion = () => {
        if (!editableQuiz) return;
        
        const newQuestion: Question = {
            questionText: '',
            options: [{ text: '', isCorrect: false, _id: `${Date.now()}` }],
            _id: `${Date.now()}`
        };
        setEditableQuiz({
            ...editableQuiz,
            questions: [...editableQuiz.questions, newQuestion]
        });
    };

    const removeQuestion = (questionIndex: number) => {
        if (!editableQuiz) return;
        
        const updatedQuestions = [...editableQuiz.questions];
        updatedQuestions.splice(questionIndex, 1);
        setEditableQuiz({
            ...editableQuiz,
            questions: updatedQuestions
        });
    };

    const handleSave = async () => {
        if (!editableQuiz) return;
        
        setIsSaving(true);
        const quizToUpdate = {
            title: editableQuiz.title,
            description: editableQuiz.description,
            questions: editableQuiz.questions.map(({ _id, options, ...restQuestion }) => ({
                ...restQuestion,
                options: options.map(({ _id, ...restOption }) => restOption)
            }))
        };

        try {
            let apiUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:4000' 
                : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
                
            const response = await fetch(`${apiUrl}/api/v1/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizToUpdate)
            });

            if (response.ok) {
                toast.success('Quiz updated successfully!');
                router.push('/dashboard');
            } else {
                toast.error('Failed to update quiz');
            }
        } catch (error) {
            console.error('Error updating quiz:', error);
            toast.error('Error updating quiz');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <Breadcrumbs items={[{ label: 'Loading Quiz...' }]} />
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            {editableQuiz && (
                    <Breadcrumbs 
                        items={[
                            { label: editableQuiz.title, href: '/viewquiz' },
                            { label: 'Edit' }
                        ]} 
                    />
                )}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl">{editableQuiz?.title}</CardTitle>
                    <CardDescription className="text-lg">{editableQuiz?.description}</CardDescription>
                </CardHeader>
            </Card>

            {editableQuiz?.questions.map((question, questionIndex) => (
                <Card key={question._id} className="mb-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">Question {questionIndex + 1}</CardTitle>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeQuestion(questionIndex)}
                        >
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input
                                name="questionText"
                                value={question.questionText}
                                onChange={(e) => handleInputChange(e, questionIndex)}
                                placeholder="Enter your question"
                                className="text-lg"
                            />
                            
                            <div className="space-y-3">
                                {question.options.map((option, optionIndex) => (
                                    <div key={option._id} className="flex items-center space-x-4">
                                        <Input
                                            name="text"
                                            value={option.text}
                                            onChange={(e) => handleInputChange(e, questionIndex, optionIndex)}
                                            placeholder={`Option ${optionIndex + 1}`}
                                        />
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`correct-${questionIndex}-${optionIndex}`}
                                                name="isCorrect"
                                                checked={option.isCorrect}
                                                onCheckedChange={(checked) => 
                                                    handleInputChange(
                                                        { target: { name: 'isCorrect', type: 'checkbox', checked: checked as boolean } } as any,
                                                        questionIndex,
                                                        optionIndex
                                                    )
                                                }
                                            />
                                            <Label htmlFor={`correct-${questionIndex}-${optionIndex}`}>
                                                Correct
                                            </Label>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeOption(questionIndex, optionIndex)}
                                        >
                                            <MinusCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            
                            <Button
                                variant="outline"
                                onClick={() => addOption(questionIndex)}
                                className="w-full"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Option
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <div className="flex flex-col space-y-4 mt-8">
                <Button onClick={addQuestion} variant="outline" className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Question
                </Button>

                <Separator className="my-4" />

                <div className="flex space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        className="w-full"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="w-full"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}