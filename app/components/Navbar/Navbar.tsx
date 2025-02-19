'use client';

import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/app/context/AdminContext';

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname(); // Get the current pathname
    const { admin, setAdmin } = useAdmin(); // Assuming setAdmin is available from context
    const [apiUrl, setApiUrl] = useState('');
    const [name, setName] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility

    useEffect(() => {
        console.log("Admin object:", admin);
        if (admin?.name) {
            setName(admin.name);
        } else {
            setName(''); // Clear name if admin is not available
        }
    }, [admin]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.location.hostname === 'localhost') {
                setApiUrl('http://localhost:4000');
            } else {
                setApiUrl('http://13.228.36.212');
            }
        }
    }, []);

    const handleLogout = async () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('name');
        console.log("logging out");
        
        // Clear admin state here
        setAdmin(null); // Assuming setAdmin is a method to clear the admin context

        router.push('/');
    };

    // Determine if the current route is the sign-in page
    const isSignInPage = pathname === '/sign-in'; // Use pathname instead of router.pathname

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <div className="fixed top-0 left-0 z-50 p-4 md:hidden">
                <button onClick={toggleSidebar} className="text-black focus:outline-none">
                    {isSidebarOpen ? (
                        <i className="fas fa-times"></i>
                    ) : (
                        <i className="fas fa-bars"></i>
                    )}
                </button>
            </div>

            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`} aria-label="Sidebar">
                <div className="h-full flex flex-col justify-between px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="flex flex-col items-center">
                        {/* LMS title */}
                        <div className="text-4xl font-extrabold mb-6 text-white">LMS</div>

                        {/* Only show username if logged in and not on the sign-in page */}
                        {admin && !isSignInPage && (
                            <div 
                                className="text-2xl font-semibold cursor-pointer hover:text-gray-400 transition-colors duration-300 mb-10 text-white" 
                                onClick={() => router.push('#')}
                            >
                                {name}
                            </div>
                        )}

                        {/* Conditionally render Dashboard and Create Assignment links only if logged in and not on sign-in page */}
                        {admin && !isSignInPage && (
                            <ul className="space-y-2 font-medium">
                                <li>
                                    <a href="#" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group" onClick={() => router.push('/dashboard')}>
                                        <i className="fas fa-home w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                                        <span className="ml-3">Dashboard</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group" onClick={() => router.push('/addingquiz')}>
                                        <i className="fas fa-plus-circle w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                                        <span className="ml-3">Create Assignment</span>
                                    </a>
                                </li>
                            </ul>
                        )}
                    </div>

                    {/* Render logout icon only if not on sign-in page */}
                    {!isSignInPage && (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mt-4 self-end">
                            <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                onClick={handleLogout}
                                className="cursor-pointer hover:scale-110 transition-transform duration-300"
                            >
                                <path
                                    fill="#fff"
                                    fillRule="evenodd"
                                    d="M21.593 10.943c.584.585.584 1.53 0 2.116L18.71 15.95c-.39.39-1.03.39-1.42 0a.996.996 0 010-1.41 9.552 9.552 0 011.689-1.345l.387-.242-.207-.206a10 10 0 01-2.24.254H8.998a1 1 0 110-2h7.921a10 10 0 012.24.254l.207-.206-.386-.241a9.562 9.562 0 01-1.69-1.348.996.996 0 010-1.41c.39-.39 1.03-.39 1.42 0l2.883 2.893zM14 16a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v1.505a1 1 0 102 0V5.5A2.5 2.5 0 0012.5 3h-7A2.5 2.5 0 003 5.5v13A2.5 2.5 0 005.5 21h7a2.5 2.5 0 002.5-2.5V17a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                ></path>
                            </svg>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Navbar;