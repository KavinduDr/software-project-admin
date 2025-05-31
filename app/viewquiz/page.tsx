'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuiz } from '../context/QuizContext';
import { Button } from '@nextui-org/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import {
  Download,
  ArrowLeft,
  Eye,
  FileSpreadsheet,
  BookOpen,
  User,
  Calendar,
  Clock,
  Check,
  X,
  Share2,
  Printer,
  Info,
  HelpCircle,
  BarChart3,
  Loader,
  Shield,
  Bell,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { motion } from "framer-motion";
import { useAdmin } from '../context/AdminContext';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  createdAt?: string;
  startDate: string;
  endDate: string;
  timeLimit?: number;
  authorName?: string;
  authorId?: string;
  difficulty: string;
  category?: string;
  totalAttempts?: number;
  averageScore?: number;
  questions: {
    questionText: string;
    options: {
      text: string;
      isCorrect: boolean;
      _id: string;
    }[];
  }[];
}

interface QuizStats {
  totalStudents: number;
  completedAttempts: number;
  averageScore: number;
  highestScore: number;
  completionRate: number;
  activeStudents: number;
}

interface Violation {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email?: string;
    registrationNumber?: string;
  };
  quizId: string;
  violation: {
    type: string;
    timestamp: string;
    count?: number;
    key?: string;
  };
  createdAt: string;
}

