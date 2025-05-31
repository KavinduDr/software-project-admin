'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEssay } from '../../context/EssayContext';
import { motion } from 'framer-motion';
import {
  Download,
  ArrowLeft,
  Eye,
  Search,
  SortAsc,
  SortDesc,
  AlertTriangle,
  TvMinimalIcon,
  Users,
  Trophy,
  Clock,
  BarChart3,
  Filter,
  BadgeCheck,
  Share2,
  FileSpreadsheet,
  ChevronDown,
  Printer,
  Edit3,
  FileText
} from 'lucide-react';

// UI Components
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Separator } from '../../components/ui/separator';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

// Add SWR for data fetching and caching
import useSWR from 'swr';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';

// Define interfaces
interface EssayResult {
  _id: string;
  registrationNumber: string;
  score: number;
  timeTaken: number;
  userId: string;
  submittedAt: string;
  studentName?: string;
  violationCount?: number;
  essayAnswer?: string;
  similarityScore?: number;
}

interface ViolationSummary {
  _id: string;  // studentId
  studentName: string;
  totalViolations: number;
  violationTypes: string[];
}

// Create a custom fetcher function
const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  return response.json();
};

// Create a function to get API URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:4000'
      : process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
  }
  return '';
};

// Helper functions for styling
function getScoreColor(score: number): string {
  const percentage = score * 100;
  if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (percentage >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (percentage >= 40) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function getViolationStyle(count: number): string {
  if (count === 0) return 'bg-green-100 text-green-800';
  if (count <= 5) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function getSeverityLevel(violationCount: number) {
  if (violationCount > 10) return "High";
  if (violationCount > 5) return "Medium";
  return "Low";
}

function getSeverityColor(level: string) {
  switch (level) {
    case "High": return "text-red-600 bg-red-50 border-red-200";
    case "Medium": return "text-amber-600 bg-amber-50 border-amber-200";
    case "Low": return "text-blue-600 bg-blue-50 border-blue-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const StatsCard = ({ icon: Icon, label, value, bgColor, description }: {
  icon: any;
  label: string;
  value: string | number;
  bgColor: string;
  description?: string;
}) => (
  <div className={`${bgColor} p-5 rounded-xl flex items-center gap-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow`}>
    <div className="p-3 bg-white/90 rounded-lg shadow-sm">
      <Icon className="w-6 h-6 text-green-600" />
    </div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-green-700">{value}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  </div>
);

const SortIcon = ({ column, sortConfig }: {
  column: keyof EssayResult;
  sortConfig: {
    key: keyof EssayResult | null;
    direction: 'asc' | 'desc'
  };
}) => {
  if (sortConfig.key !== column) return null;
  return sortConfig.direction === 'asc' ? (
    <SortAsc className="ml-1 w-4 h-4 text-green-600" />
  ) : (
    <SortDesc className="ml-1 w-4 h-4 text-green-600" />
  );
};

export default function ViewEssayResult() {
  const { id } = useParams();
  const router = useRouter();
  const { essay } = useEssay();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const apiUrl = getApiUrl();

  const [sortConfig, setSortConfig] = useState<{
    key: keyof EssayResult | null;
    direction: 'asc' | 'desc';
  }>({ key: 'score', direction: 'desc' });

  // Use SWR for caching and data fetching
  const { data: resultsData, error: resultsError, isLoading: isResultsLoading } =
    useSWR(`${apiUrl}/api/v1/essay/results/${id}`, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 60000
    });

  const { data: violationsData, error: violationsError, isLoading: isViolationsLoading } =
    useSWR(`${apiUrl}/api/v1/violations/${id}/summary`, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 60000
    });

  // Derived state
  const essayResults = resultsData?.results || [];
  const violationSummary = violationsData?.summary || [];
  const totalViolations = violationSummary.reduce(
    (sum: number, student: ViolationSummary) => sum + student.totalViolations, 0
  );

  const averageScore = essayResults.length > 0
    ? Number((essayResults.reduce((acc: number, curr: EssayResult) => acc + curr.score, 0) / essayResults.length).toFixed(2))
    : 0;

  const averageTime = essayResults.length > 0
    ? Number((essayResults.reduce((acc: number, curr: EssayResult) => acc + curr.timeTaken, 0) / essayResults.length).toFixed(1))
    : 0;

  const loading = isResultsLoading || isViolationsLoading;
  const error = resultsError || violationsError;

  const handleGoBack = () => {
    router.push('/viewessay');
  };

  const handleDownloadExcel = async () => {
    if (!essay) {
      console.error('Essay data is not available');
      return;
    }

    const assignmentId = essay._id;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${apiUrl}/api/v1/essay/downloadExcel/${assignmentId}`, {
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
      a.download = `Essay_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Failed to download Excel:", error);
    }
  };

  const handleSort = (key: keyof EssayResult) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const getViolationCount = useCallback((userId: string): number => {
    const studentViolation: ViolationSummary | undefined = violationSummary.find((v: ViolationSummary) => v._id === userId);
    return studentViolation?.totalViolations || 0;
  }, [violationSummary]);

  const filteredResults: EssayResult[] = essayResults
    .filter((result: EssayResult) =>
      result.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.score.toString().includes(searchTerm)
    )
    .sort((a: EssayResult, b: EssayResult) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue !== undefined && bValue !== undefined) {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
        <div className="w-full max-w-4xl mx-auto pt-4 px-4">
          <Breadcrumbs items={[{ label: 'Loading Results...' }]} />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
            <p className="text-green-700 font-medium">Loading essay results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
        <div className="w-full max-w-4xl mx-auto pt-4 px-4">
          <Breadcrumbs items={[{ label: 'Error' }]} />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="w-full max-w-md shadow-lg border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Error Loading Data
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">
                  There was a problem fetching the essay results. Please try again later.
                </p>
                <Button
                  onClick={handleGoBack}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Return to Essays
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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
          {essay && (
            <Breadcrumbs items={[
              { label: essay.title, href: '/viewessay' },
              { label: 'Results' }
            ]} />
          )}
          
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{essay?.title || 'Essay Results'}</h1>
                <p className="text-gray-500">Viewing essay performance summary</p>
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

          {/* Summary Cards */}
          <Card className="mb-8 overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  icon={Users}
                  label="Total Students"
                  value={essayResults.length}
                  bgColor="bg-green-50"
                  description="Students who completed the essay"
                />
                <StatsCard
                  icon={Trophy}
                  label="Average Score"
                  value={`${(averageScore * 100).toFixed(1)}%`}
                  bgColor="bg-green-50"
                  description="Average similarity score"
                />
                <StatsCard
                  icon={Clock}
                  label="Average Time"
                  value={`${averageTime} min`}
                  bgColor="bg-green-50"
                  description="Average completion time"
                />
                <StatsCard
                  icon={AlertTriangle}
                  label="Total Violations"
                  value={totalViolations}
                  bgColor="bg-amber-50"
                  description={totalViolations > 0 ? `${violationSummary.length} students with violations` : "No integrity issues detected"}
                />
              </div>

              {/* Performance Summary */}
              <div className="mt-8 bg-green-50 rounded-xl p-5 border border-green-200">
                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <BarChart3 size={18} />
                  Performance Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-green-100">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Score Distribution</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">
                        {essayResults.filter((r: EssayResult): boolean => r.score * 100 >= 80).length} students scored 80% or higher
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-600">
                        {essayResults.filter((r: EssayResult): boolean => r.score * 100 >= 60 && r.score * 100 < 80).length} students scored 60-79%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-gray-600">
                        {essayResults.filter((r: EssayResult): boolean => r.score * 100 >= 40 && r.score * 100 < 60).length} students scored 40-59%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-600">
                        {essayResults.filter((r: EssayResult): boolean => r.score * 100 < 40).length} students scored below 40%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 border border-green-100">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Completion Time</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Fastest</span>
                          <span className="font-medium text-green-600">
                            {essayResults.length > 0 ? Math.min(...essayResults.map((r: EssayResult): number => r.timeTaken)).toFixed(1) : 0} min
                          </span>
                        </div>
                        <Progress value={20} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Average</span>
                          <span className="font-medium text-amber-600">{averageTime} min</span>
                        </div>
                        <Progress value={50} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Slowest</span>
                          <span className="font-medium text-red-600">
                            {essayResults.length > 0 ? Math.max(...essayResults.map((r: EssayResult): number => r.timeTaken)).toFixed(1) : 0} min
                          </span>
                        </div>
                        <Progress value={80} className="h-1" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 border border-green-100">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Integrity Analysis</h4>
                    {totalViolations > 0 ? (
                      <>
                        <div className="mb-3">
                          <Badge className={getSeverityColor(getSeverityLevel(totalViolations))}>
                            {getSeverityLevel(totalViolations)} Risk Level
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">
                            {violationSummary.length} students with suspicious activity
                          </p>
                          <p className="flex items-center gap-1">
                            <AlertTriangle size={14} className="text-amber-500" />
                            {violationSummary.filter((v:ViolationSummary) : any => v.totalViolations > 5).length} students require review
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24">
                        <BadgeCheck size={24} className="text-green-500 mb-2" />
                        <p className="text-sm text-gray-600">No integrity issues detected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-green-700 flex items-center gap-2">
                    <FileText size={20} />
                    Essay Submissions
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    {filteredResults.length} students completed this essay
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white border-green-200 focus:border-green-300"
                    />
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowFilters(!showFilters)}
                          className="border-green-200 hover:bg-green-100 text-green-700"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter results</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (window.print) {
                              window.print();
                            }
                          }}
                          className="border-green-200 hover:bg-green-100 text-green-700"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Print results</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="default"
                    onClick={handleDownloadExcel}
                    className="bg-green-600 hover:bg-green-700 text-white hidden md:flex"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[60vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-white border-b border-green-100">
                      <TableHead
                        className="font-semibold text-green-700 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('registrationNumber')}
                      >
                        <div className="flex items-center">
                          Student
                          <SortIcon column="registrationNumber" sortConfig={sortConfig} />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-green-700 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('score')}
                      >
                        <div className="flex items-center">
                          Similarity Score
                          <SortIcon column="score" sortConfig={sortConfig} />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-green-700 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('timeTaken')}
                      >
                        <div className="flex items-center">
                          Time Taken
                          <SortIcon column="timeTaken" sortConfig={sortConfig} />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-green-700 cursor-pointer hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center">
                          Violations
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-green-700 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('submittedAt')}
                      >
                        <div className="flex items-center">
                          Submitted
                          <SortIcon column="submittedAt" sortConfig={sortConfig} />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-green-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result: EssayResult) => (
                      <TableRow key={result._id} className="hover:bg-green-50 transition-colors">
                        <TableCell className="font-medium text-gray-700">
                          {result.studentName || result.registrationNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getScoreColor(result.score)}
                          >
                            {(result.score * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {result.timeTaken.toFixed(1)} min
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getViolationStyle(getViolationCount(result.userId))}>
                              {getViolationCount(result.userId)}
                            </Badge>
                            {getViolationCount(result.userId) > 5 && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(result.submittedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/viewEssayResult/${id}/student/${result.userId}`)}
                            className="bg-green-100 hover:bg-green-200 text-green-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Essay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>

            <CardFooter className="p-6 flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100 border-t border-green-200">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-green-600">{filteredResults.length}</span> results
                {searchTerm && (
                  <> filtered from <span className="font-medium text-green-600">{essayResults.length}</span> total results</>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoBack}
                  className="border-green-200 text-green-700 hover:bg-green-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Essays
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownloadExcel}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export Excel
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Mobile Action Button for Export - Only visible on small screens */}
          <div className="md:hidden fixed bottom-6 right-6 z-20">
            <Button
              variant="default"
              size="icon"
              onClick={handleDownloadExcel}
              className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}