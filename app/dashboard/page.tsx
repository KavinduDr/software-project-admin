'use client';
import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@nextui-org/table";
import { Button } from '@nextui-org/button';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../context/AdminContext';
import Navbar from '../components/Navbar/Navbar';
import { useQuiz } from '../context/QuizContext';
import { useEssay } from '../context/EssayContext';

const Page = () => {
    const router = useRouter();
    const { admin } = useAdmin();
    const [name, setName] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const { setQuiz } = useQuiz();
    const { setEssay } = useEssay();

    interface Assignment {
        _id: string;
        title: string;
        questions: { length: number }[];
    }

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');  // State for search term
    const [sortOption, setSortOption] = useState<'title' | 'questions'>('title');  // State for sort option
    const [assignmentType, setAssignmentType] = useState<'quiz' | 'essay'>('quiz');  // State for assignment type

    // useEffect(() => {
    //     const fetchAssignments = async () => {

    //         if (admin && admin._id) {
    //             try {
    //                 let apiUrl;
    //                 // Determine the correct API URL based on the hostname
    //                 if (typeof window !== 'undefined') {
    //                     if (window.location.hostname === 'localhost') {
    //                         apiUrl = 'http://localhost:4000';
    //                     } else {
    //                         apiUrl = process.env.NEXT_PUBLIC_DEPLOYMENT_URL;
    //                         console.log('Deployment URL:', apiUrl);
    //                     }
    //                 }

    //                 let response;
    //                 if (assignmentType === 'quiz') {
    //                     response = await fetch(`${apiUrl}/api/v1/teacher/${admin._id}`);
    //                 } else if (assignmentType === 'essay') {
    //                     response = await fetch(`${apiUrl}/api/v1/essay/teacher/${admin._id}`);
    //                 }

    //                 const data = await response.json();
    //                 if (data.success) {
    //                     if (assignmentType === 'quiz') {
    //                         setAssignments(data.assignments);
    //                     } else if (assignmentType === 'essay') {
    //                         setAssignments(data.essayAssignments);
    //                     }
    //                     console.log(`admin: ${admin._id}`);
    //                     console.log(`assignments:`, data.assignments || data.essayAssignments);
    //                 }
    //             } catch (error) {
    //                 console.error('Failed to fetch assignments', error);
    //             }
    //         }
    //     };

    //     fetchAssignments();
    // }, [admin, assignmentType]);


    useEffect(() => {
        const fetchAssignments = async () => {
            if (admin && admin._id) {
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

                    let response;
                    if (assignmentType === 'quiz') {
                        response = await fetch(`${apiUrl}/api/v1/teacher/${admin._id}`);
                    } else if (assignmentType === 'essay') {
                        response = await fetch(`${apiUrl}/api/v1/essay/teacher/${admin._id}`);
                    }

                    if (!response || !response.ok) {
                        throw new Error(`Failed to fetch: ${response?.statusText || 'Unknown error'}`);
                    }

                    const data = await response.json();
                    if (data.success) {
                        if (assignmentType === 'quiz') {
                            setAssignments(data.assignments);
                            setAssignmentType('quiz');
                        } else if (assignmentType === 'essay') {
                            setAssignments(data.essayAssignments);
                            setAssignmentType('essay');
                        }
                        console.log(`admin: ${admin._id}`);
                        console.log(`assignments:`, data.assignments || data.essayAssignments);
                    }
                } catch (error) {
                    console.error('Failed to fetch assignments', error);
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

    const fetchQuiz = async (id: string, assignmentType: string) => {
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
            if (assignmentType === 'quiz') {
                const response = await fetch(`${apiUrl}/api/v1/${id}`);
                const data = await response.json();
                if (data.success) {
                    setQuiz(data.assignment);
                    router.push(`/viewquiz`);
                }
            }
            else if (assignmentType === 'essay') {
                const response = await fetch(`${apiUrl}/api/v1/essay/${id}`);
                const data = await response.json();
                console.log(data);
                if (data.success) {
                    setEssay(data.essayAssignment);
                    router.push(`/viewessay`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch quiz', error);
        }
    };

    const editQuiz = async (id: string, assignmentType: string) => {
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
            if (assignmentType === 'quiz') {
                const response = await fetch(`${apiUrl}/api/v1/${id}`);
                const data = await response.json();
                if (data.success) {
                    setQuiz(data.assignment);
                    router.push(`/edit/${id}`);
                }
            }
            else if (assignmentType === 'essay') {
                const response = await fetch(`${apiUrl}/api/v1/essay/${id}`);
                const data = await response.json();
                console.log(data);
                if (data.success) {
                    setEssay(data.essayAssignment);
                    router.push(`/editessay/${id}`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch quiz', error);
        }
    }

    const getQuizLink = (id: string) => {
        const URL = `http://localhost:3001/signin/${id}`;
        navigator.clipboard.writeText(URL).then(() => {
            setIsCopied(true);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });

        return URL;
    }

    // Filter and sort assignments based on search term and selected sort option
    const filteredAssignments =
        Array.isArray(assignments)
            ? assignments
                .filter((assignment) =>
                    assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort((a, b) => {
                    if (sortOption === "title") {
                        return a.title.localeCompare(b.title);
                    } else if (sortOption === "questions") {
                        return b.questions.length - a.questions.length;
                    }
                    return 0; // Default sort
                })
            : [];


    return (
        <>
            <div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-16 pb-10 sm:pb-16 bg-white flex justify-center items-center">
                <div className="w-full sm:w-auto sm:grow shrink basis-0 self-stretch py-6 bg-[#f4f4f4] rounded-3xl border-2 border-[#0cdc09] flex flex-col justify-center items-center gap-14">
                    <div className="w-32 sm:w-44 h-32 sm:h-44 bg-[#aeaeae] rounded-full shadow flex flex-col justify-center items-center gap-6">
                        <div className="text-center text-black text-2xl sm:text-3xl font-bold font-['Inter']">Welcome</div>
                        <div className="text-center text-black text-lg sm:text-xl font-medium font-['Inter']">
                            {name ? `Mr. ${name}` : "Mr. A.B.C. Perera"}
                        </div>
                    </div>

                    <div className='flex flex-row gap-6'>
                        {/* Search bar */}
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for an assignment"
                            className="mb-4 p-2 border border-gray-300 rounded-md w-full"
                        />

                        {/* Sorting options */}
                        <div className="mb-4 flex justify-between items-center">
                            <label htmlFor="sort" className="mr-2">Sort by:</label>
                            <select
                                id="sort"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as 'title' | 'questions')}
                                className="p-2 border border-gray-300 rounded-md"
                            >
                                <option value="title">Title</option>
                                <option value="questions">Number of Questions</option>
                            </select>
                        </div>

                        {/*Assignment type selection to view */}
                        <div className='mb-4 flex justify-between items-center'>
                            <label htmlFor="assignment" className="mr-2">Assignment Type:</label>
                            <select
                                id="assignment"
                                className="p-2 border border-gray-300 rounded-md"
                                value={assignmentType}
                                onChange={(e) => setAssignmentType(e.target.value as 'quiz' | 'essay')}
                            >
                                <option value="quiz">Quiz</option>
                                <option value="essay">Essay</option>
                            </select>
                        </div>
                    </div>

                    <Table aria-label="Assignments Table" className='w-full items-center'>
                        <TableHeader>
                            <TableColumn>TITLE</TableColumn>
                            <TableColumn>QUESTIONS</TableColumn>
                            <TableColumn>VIEW QUIZ</TableColumn>
                            <TableColumn>GET PUBLIC LINK</TableColumn>
                            <TableColumn key={`status`}>
                                <svg width="37" height="37" viewBox="0 0 37 37" fill="none" className='cursor-pointer' onClick={() => router.push('/addingquiz')}>
                                    <g id="plus-circle-svgrepo-com 1">
                                        <path id="Vector" d="M13.875 18.5H23.125" stroke="green" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path id="Vector_2" d="M18.5 13.875V23.125" stroke="green" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path id="Vector_3" d="M32.375 18.5C32.375 26.163 26.163 32.375 18.5 32.375C10.8371 32.375 4.625 26.163 4.625 18.5C4.625 10.8371 10.8371 4.625 18.5 4.625C26.163 4.625 32.375 10.8371 32.375 18.5Z" stroke="green" strokeWidth="4" />
                                    </g>
                                </svg>
                            </TableColumn>
                        </TableHeader>
                        <TableBody>
                            {filteredAssignments.length > 0 ? (
                                filteredAssignments.map(assignment => (
                                    <TableRow key={assignment._id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <TableCell>{assignment.title}</TableCell>
                                        <TableCell>{assignment.questions.length}</TableCell>
                                        <TableCell>
                                            <Button color="success" variant="ghost" onClick={async () => await fetchQuiz(assignment._id, assignmentType)}>
                                                View Quiz
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button color="success" variant="ghost" onClick={() => getQuizLink(assignment._id)}>
                                                {/* {isCopied ? 'Link Copied!' : 'Get Link'} */} Get Link
                                            </Button>
                                        </TableCell>
                                        <TableCell onClick={() => editQuiz(assignment._id, assignmentType)} className='cursor-pointer'>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 2L22 6M2 22L3.2764 17.3199C3.35968 17.0145 3.40131 16.8619 3.46523 16.7195C3.52199 16.5931 3.59172 16.4729 3.67332 16.3609C3.76521 16.2348 3.87711 16.1229 4.1009 15.8991L14.4343 5.56569C14.6323 5.36768 14.7313 5.26867 14.8455 5.23158C14.9459 5.19895 15.0541 5.19895 15.1545 5.23158C15.2687 5.26867 15.3677 5.36768 15.5657 5.56569L18.4343 8.43431C18.6323 8.63232 18.7313 8.73133 18.7684 8.84554C18.801 8.9459 18.801 9.05408 18.7684 9.15444C18.7313 9.26865 18.6323 9.36766 18.4343 9.56567L8.1009 19.8991C7.87711 20.1229 7.76521 20.2348 7.63905 20.3267C7.52709 20.4083 7.40691 20.478 7.28049 20.5348C7.13807 20.5987 6.98549 20.6403 6.6801 20.7236L2 22Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell>No assignments found</TableCell>
                                    <TableCell>No assignments found</TableCell>
                                    <TableCell>No assignments found</TableCell>
                                    <TableCell>No assignments found</TableCell>
                                    <TableCell>No assignments found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
};

export default Page;