export default function ViewQuiz() {
  const router = useRouter();
  const { admin } = useAdmin();
  const [name, setName] = useState('');
  const { id } = useParams();
  const { quiz } = useQuiz();
  const [activeTab, setActiveTab] = useState("overview");
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalStudents: 0,
    completedAttempts: 0,
    averageScore: 0,
    highestScore: 0,
    completionRate: 0,
    activeStudents: 0
  });

  // Live violations state
  const [liveViolations, setLiveViolations] = useState<Violation[]>([]);
  const [isViolationsLoading, setIsViolationsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (admin?.name) {
      setName(admin.name);
    }
  }, [admin]);

  // Function to fetch live violations
  const fetchLiveViolations = async () => {
    if (!quiz) return;

    setIsViolationsLoading(true);

    try {
      let apiUrl;
      if (typeof window !== 'undefined') {
        apiUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/v1/violations/${quiz._id}/live?timeWindow=30`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLiveViolations(data.violations);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch live violations:", error);
    } finally {
      setIsViolationsLoading(false);
    }
  };

  // Consolidated useEffect for fetching quiz statistics and violations
  useEffect(() => {
    // Fetch quiz statistics
    const fetchQuizStats = async () => {
      if (!quiz) return;
      
      setIsStatsLoading(true);
    
      try {
        let apiUrl;
        if (typeof window !== 'undefined') {
          apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:4000'
            : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
        }
    
        // Use the endpoint that doesn't require authorization
        const response = await fetch(`${apiUrl}/api/v1/stats/${quiz._id}`);
    
        if (response.ok) {
          const data = await response.json();
          console.log("Stats API response:", data);
          
          // Extract exactly what the API provides
          const activeCount = data.activeCount || 0;
          const completedCount = data.completedCount || 0;
          
          // Calculate the rest ourselves
          const totalStudents = activeCount + completedCount;
          const completionRate = totalStudents > 0 
            ? Math.round((completedCount / totalStudents) * 100) 
            : 0;
    
          // Update stats with what we have and calculated values
          setQuizStats({
            totalStudents: totalStudents,
            completedAttempts: completedCount,
            averageScore: 0, // We don't have this data from the API
            highestScore: 0, // We don't have this data from the API
            completionRate: completionRate,
            activeStudents: activeCount
          });
        } else {
          console.error("Failed to fetch stats, API returned status:", response.status);
          setQuizStats({
            totalStudents: 0,
            completedAttempts: 0,
            averageScore: 0,
            highestScore: 0,
            completionRate: 0,
            activeStudents: 0
          });
        }
      } catch (error) {
        console.error("Error fetching quiz statistics:", error);
        setQuizStats({
          totalStudents: 0,
          completedAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          completionRate: 0,
          activeStudents: 0
        });
      } finally {
        setIsStatsLoading(false);
      }
    };

    const fetchData = async () => {
      await fetchQuizStats();
      if (activeTab === 'monitor') {
        await fetchLiveViolations();
      }
    };

    fetchData();

    // Set up interval to refresh data every 10 seconds for live updates
    const refreshInterval = setInterval(fetchData, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [quiz, activeTab]);

  // Also fetch violations when switching to the monitor tab
  useEffect(() => {
    if (activeTab === 'monitor' && quiz) {
      fetchLiveViolations();
    }
  }, [activeTab, quiz]);

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const handleDownloadExcel = async () => {
    if (!quiz) {
      console.error('Quiz data is not available');
      return;
    }

    const assignmentId = quiz._id;
    const token = localStorage.getItem('token');

    try {
      let apiUrl;
      if (typeof window !== 'undefined') {
        apiUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
      }
      const response = await fetch(`${apiUrl}/api/v1/downloadExcel/${assignmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quiz_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Failed to download Excel:", error);
    }
  };

  const handleFullDownloadExcel = async () => {
    if (!quiz) {
      console.error('Quiz data is not available');
      return;
    }

    const assignmentId = quiz._id;
    const token = localStorage.getItem('token');
    let apiUrl;
    if (typeof window !== 'undefined') {
      apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
    }
    try {
      const response = await fetch(`${apiUrl}/api/v1/downloadFullExcel/${assignmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quiz_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Failed to download Excel:", error);
    }
  };

  const handlePrintQuiz = () => {
    window.print();
  };

  const handleShareQuiz = () => {
    if (!quiz) return;
    const quizUrl = `http://localhost:3001/signin/${quiz._id}`;
    navigator.clipboard.writeText(quizUrl)
      .then(() => {
        // You would use your toast system here
        console.log("Quiz link copied to clipboard");
      })
      .catch(err => {
        console.error("Failed to copy link: ", err);
      });
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  interface DifficultyColors {
    [key: string]: string;
  }

  const getDifficultyColor = (difficulty: string | undefined): string => {
    const difficultyColors: DifficultyColors = {
      easy: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      hard: 'bg-red-100 text-red-700 border-red-200',
    };

    return difficultyColors[difficulty?.toLowerCase() || ''] || 'bg-blue-100 text-blue-700 border-blue-200';
  };

  // Helper functions for violations

  // Group violations by student
  const groupViolationsByStudent = (violations: Violation[]) => {
    return violations.reduce((acc: any, violation) => {
      const studentId = violation.studentId._id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: violation.studentId,
          violations: []
        };
      }
      acc[studentId].violations.push(violation);
      return acc;
    }, {});
  };

  // Get most common violation type
  const getMostCommonViolationType = (violations: Violation[]) => {
    const violationTypes = violations.map(v => v.violation.type);
    const counts = violationTypes.reduce((acc: any, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(counts).length === 0) return null;

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const mostCommonType = getMostCommonViolationType(liveViolations);
  const groupedViolations = groupViolationsByStudent(liveViolations);
  const uniqueStudentCount = Object.keys(groupedViolations).length;

  // Loading skeleton for the entire component
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Loading Quiz...' }]} />
          <Card className="backdrop-blur-sm bg-white/80 border-green-200 shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-[250px]" />
              <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative elements */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="fixed top-40 right-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Breadcrumbs items={[{ label: quiz.title }]} />
          <Card className="backdrop-blur-sm bg-white/90 shadow-xl border border-green-200">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="absolute left-4 hover:bg-green-50 border-0"
                >
                  <ArrowLeft className="h-5 w-5 text-green-600" />
                </Button>
                <div className="text-center mx-auto">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text">
                    {quiz.title}
                  </CardTitle>
                  <div className="flex justify-center gap-2 mt-2">
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {quiz.questions.length} Questions
                    </Badge>
                    {quiz.difficulty && (
                      <Badge variant="outline" className={`${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty}
                      </Badge>
                    )}
                    {quiz.category && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {quiz.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {quiz.description && (
                <CardDescription className="text-center mt-2 text-gray-600">
                  {quiz.description}
                </CardDescription>
              )}
            </CardHeader>

            {/* Enhanced Profile Section */}
            <div className="px-8 pb-6">
              <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6 border border-green-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-green-200 shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${name || 'Teacher'}`} />
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {(name || 'T').charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {name || "Teacher"}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-green-600" />
                          <span>Created: {formatDate(quiz.createdAt)}</span>
                        </div>
                        {quiz.timeLimit && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-green-600" />
                            <span>Time limit: {quiz.timeLimit} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-9 border border-green-200 hover:bg-green-100 text-green-700"
                            onClick={handleShareQuiz}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy quiz link to clipboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-9 border border-green-200 hover:bg-green-100 text-green-700"
                            onClick={handlePrintQuiz}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Print quiz details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-9 border border-green-200 hover:bg-green-100 text-green-700"
                            onClick={() => router.push(`/edit/${quiz._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit this quiz</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
            {/* Add this component below the profile section and above the Stats Summary in ViewQuiz.tsx */}
            {/* Place it inside your main content area, around line ~450 */}

            {/* Quiz Status Banner */}
            <div className="px-8 pb-6">
              <div className={`rounded-xl p-6 border shadow-sm flex items-center justify-between ${new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate)
                ? 'bg-green-50 border-green-300'
                : new Date() < new Date(quiz.startDate)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-3 ${new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate)
                    ? 'bg-green-100'
                    : new Date() < new Date(quiz.startDate)
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                    }`}>
                    {new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate) && (
                      <div className="relative">
                        <Clock className={`h-6 w-6 text-green-600`} />
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                      </div>
                    )}
                    {new Date() < new Date(quiz.startDate) && (
                      <Calendar className="h-6 w-6 text-blue-600" />
                    )}
                    {new Date() > new Date(quiz.endDate) && (
                      <Check className="h-6 w-6 text-gray-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate)
                          ? 'Quiz is LIVE'
                          : new Date() < new Date(quiz.startDate)
                            ? 'Quiz is Upcoming'
                            : 'Quiz is Completed'}
                      </h3>
                      <Badge className={`
            ${new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate)
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : new Date() < new Date(quiz.startDate)
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }
          `}>
                        {new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate)
                          ? 'Active Now'
                          : new Date() < new Date(quiz.startDate)
                            ? 'Scheduled'
                            : 'Ended'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>
                          <span className="font-medium">Start:</span> {formatDate(quiz.startDate)}
                          {quiz.startDate && new Date(quiz.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>
                          <span className="font-medium">End:</span> {formatDate(quiz.endDate)}
                          {quiz.endDate && new Date(quiz.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate) && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            {(() => {
                              const now = new Date();
                              const end = new Date(quiz.endDate);
                              const diffMs = end.getTime() - now.getTime();
                              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              return `${diffHrs}h ${diffMins}m remaining`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {new Date() > new Date(quiz.startDate) && new Date() < new Date(quiz.endDate) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="border-green-200 bg-white text-green-700 hover:bg-green-50"
                            onClick={handleShareQuiz}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Now
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Share this quiz with students</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {new Date() < new Date(quiz.startDate) && (
                    <div className="text-blue-600 font-medium text-right">
                      Starts in {(() => {
                        const now = new Date();
                        const start = new Date(quiz.startDate);
                        const diffMs = start.getTime() - now.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                        if (diffDays > 0) {
                          return `${diffDays}d ${diffHrs}h`;
                        } else {
                          return `${diffHrs}h ${diffMins}m`;
                        }
                      })()}
                    </div>
                  )}

                  {new Date() > new Date(quiz.endDate) && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600">
                      Ended {(() => {
                        const now = new Date();
                        const end = new Date(quiz.endDate);
                        const diffMs = now.getTime() - end.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                        if (diffDays === 0) {
                          return 'today';
                        } else if (diffDays === 1) {
                          return 'yesterday';
                        } else if (diffDays < 7) {
                          return `${diffDays} days ago`;
                        } else if (diffDays < 30) {
                          return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
                        } else {
                          return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
                        }
                      })()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Stats Summary */}
            <div className="px-8 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Live Active Sessions Card */}
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-yellow-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="bg-yellow-100 rounded-lg p-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-600 flex items-center">
                      Live
                      {isStatsLoading && (
                        <div className="ml-2 h-3 w-3 rounded-full bg-yellow-500 animate-pulse"></div>
                      )}
                    </Badge>
                  </div>
                  {isStatsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <h4 className="text-2xl font-bold text-gray-800">{quizStats.activeStudents}</h4>
                  )}
                  <p className="text-sm text-gray-500">Currently taking</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="bg-green-100 rounded-lg p-2">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center">
                      Students
                      {isStatsLoading && (
                        <div className="ml-2 h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                      )}
                    </Badge>
                  </div>
                  {isStatsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <h4 className="text-2xl font-bold text-gray-800">{quizStats.totalStudents}</h4>
                  )}
                  <p className="text-sm text-gray-500">Total students</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Check className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 flex items-center">
                      Completion
                      {isStatsLoading && (
                        <div className="ml-2 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                    </Badge>
                  </div>
                  {isStatsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <h4 className="text-2xl font-bold text-gray-800">{quizStats.completedAttempts}</h4>
                  )}
                  <p className="text-sm text-gray-500">Completed attempts</p>
                </motion.div>
              </div>
            </div>

            <Separator className="bg-green-100" />

            {/* Tabs Section */}
            <div className="px-8 pt-6">
              <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-6">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                    <Info className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Questions
                  </TabsTrigger>
                  <TabsTrigger value="monitor" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                    <Shield className="h-4 w-4 mr-2" />
                    Monitor
                  </TabsTrigger>
                  <TabsTrigger value="results" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-2 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Quiz Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Description</h4>
                              <p className="text-gray-700">{quiz.description || "No description provided"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Created</h4>
                                <p className="text-gray-700">{formatDate(quiz.createdAt)}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Time Limit</h4>
                                <p className="text-gray-700">{quiz.timeLimit ? `${quiz.timeLimit} minutes` : "No limit"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Questions</h4>
                                <p className="text-gray-700">{quiz.questions.length}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                                <p className="text-gray-700">{quiz.category || "Uncategorized"}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Completion Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Progress</span>
                              {isStatsLoading ? (
                                <Skeleton className="h-4 w-16" />
                              ) : (
                                <span className="text-sm font-medium">{quizStats.completionRate}%</span>
                              )}
                            </div>
                            {isStatsLoading ? (
                              <Skeleton className="h-2 w-full" />
                            ) : (
                              <Progress value={quizStats.completionRate} className="h-2" />
                            )}
                            <p className="text-sm text-gray-500 mt-2">
                              {isStatsLoading ? (
                                <Skeleton className="h-4 w-full" />
                              ) : (
                                `${quizStats.completedAttempts} out of ${quizStats.totalStudents} students have completed this quiz.`
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start border border-green-200 hover:bg-green-100 text-green-700 mb-2"
                              onClick={handleDownloadExcel}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Results
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start border border-green-200 hover:bg-green-100 text-green-700 mb-2"
                              onClick={handleFullDownloadExcel}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Full Results
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start border border-green-200 hover:bg-green-100 text-green-700"
                              onClick={handleShareQuiz}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share Quiz
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Quiz ID</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                            {quiz._id}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Use this ID when reporting issues or requesting support.</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="questions" className="mt-0">
                  <CardContent className="p-0">
                    <ScrollArea className="h-[60vh] rounded-lg border border-green-200 bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-green-50 to-green-100">
                            <TableHead className="w-[50px] font-semibold text-green-700">No.</TableHead>
                            <TableHead className="font-semibold text-green-700">Question</TableHead>
                            <TableHead className="font-semibold text-green-700">Options</TableHead>
                            <TableHead className="w-[120px] font-semibold text-green-700 text-center">Correct Answer</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quiz.questions.map((question, index) => (
                            <TableRow key={index} className="hover:bg-green-50/50 transition-colors">
                              <TableCell className="font-medium text-green-600">
                                {index + 1}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {question.questionText}
                              </TableCell>
                              <TableCell className="max-w-xl">
                                <div className="grid grid-cols-1 gap-2">
                                  {question.options.map((option) => (
                                    <div
                                      key={option._id}
                                      className={`p-2 rounded-md text-sm ${option.isCorrect
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                                        }`}
                                    >
                                      {option.text}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {question.options.find(opt => opt.isCorrect)?.text}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </TabsContent>

                {/* Monitor Tab - New Addition */}
                <TabsContent value="monitor" className="mt-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-amber-600" />
                        Live Student Monitoring
                      </h3>
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 flex items-center gap-1">
                        <Bell className="h-4 w-4" />
                        {isViolationsLoading ? (
                          <span className="flex items-center">
                            Updating
                            <span className="ml-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                          </span>
                        ) : (
                          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                        )}
                      </Badge>
                    </div>

                    {/* Monitoring Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      <Card className="border border-amber-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-600">Active Violations</h4>
                            <Badge variant="outline" className="bg-amber-50 text-amber-600">
                              {liveViolations.length}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <div className="text-2xl font-bold text-amber-600">
                              {liveViolations.length}
                            </div>
                            <div className="text-sm text-gray-500">
                              across {uniqueStudentCount} students
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-amber-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-600">Students with Violations</h4>
                            <Badge variant="outline" className="bg-amber-50 text-amber-600">
                              {uniqueStudentCount}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <div className="text-2xl font-bold text-amber-600">
                              {quizStats.activeStudents > 0 ? Math.round((uniqueStudentCount / quizStats.activeStudents) * 100) : 0}%
                            </div>
                            <div className="text-sm text-gray-500">
                              of active students
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-amber-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-600">Most Common Violation</h4>
                          </div>
                          <div className="mt-2">
                            {mostCommonType ? (
                              <>
                                <div className="text-lg font-bold text-gray-800">{mostCommonType}</div>
                                <div className="text-sm text-gray-500">
                                  {liveViolations.filter(v => v.violation.type === mostCommonType).length} occurrences
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-500">No violations detected</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Students with Violations List */}
                    <Card className="border border-amber-200 shadow-sm mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          Students with Active Violations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          {Object.keys(groupedViolations).length === 0 ? (
                            <div className="text-center py-8">
                              <Shield className="mx-auto h-10 w-10 text-gray-300" />
                              <p className="mt-2 text-gray-500">No violations detected</p>
                            </div>
                          ) : (
                            Object.values(groupedViolations).map((data: any, index: number) => (
                              <Collapsible key={data.student._id} className="mb-3">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-gray-200">
                                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${data.student.name}`} />
                                          <AvatarFallback className="bg-amber-50 text-amber-600">
                                            {data.student.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <h4 className="font-medium text-gray-800">{data.student.name}</h4>
                                          <div className="flex flex-col text-sm">
                                            {data.student.registrationNumber && (
                                              <span className="text-amber-600 font-medium">Reg: {data.student.registrationNumber}</span>
                                            )}
                                            {data.student.email && (
                                              <span className="text-gray-500">{data.student.email}</span>
                                            )}
                                            {!data.student.email && !data.student.registrationNumber && (
                                              <span className="text-gray-500">ID: {data.student._id.substring(0, 8)}...</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-amber-50 text-amber-600">
                                          {data.violations.length} Violations
                                        </Badge>
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-100">
                                            <TableHead className="w-[180px]">Time</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Details</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {data.violations.sort((a: Violation, b: Violation) =>
                                            new Date(b.violation.timestamp).getTime() - new Date(a.violation.timestamp).getTime()
                                          ).map((violation: Violation, vIndex: number) => (
                                            <TableRow key={vIndex}>
                                              <TableCell className="text-sm">
                                                {new Date(violation.violation.timestamp).toLocaleTimeString()}
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant="outline" className="bg-amber-50 text-amber-600">
                                                  {violation.violation.type}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-sm">
                                                {violation.violation.key && <span>Key: {violation.violation.key}</span>}
                                                {violation.violation.count && <span>Count: {violation.violation.count}</span>}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                      <div className="mt-4 flex justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => router.push(`/viewResult/${quiz._id}/student/${data.student._id}`)}
                                          className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          View Student
                                        </Button>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ))
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={fetchLiveViolations}
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        Refresh Data
                      </Button>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <div className="text-center p-12">
                    <Button
                      variant="solid"
                      onClick={() => router.push(`/viewResult/${quiz._id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Results
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">
                      View comprehensive student performance analytics and individual responses
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Separator className="bg-green-100 mt-6" />


          </Card>
        </motion.div>
      </div>
    </div>
  );
}