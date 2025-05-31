'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Trophy, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  TvMinimalIcon,
  User,
  Calendar,
  ClipboardList,
  Eye,
  BarChart3,
  BadgeCheck,
  Shield,
  Activity,
  Flag,
  Zap,
  FileClock,
  Filter,
  Printer,
  Download,
  Share2
} from 'lucide-react';
import { useQuiz } from '../../../../context/QuizContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Separator } from '../../../../components/ui/separator';
import { Button } from '../../../../components/ui/button';
import { Progress } from '../../../../components/ui/progress';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../../../components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs';
interface Answer {
  questionId: string;
  selectedOption: string;
  selectedOptionText: string;
  questionText: string;
  _id: string;
  isCorrect?: boolean; 
}

interface QuizResult {
  score: number;
  timeTaken: number;
  answers: Answer[];
  submittedAt: string;
  studentName?: string;
  studentId?: string;
}

interface Violation {
  type: string;
  timestamp: Date;
  count?: number;
  key?: string;
}

interface ViolationData {
  _id: string;
  studentId: string;
  quizId: string;
  violation: Violation;
  createdAt: Date;
}

export default function ViewResult() {
  const { id, sid } = useParams();
  const { quiz } = useQuiz();
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [mcqData, setMcqData] = useState<Answer[]>([]);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [showAllViolations, setShowAllViolations] = useState(false);
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState('answers');
  const [regNum, setRegNum] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState({
    name: 'Student',
    email: '',
    id: sid,
    registrationNumber:'',
  });
  const INITIAL_DISPLAY_COUNT = 3;
  
  const handleGoBack = () => {
    if (quiz) {
      router.push(`/viewResult/${quiz._id}`);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      const token = localStorage.getItem('token');
      let apiUrl;

      if (typeof window !== 'undefined') {
        apiUrl = window.location.hostname === 'localhost'
          ? 'https://softbackend.run.place'
          : 'https://softbackend.run.place';
      }

      try {
        const response = await fetch(`${apiUrl}/api/v1/viewResult/${id}/student/${sid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Calculate if each answer is correct based on the score
        // Since score is 3 and we have 3 questions, each correct answer contributes 1 point
        // Filter out duplicate questions by keeping only the first occurrence of each questionId
        const uniqueAnswers = data.results.answers.reduce((acc: Answer[], current: Answer) => {
          const exists = acc.find(item => item.questionId === current.questionId);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        // Process the unique answers
        const processedAnswers = uniqueAnswers.map((answer: Answer, index: number) => ({
          ...answer,
          isCorrect: index < data.results.score // Assuming score represents number of correct answers
        }));

        const processedResults = {
          ...data.results,
          answers: processedAnswers,
        };

        setQuizResults(processedResults);
        setMcqData(processedAnswers);
        setRegNum(regNum);
        // Fetch student details if available
        if (data.studentInfo) {
          setStudentDetails({
            name: data.studentInfo.name || 'Student',
            email: data.studentInfo.email || '',
            id: sid,
            registrationNumber: data.studentInfo.registrationNumber || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch quiz results:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchStudent = async () => {
      const token = localStorage.getItem('token');
      let apiUrl;

      if (typeof window !== 'undefined') {
        apiUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
      }

      try {
        const response = await fetch(`${apiUrl}/api/v1/user/${sid}`,{
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setStudentDetails({
          name: data.user.name,
          email: data.user.email,
          id: sid,
          registrationNumber: data.user.registrationNumber,
        })
      }
      catch (error) {
        console.error('Failed to fetch student details:', error);
      }
    }

    fetchResults();
    fetchStudent();
  }, [id, sid]);
  
  useEffect(() => {
    const fetchViolations = async () => {
      const token = localStorage.getItem('token');
      let apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;

      try {
        const response = await fetch(`${apiUrl}/api/v1/violations/${id}/student/${sid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        setViolations(data.violations);
      } catch (error) {
        console.error('Failed to fetch violations:', error);
      }
    };

    fetchViolations();
  }, [id, sid]);


  const groupViolationsByType = (violations: ViolationData[]) => {
    return violations.reduce((acc, violation) => {
      const type = violation.violation.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {} as Record<string, number>);
  };
  
  const getSeverityLevel = (violationCount: number) => {
    if (violationCount > 10) return "High";
    if (violationCount > 5) return "Medium";
    return "Low";
  };
  
  const getSeverityColor = (level: string) => {
    switch (level) {
      case "High": return "text-red-600 bg-red-50 border-red-200";
      case "Medium": return "text-amber-600 bg-amber-50 border-amber-200";
      case "Low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getViolationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "Tab Switch": <Eye size={18} />,
      "Multiple People": <User size={18} />,
      "Suspicious Activity": <AlertTriangle size={18} />,
      "Copy Paste": <ClipboardList size={18} />,
      "Keyboard Shortcut": <Zap size={18} />
    };
    
    return iconMap[type] || <Shield size={18} />;
  };
  
  const getScoreBadge = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (percentage >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
    if (percentage >= 40) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const handleDownloadReport = () => {
    // Implementation for downloading the report
    console.log("Downloading report...");
    // This would typically trigger a backend API call to generate a PDF report
  };
  
  const handleShareResults = () => {
    // Implementation for sharing results
    const resultUrl = `${window.location.origin}/viewResult/${id}/student/${sid}`;
    navigator.clipboard.writeText(resultUrl)
      .then(() => {
        console.log("Result link copied to clipboard");
        // You would typically show a toast notification here
      })
      .catch(err => {
        console.error("Failed to copy link: ", err);
      });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
          <p className="text-green-700 font-medium">Loading student results...</p>
        </div>
      </div>
    );
  }

  if (!quizResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle size={20} />
              No Results Found
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600 mb-4">
              No quiz results could be found for this student. They may not have completed the quiz yet.
            </p>
            <Button
              onClick={() => router.push(`/viewResult/${id}`)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Return to Results Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Decorative elements */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="fixed bottom-20 left-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Breadcrumbs 
                items={[
                  { label: quiz?.title || 'Quiz', href: '/viewquiz' },
                  { label: 'Results', href: `/viewResult/${quiz?._id || id}` },
                  { label: regNum || `Student ${sid.slice(0, 8)}` }
                ]} 
              />
          {/* Header with navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur-sm hover:bg-green-50 border border-green-100 shadow-sm"
              >
                <ArrowLeft className="h-5 w-5 text-green-600" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Result</h1>
                <p className="text-gray-500">Viewing detailed performance analysis</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="hidden md:flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
            >
              <TvMinimalIcon size={16} />
              Dashboard
            </Button>
          </div>
          
          {/* Student Profile Section */}
          <Card className="mb-8 overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 bg-gradient-to-br from-green-400 to-emerald-600 p-8 flex flex-col justify-center items-center text-white">
                  <Avatar className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 shadow-lg mb-4">
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${studentDetails.name}`} />
                    <AvatarFallback className="bg-white/10 text-white text-xl font-bold">
                      {studentDetails.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-2xl font-bold mb-1">{studentDetails.name}</h2>
                  {studentDetails.email && <p className="text-green-100 mb-2">{studentDetails.email}</p>}
                  
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 mt-2">Student ID: {(typeof studentDetails.id === 'string' ? studentDetails.id.substring(0, 8) : studentDetails.id)}...</Badge>
                </div>
                
                <div className="w-full md:w-2/3 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-green-600" />
                      Quiz Performance
                    </h3>
                    <Badge variant="outline" className={`${getScoreBadge(quizResults.score, mcqData.length)} text-sm px-3 py-1`}>
                      Score: {quizResults.score}/{mcqData.length}
                    </Badge>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">Accuracy</span>
                      <span className="text-sm font-medium">{((quizResults.score / mcqData.length) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(quizResults.score / mcqData.length) * 100} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{quizResults.timeTaken.toFixed(2)} min</h4>
                        <p className="text-sm text-gray-500">Time Taken</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{formatDate(quizResults.submittedAt)}</h4>
                        <p className="text-sm text-gray-500">Submitted</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{quizResults.score}</h4>
                        <p className="text-sm text-gray-500">Correct Answers</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{mcqData.length - quizResults.score}</h4>
                        <p className="text-sm text-gray-500">Incorrect Answers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Violations Summary Card - only shown if violations exist */}
          {violations.length > 0 && (
            <Card className="mb-8 border border-amber-200 shadow-lg">
              <CardHeader className="bg-amber-50 border-b border-amber-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-700 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Academic Integrity Analysis
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={`${getSeverityColor(getSeverityLevel(violations.length))}`}
                  >
                    {getSeverityLevel(violations.length)} Risk Level
                  </Badge>
                </div>
                <CardDescription className="text-amber-700">
                  {violations.length} potential integrity issues detected during this assessment
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {/* Violation Summary Statistics */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1">Total Violations</div>
                    <div className="text-2xl font-bold text-amber-600 mb-1">{violations.length}</div>
                    <div className="mt-auto pt-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                        {Object.keys(groupViolationsByType(violations)).length} distinct types
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1">Most Common</div>
                    {Object.entries(groupViolationsByType(violations)).length > 0 ? (
                      <>
                        <div className="text-lg font-bold text-gray-800 mb-1">
                          {Object.entries(groupViolationsByType(violations))
                            .sort((a, b) => b[1] - a[1])[0][0]}
                        </div>
                        <div className="mt-auto pt-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                            {Object.entries(groupViolationsByType(violations))
                              .sort((a, b) => b[1] - a[1])[0][1]} occurrences
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500">None detected</div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1">First Detection</div>
                    <div className="text-lg font-bold text-gray-800 mb-1">
                      {new Date(violations[violations.length - 1]?.violation.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="mt-auto pt-2">
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        {new Date(violations[violations.length - 1]?.violation.timestamp).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1">Last Detection</div>
                    <div className="text-lg font-bold text-gray-800 mb-1">
                      {new Date(violations[0]?.violation.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="mt-auto pt-2">
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        {new Date(violations[0]?.violation.timestamp).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Violation Types */}
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Activity size={18} />
                  Violation Types
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {Object.entries(groupViolationsByType(violations))
                    .slice(0, showAllViolations ? undefined : INITIAL_DISPLAY_COUNT)
                    .map(([type, count]) => (
                      <div 
                        key={type} 
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-50 rounded-full p-2 text-amber-600">
                            {getViolationIcon(type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{type}</div>
                            <div className="text-sm text-gray-500">Detected {count} times</div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getSeverityColor(getSeverityLevel(count))}`}
                          >
                            {getSeverityLevel(count)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
                
                {/* Show More/Less Violations Button */}
                {Object.keys(groupViolationsByType(violations)).length > INITIAL_DISPLAY_COUNT && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllViolations(!showAllViolations)}
                    className="w-full mb-6 border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    {showAllViolations ? (
                      <>
                        <ChevronUp size={16} className="mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} className="mr-2" />
                        Show More ({Object.keys(groupViolationsByType(violations)).length - INITIAL_DISPLAY_COUNT} more)
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}


          {/* Main Content Tabs */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="pb-0 pt-6">
                <TabsList className="grid grid-cols-2 md:grid-cols-3 bg-green-50 p-1">
                  <TabsTrigger 
                    value="answers" 
                    className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                  >
                    <ClipboardList size={16} className="mr-2" />
                    Answers
                  </TabsTrigger>
                  
                  {violations.length > 0 && (
                    <TabsTrigger 
                      value="violations" 
                      className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                    >
                      <Shield size={16} className="mr-2" />
                      Violations
                    </TabsTrigger>
                  )}
                  
                  <TabsTrigger 
                    value="analytics" 
                    className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                  >
                    <BarChart3 size={16} className="mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-6">
                <TabsContent value="answers" className="m-0">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <ClipboardList size={18} className="text-green-600" />
                      Question Responses
                    </h3>
                    
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 size={14} className="mr-1" />
                        {quizResults.score} Correct
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle size={14} className="mr-1" />
                        {mcqData.length - quizResults.score} Incorrect
                      </Badge>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[60vh] rounded-lg border border-gray-200">
                    <div className="divide-y divide-gray-100">
                      {mcqData.map((answer, index) => (
                        <div 
                          key={answer._id} 
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            answer.isCorrect ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium">
                              {index + 1}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 mb-3">{answer.questionText}</h4>
                              
                              <div className={`p-3 rounded-md mb-3 ${
                                answer.isCorrect 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'bg-red-50 border border-red-200'
                              }`}>
                                <div className="flex items-center mb-1">
                                  <span className="text-sm font-medium text-gray-500 mr-2">Selected Answer:</span>
                                  <Badge variant="outline" className={`${
                                    answer.isCorrect 
                                      ? 'bg-green-100 text-green-700 border-green-200' 
                                      : 'bg-red-100 text-red-700 border-red-200'
                                  }`}>
                                    {answer.isCorrect ? <CheckCircle2 size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                                    {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                  </Badge>
                                </div>
                                <div className="text-gray-700">{answer.selectedOptionText}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="violations" className="m-0">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Shield size={18} className="text-amber-600" />
                      Detailed Violation Timeline
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-2 border-gray-200">
                              <Filter size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Filter violations</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllTimeline(!showAllTimeline)}
                        className="h-8 text-xs border-gray-200"
                      >
                        {showAllTimeline ? 'Show Recent' : 'Show All'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative mb-6">
                    <div className="absolute left-4 h-full w-0.5 bg-amber-100"></div>
                    
                    <div className="space-y-6 ml-10">
                      {violations
                        .slice(0, showAllTimeline ? undefined : INITIAL_DISPLAY_COUNT)
                        .map((violation, index) => (
                          <motion.div
                            key={violation._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative"
                          >
                            {/* Timeline node */}
                            <div className="absolute -left-14 top-0 mt-1.5 w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                              {getViolationIcon(violation.violation.type)}
                            </div>
                            
                            {/* Content card */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-800">{violation.violation.type}</h4>
                                <div className="text-sm text-gray-500">
                                  {new Date(violation.violation.timestamp).toLocaleTimeString()} on {new Date(violation.violation.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                {violation.violation.count && (
                                  <div className="bg-gray-50 rounded p-2 text-sm">
                                    <span className="text-gray-500 mr-1">Count:</span>
                                    <span className="font-medium text-gray-800">{violation.violation.count}</span>
                                  </div>
                                )}
                                
                                {violation.violation.key && (
                                  <div className="bg-gray-50 rounded p-2 text-sm">
                                    <span className="text-gray-500 mr-1">Key:</span>
                                    <span className="font-medium text-gray-800">{violation.violation.key}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Show More/Less Timeline Button */}
                  {violations.length > INITIAL_DISPLAY_COUNT && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllTimeline(!showAllTimeline)}
                      className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      {showAllTimeline ? (
                        <>
                          <ChevronUp size={16} className="mr-2" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} className="mr-2" />
                          Show More ({violations.length - INITIAL_DISPLAY_COUNT} more violations)
                        </>
                      )}
                    </Button>
                  )}
                </TabsContent>
                <TabsContent value="analytics" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <BarChart3 size={16} className="text-green-600" />
                          Performance Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-500">Score</span>
                              <span className="text-sm font-medium">
                                {((quizResults.score / mcqData.length) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={(quizResults.score / mcqData.length) * 100} className="h-2 bg-gray-100" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-500">Question Accuracy</span>
                              <span className="text-sm font-medium">{quizResults.score}/{mcqData.length}</span>
                            </div>
                            <div className="grid grid-cols-10 gap-1">
                              {mcqData.map((answer, idx) => (
                                <div 
                                  key={idx}
                                  className={`h-2 rounded-sm ${answer.isCorrect ? 'bg-green-400' : 'bg-red-400'}`}
                                ></div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Breakdown</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                                  <span className="text-sm text-gray-600">Correct</span>
                                </div>
                                <div className="text-sm font-medium">{quizResults.score}</div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                                  <span className="text-sm text-gray-600">Incorrect</span>
                                </div>
                                <div className="text-sm font-medium">{mcqData.length - quizResults.score}</div>
                              </div>
                              
                              <Separator className="my-2" />
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                                  <span className="text-sm text-gray-600">Total Questions</span>
                                </div>
                                <div className="text-sm font-medium">{mcqData.length}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <FileClock size={16} className="text-green-600" />
                          Time Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-500">Time Utilization</span>
                              <span className="text-sm font-medium">
                                {quizResults.timeTaken.toFixed(2)} min
                              </span>
                            </div>
                            <Progress 
                              value={(quizResults.timeTaken / (quiz?.timeLimit || quizResults.timeTaken * 1.5)) * 100} 
                              className="h-2 bg-gray-100" 
                            />
                            {quiz?.timeLimit && (
                              <div className="text-xs text-gray-500 mt-1">
                                Time limit: {quiz.timeLimit} min
                              </div>
                            )}
                          </div>
                          
                          <div className="pt-2">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Time Statistics</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-lg border border-gray-200 p-3">
                                <div className="text-xs text-gray-500 mb-1">Avg. Time per Question</div>
                                <div className="text-lg font-semibold text-gray-800">
                                  {(quizResults.timeTaken / mcqData.length).toFixed(1)} min
                                </div>
                              </div>
                              
                              <div className="rounded-lg border border-gray-200 p-3">
                                <div className="text-xs text-gray-500 mb-1">Total Time</div>
                                <div className="text-lg font-semibold text-gray-800">
                                  {quizResults.timeTaken.toFixed(1)} min
                                </div>
                              </div>
                              
                              <div className="rounded-lg border border-gray-200 p-3">
                                <div className="text-xs text-gray-500 mb-1">Submitted</div>
                                <div className="text-sm font-medium text-gray-800">
                                  {new Date(quizResults.submittedAt).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="rounded-lg border border-gray-200 p-3">
                                <div className="text-xs text-gray-500 mb-1">Time of Day</div>
                                <div className="text-sm font-medium text-gray-800">
                                  {new Date(quizResults.submittedAt).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {violations.length > 0 && (
                      <Card className="border border-amber-200 shadow-sm md:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Flag size={16} className="text-amber-600" />
                            Integrity Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="rounded-full p-2 bg-amber-50 text-amber-600">
                                  <AlertTriangle size={16} />
                                </div>
                                <div className="text-sm font-medium text-gray-700">Violation Count</div>
                              </div>
                              <div className="text-2xl font-bold text-gray-800">{violations.length}</div>
                              <div className="mt-2 text-xs text-gray-500">
                                Based on automatic detection
                              </div>
                            </div>
                            
                            <div className="rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="rounded-full p-2 bg-amber-50 text-amber-600">
                                  <Shield size={16} />
                                </div>
                                <div className="text-sm font-medium text-gray-700">Risk Level</div>
                              </div>
                              <div className="text-xl font-bold text-gray-800">
                                {getSeverityLevel(violations.length)}
                              </div>
                              <div className="mt-2">
                                <Badge className={getSeverityColor(getSeverityLevel(violations.length))}>
                                  {violations.length} events detected
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="rounded-full p-2 bg-amber-50 text-amber-600">
                                  <BadgeCheck size={16} />
                                </div>
                                <div className="text-sm font-medium text-gray-700">Recommendation</div>
                              </div>
                              <div className="text-sm text-gray-700">
                                {violations.length > 10 
                                  ? "Review required - high violation count"
                                  : violations.length > 5
                                    ? "Follow up with student recommended"
                                    : "No immediate action required"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
              
              <CardFooter className="bg-gradient-to-r from-green-50 to-green-100 border-t border-green-100 p-6">
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Results
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      className="border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <TvMinimalIcon size={16} className="mr-2" />
                      Dashboard
                    </Button>
                    
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        if (window.print) {
                          window.print();
                        }
                      }}
                    >
                      <FileClock size={16} className="mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}