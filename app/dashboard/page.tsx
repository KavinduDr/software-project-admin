'use client';

import React, { useEffect, useState } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../components/ui/table";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";
import { useRouter } from 'next/navigation';
import { useAdmin } from '../context/AdminContext';
import { useQuiz } from '../context/QuizContext';
import { useEssay } from '../context/EssayContext';
import {
    PlusCircle,
    Eye,
    Link2,
    Edit,
    Search,
    SortAsc,
    FileText,
    List,
    BookOpen,
    Calendar,
    Clock,
    User,
    UserCheck,
    Award,
    BarChart3,
    Trash2
} from 'lucide-react';
import { toast } from "sonner";

import { motion, AnimatePresence } from "framer-motion";


interface Assignment {
    _id: string;
    title: string;
    questions: { length: number }[];
    createdAt?: string;
}

export default function Page() {
    const router = useRouter();
    const { admin } = useAdmin();
    const [name, setName] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const { setQuiz } = useQuiz();
    const { setEssay } = useEssay();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<'title' | 'questions'>('title');
    const [assignmentType, setAssignmentType] = useState<'quiz' | 'essay'>('quiz');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAssignments: 0,
        totalQuestions: 0,
        recentActivity: 0
    });

    useEffect(() => {
        const fetchAssignments = async () => {
            setIsLoading(true);
            if (admin && admin._id) {
                try {
                    const apiUrl = typeof window !== 'undefined'
                        ? window.location.hostname === 'localhost'
                            ? 'http://localhost:4000'
                            : process.env.NEXT_PUBLIC_DEPLOYMENT_URL
                        : '';

                    const response = await fetch(
                        `${apiUrl}/api/v1/${assignmentType === 'quiz' ? `teacher/${admin._id}` : `essay/teacher/${admin._id}`}`
                    );

                    if (!response || !response.ok) {
                        throw new Error(`Failed to fetch: ${response?.statusText || 'Unknown error'}`);
                    }

                    const data = await response.json();
                    if (data.success) {
                        const fetchedAssignments = assignmentType === 'quiz' ? data.assignments : data.essayAssignments;
                        setAssignments(fetchedAssignments);

                        // Calculate stats
                        const totalQuestions = fetchedAssignments.reduce((acc: any, curr: { questions: string | any[]; }) => acc + curr.questions.length, 0);

                        // Count recent activity (assignments created in the last 30 days)
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentActivity = fetchedAssignments.filter((a: { createdAt: string | number | Date; }) =>
                            a.createdAt && new Date(a.createdAt) > thirtyDaysAgo
                        ).length;

                        setStats({
                            totalAssignments: fetchedAssignments.length,
                            totalQuestions,
                            recentActivity
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch assignments', error);
                    toast.error("Failed to load assignments");
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchAssignments();
    }, [admin, assignmentType]);

    useEffect(() => {
        if (admin?.name) {
            setName(admin.name);
        }
    }, [admin]);

    const fetchQuiz = async (id: string, type: string) => {
        try {
            const apiUrl = typeof window !== 'undefined'
                ? window.location.hostname === 'localhost'
                    ? 'http://localhost:4000'
                    : process.env.NEXT_PUBLIC_DEPLOYMENT_URL
                : '';

            const response = await fetch(`${apiUrl}/api/v1/${type === 'quiz' ? '' : 'essay/'}${id}`);
            const data = await response.json();

            if (data.success) {
                if (type === 'quiz') {
                    setQuiz(data.assignment);
                    router.push('/viewquiz');
                } else {
                    setEssay(data.essayAssignment);
                    router.push('/viewessay');
                }
            }
        } catch (error) {
            console.error('Failed to fetch quiz', error);
            toast.error("Failed to load assignment details");
        }
    };

    const editQuiz = async (id: string) => {
        try {
            const apiUrl = typeof window !== 'undefined'
                ? window.location.hostname === 'localhost'
                    ? 'http://localhost:4000'
                    : process.env.NEXT_PUBLIC_DEPLOYMENT_URL
                : '';

            const response = await fetch(`${apiUrl}/api/v1/${id}`);
            const data = await response.json();

            if (data.success) {
                setQuiz(data.assignment);
                router.push(`/edit/${id}`);
            }
        } catch (error) {
            console.error('Failed to fetch quiz', error);
            toast.error("Failed to load assignment for editing");
        }
    };

    const getQuizLink = (id: string) => {
        const URL = `http://localhost:3001/signin/${id}`;
        navigator.clipboard.writeText(URL)
            .then(() => {
                toast.success("Link copied!", {
                    description: "Assignment link has been copied to clipboard"
                });
            })
            .catch(err => {
                console.error('Failed to copy link: ', err);
                toast.error("Failed to copy", {
                    description: "Please try again"
                });
            });
        return URL;
    };

    const deleteAssignment = async (id: string) => {
        try {
            const apiUrl = typeof window !== 'undefined'
                ? window.location.hostname === 'localhost'
                    ? 'http://localhost:4000'
                    : process.env.NEXT_PUBLIC_DEPLOYMENT_URL
                : '';

            // Correct the API endpoint to match the expected format
            const response = await fetch(`${apiUrl}/api/v1/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Check if the response is OK
            if (!response.ok) {
                throw new Error(`Failed to delete assignment: ${response.statusText}`);
            }

            // Attempt to parse the response as JSON
            let data;
            try {
                data = await response.json();
            } catch (error) {
                console.warn('Response body is empty or invalid JSON:', error);
                data = { success: response.ok }; // Assume success if the response status is OK
            }

            if (data.success) {
                toast.success('Assignment deleted successfully!');
                setAssignments((prev) => prev.filter((assignment) => assignment._id !== id));
            } else {
                throw new Error(data.message || 'Failed to delete assignment');
            }
        } catch (error) {
            console.error('Failed to delete assignment:', error);
            toast.error('Failed to delete assignment. Please try again.');
        }
    };

    const createAssignment = async (assignmentData: any, maxRetries = 3) => {
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                // Determine API URL
                const apiUrl = typeof window !== 'undefined'
                    ? window.location.hostname === 'localhost'
                        ? 'http://localhost:4000'
                        : process.env.NEXT_PUBLIC_DEPLOYMENT_URL
                    : '';
                
                // Log what we're sending and where
                console.log("Creating assignment with data:", JSON.stringify(assignmentData, null, 2));
                console.log("Sending to endpoint:", `${apiUrl}/api/v1/create-assignment`);
                
                // Simple fetch without timeout wrapper for testing
                const response = await fetch(`${apiUrl}/api/v1/create-assignment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(assignmentData),
                    // Don't set a timeout here to see if that's the issue
                });
                
                // If response is not OK, throw error
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
                }
                
                // Parse response data
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.warn("Could not parse response as JSON:", parseError);
                    
                    // If we can't parse JSON but response was OK, assume success
                    if (response.ok) {
                        toast.success('Assignment created successfully!');
                        router.push('/dashboard');
                        return true;
                    } else {
                        throw new Error("Invalid response format from server");
                    }
                }
                
                // Handle successful response
                if (data.success) {
                    toast.success('Assignment created successfully!');
                    router.push('/dashboard');
                    return true;
                } else {
                    throw new Error(data.message || 'Failed to create assignment');
                }
            } catch (error) {
                // Increment retry counter
                retryCount++;
                
                console.error(`Attempt ${retryCount} failed:`, error);
                
                // If we've reached max retries, show error and exit
                if (retryCount >= maxRetries) {
                    toast.error('Failed to create assignment. Please try again.');
                    console.error('Error creating assignment after all retries:', error);
                    return false;
                }
                
                // Wait before retrying (exponential backoff)
                const backoffTime = 1000 * Math.pow(2, retryCount - 1);
                console.log(`Retrying in ${backoffTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                
                toast.info(`Retrying submission (attempt ${retryCount + 1}/${maxRetries})...`);
            }
        }
        
        return false; // Should not reach here, but just in case
    };
    
    // Utility function to add timeout to fetch
    const fetchWithTimeout = (url: string | URL | Request, options: any, timeout = 30000) => { // Increased default timeout to 30 seconds
        return new Promise((resolve, reject) => {
            // Create an abort controller to handle timeouts
            const controller = new AbortController();
            const signal = controller.signal;
            
            // Add the signal to options
            const enhancedOptions = {
                ...options,
                signal,
            };
            
            // Set up the timeout
            const timer = setTimeout(() => {
                controller.abort();
                reject(new Error('Request timed out'));
            }, timeout);
            
            fetch(url, enhancedOptions)
                .then((response) => {
                    clearTimeout(timer);
                    resolve(response);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    if (error.name === 'AbortError') {
                        reject(new Error('Request timed out'));
                    } else {
                        reject(error);
                    }
                });
        });
    };

    const filteredAssignments = Array.isArray(assignments)
        ? assignments
            .filter(assignment =>
                assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                if (sortOption === "title") {
                    return a.title.localeCompare(b.title);
                } else if (sortOption === "questions") {
                    return b.questions.length - a.questions.length;
                }
                return 0;
            })
        : [];
    useEffect(() => {
        localStorage.removeItem('currentBreadcrumbs');
    }, []);
    return (

        <div className="min-h-screen bg-gradient-to-b from-green-50 via-green-50 to-white p-4 md:p-8">
            {/* Decorative elements */}
            <div className="fixed top-20 left-20 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="fixed top-40 right-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="fixed bottom-20 left-1/4 w-56 h-56 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3">
                                <BookOpen className="h-8 w-8 text-white" />

                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
                                <p className="text-gray-600">Manage your assignments and quizzes</p>
                            </div>
                        </div>

                        <Button
                            onClick={() => router.push('/addingquiz')}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                            <PlusCircle className="h-5 w-5 mr-2" />
                            Create New Assignment
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <motion.div
                            whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.2)" }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl p-6 shadow-md border border-green-100"
                        >
                            <div className="flex items-center">
                                <div className="bg-green-100 rounded-xl p-3 mr-4">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Total Assignments</p>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalAssignments}</h3>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.2)" }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl p-6 shadow-md border border-green-100"
                        >
                            <div className="flex items-center">
                                <div className="bg-green-100 rounded-xl p-3 mr-4">
                                    <List className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Total Questions</p>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalQuestions}</h3>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.2)" }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl p-6 shadow-md border border-green-100"
                        >
                            <div className="flex items-center">
                                <div className="bg-green-100 rounded-xl p-3 mr-4">
                                    <Calendar className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Recent Activity</p>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats.recentActivity}</h3>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Profile Section */}
                    <Card className="mb-8 overflow-hidden border-0 shadow-xl rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                <div className="w-full md:w-1/3 bg-gradient-to-br from-green-400 to-emerald-600 p-8 flex flex-col justify-center items-center text-white">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-lg border-2 border-white/40">
                                        <User className="h-12 w-12" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        {name ? name : "Teacher"}
                                    </h2>
                                    <p className="text-green-100 mb-4">Education Professional</p>
                                    <div className="flex items-center space-x-2">
                                        <UserCheck className="h-4 w-4" />
                                        <span>Verified Educator</span>
                                    </div>
                                </div>

                                <div className="w-full md:w-2/3 p-8">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                        <Award className="h-5 w-5 mr-2 text-green-600" />
                                        Educator Dashboard
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Create, manage, and distribute assignments to your students.
                                        Track progress and provide timely feedback.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <FileText className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-800">Assignment Types</h4>
                                                <p className="text-sm text-gray-500">MCQ, Essays, and more</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <Clock className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-800">Time Management</h4>
                                                <p className="text-sm text-gray-500">Set custom time limits</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <Link2 className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-800">Easy Sharing</h4>
                                                <p className="text-sm text-gray-500">Share via link or email</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <BarChart3 className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-800">Analytics</h4>
                                                <p className="text-sm text-gray-500">Track student performance</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Controls Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-green-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <Search className="h-5 w-5 mr-2 text-green-600" />
                            Find Assignments
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="text-gray-400 h-5 w-5" />
                                </div>
                                <Input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search assignments..."
                                    className="pl-10 h-12 rounded-xl border-green-200 focus:border-green-400 focus:ring-green-400"
                                />
                            </div>

                            <Select value={sortOption} onValueChange={(value) => setSortOption(value as 'title' | 'questions')}>
                                <SelectTrigger className="h-12 rounded-xl border-green-200 focus:border-green-400 focus:ring-green-400">
                                    <div className="flex items-center">
                                        <SortAsc className="h-5 w-5 mr-2 text-gray-500" />
                                        <SelectValue placeholder="Sort by..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent
                                    className="bg-white border rounded-xl shadow-lg py-1"
                                    style={{
                                        zIndex: 9999,
                                        position: 'absolute',
                                        minWidth: '200px'
                                    }}
                                >
                                    <SelectItem value="title" className="rounded-lg my-1 hover:bg-green-50">Title</SelectItem>
                                    <SelectItem value="questions" className="rounded-lg my-1 hover:bg-green-50">Number of Questions</SelectItem>
                                </SelectContent>
                            </Select>


                            <Select value={assignmentType} onValueChange={(value) => setAssignmentType(value as 'quiz' | 'essay')}>
                                <SelectTrigger className="h-12 rounded-xl border-green-200 focus:border-green-400 focus:ring-green-400">
                                    <div className="flex items-center">
                                        <FileText className="h-5 w-5 mr-2 text-gray-500" />

                                        <SelectValue placeholder="Assignment type..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent
                                    className="bg-white border rounded-xl shadow-lg py-1"
                                    style={{
                                        zIndex: 9999,
                                        position: 'absolute',
                                        minWidth: '200px'
                                    }}
                                >
                                    <SelectItem value="quiz" className="rounded-lg my-1 hover:bg-green-50">Quiz</SelectItem>
                                    <SelectItem value="essay" className="rounded-lg my-1 hover:bg-green-50">Essay</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Recently Created Assignments */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-green-600" />
                                Recently Created Assignments
                            </h3>
                            {filteredAssignments.length > 3 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        const element = document.getElementById('allAssignmentsTable');
                                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    View All
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {isLoading ? (
                                Array(3).fill(0).map((_, index) => (
                                    <div key={`recent-skeleton-${index}`} className="bg-white rounded-xl p-4 shadow-md border border-green-100 h-32 animate-pulse">
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ))
                            ) : filteredAssignments.length > 0 ? (
                                filteredAssignments
                                    .sort((a, b) => {
                                        // Sort by creation date (newest first)
                                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                        return dateB - dateA;
                                    })
                                    .slice(0, 3) // Changed from 5 to 3
                                    .map((assignment, index) => (
                                        <motion.div
                                            key={`recent-${assignment._id}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.2)" }}
                                            className="bg-white rounded-xl p-5 shadow-md border border-green-100 relative overflow-hidden group"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-bl-3xl -mt-6 -mr-6 flex items-end justify-start p-2 transform rotate-12 group-hover:bg-green-200 transition-colors">
                                                {assignmentType === 'quiz' ? (
                                                    <FileText className="h-5 w-5 text-green-600 transform -rotate-12" />
                                                ) : (
                                                    <BookOpen className="h-5 w-5 text-green-600 transform -rotate-12" />
                                                )}
                                            </div>

                                            <h4 className="font-semibold text-gray-800 mb-2 pr-6 truncate">{assignment.title}</h4>

                                            <div className="flex items-center text-sm text-gray-500 mb-3">
                                                <List className="h-4 w-4 mr-1" />
                                                <span>{assignment.questions.length} questions</span>
                                            </div>

                                            {assignment.createdAt && (
                                                <div className="text-xs text-gray-400 mb-3">
                                                    Created {new Date(assignment.createdAt).toLocaleDateString()}
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2 mt-auto">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => fetchQuiz(assignment._id, assignmentType)}
                                                                className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View Assignment</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => getQuizLink(assignment._id)}
                                                                className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                            >
                                                                <Link2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Share Assignment</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => editQuiz(assignment._id)}
                                                                className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Edit Assignment</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteAssignment(assignment._id)}
                                                                className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Delete Assignment</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </motion.div>
                                    ))
                            ) : (
                                <div className="col-span-3 bg-white rounded-xl p-6 shadow-md border border-green-100 text-center">
                                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No recent assignments found.</p>
                                    <p className="text-gray-400 text-sm mt-1 mb-3">Create your first assignment to see it here.</p>
                                    <Button
                                        onClick={() => router.push('/addingquiz')}
                                        className="bg-green-600 hover:bg-green-700 text-white mx-auto"
                                        size="sm"
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Create Assignment
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100"
                    >
                        <div className="p-6 border-b border-green-100">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                <List className="h-5 w-5 mr-2 text-green-600" />
                                Your Assignments
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-green-50">
                                        <TableHead className="w-[40%] font-semibold text-gray-700">Title</TableHead>
                                        <TableHead className="w-[20%] font-semibold text-gray-700">Questions</TableHead>
                                        <TableHead className="w-[40%] font-semibold text-gray-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(3).fill(0).map((_, index) => (
                                            <TableRow key={`skeleton-${index}`}>
                                                <TableCell>
                                                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3"></div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredAssignments.length > 0 ? (
                                        filteredAssignments.map((assignment, index) => (
                                            <motion.tr
                                                key={assignment._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="border-b border-gray-100 hover:bg-green-50/50 transition-colors"
                                            >
                                                <TableCell className="font-medium text-gray-800 py-4">
                                                    {assignment.title}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                        {assignment.questions.length} questions
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => fetchQuiz(assignment._id, assignmentType)}
                                                            className="flex items-center gap-1 text-gray-700 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300 rounded-lg transition-colors"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            <span>View</span>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => getQuizLink(assignment._id)}
                                                            className="flex items-center gap-1 text-gray-700 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300 rounded-lg transition-colors"
                                                        >
                                                            <Link2 className="h-4 w-4" />
                                                            <span>Share</span>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => editQuiz(assignment._id)}
                                                            className="flex items-center gap-1 text-gray-700 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300 rounded-lg transition-colors"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                            <span>Edit</span>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => deleteAssignment(assignment._id)}
                                                            className="flex items-center gap-1 text-gray-700 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span>Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="h-12 w-12 text-gray-300 mb-3" />
                                                    <p className="text-lg font-medium text-gray-500 mb-1">No assignments found</p>
                                                    <p className="text-gray-400 mb-4">Create your first assignment to get started</p>
                                                    <Button
                                                        onClick={() => router.push('/addingquiz')}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <PlusCircle className="h-4 w-4 mr-2" />
                                                        Create Assignment
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}