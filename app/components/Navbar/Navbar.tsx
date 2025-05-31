'use client';

import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { useAdmin } from '@/app/context/AdminContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { admin, setAdmin } = useAdmin();
    const [apiUrl, setApiUrl] = useState('');
    const [name, setName] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [hoverItem, setHoverItem] = useState<number | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    // Ref for the sidebar to detect clicks outside
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (admin?.name) {
            setName(admin.name);
        } else {
            setName('');
        }
    }, [admin]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.location.hostname === 'localhost') {
                setApiUrl('http://localhost:4000');
            } else {
                setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'https://softbackend.run.place');
            }

            const handleResize = () => {
                setIsMobile(window.innerWidth < 768);
                if (window.innerWidth >= 768) {
                    setShowMobileMenu(false);
                }
            };

            // Close sidebar when clicking outside (for mobile)
            const handleClickOutside = (event: MouseEvent) => {
                if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isMobile) {
                    setShowMobileMenu(false);
                }
            };

            handleResize();
            window.addEventListener('resize', handleResize);
            document.addEventListener('mousedown', handleClickOutside);
            
            return () => {
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isMobile]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        
        // Simulate a small delay for animation
        setTimeout(() => {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('name');
            setAdmin(null);
            router.push('/');
        }, 600);
    };

    const handleProfileClick = () => {
        router.push('/profile');
    };

    const isSignInPage = pathname === '/sign-in';
    
    // Don't render sidebar on sign-in page
    if (isSignInPage) return null;
    
    // Get initials for avatar
    const getInitials = (fullName: string) => {
        if (!fullName) return 'U';
        return fullName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Navigation items with icons
    const navItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            ),
            description: 'Overview of your activity'
        },
        {
            name: 'Manage Assignments',
            path: '/addingquiz',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
            ),
            description: 'Create and manage assessments'
        },
        {
            name: 'Analytics',
            path: '/analytics',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            ),
            description: 'Track student performance'
        },
        {
            name: 'Profile',
            path: '/profile',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            ),
            description: 'View and edit your profile'
        }
    ];

    if (!admin) return null;

    // Mobile menu toggle button with glass effect
    const MobileMenuButton = () => (
        <motion.button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden fixed top-4 left-4 z-50 bg-white/80 backdrop-blur-md p-2.5 rounded-full shadow-lg border border-green-100"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0, 128, 0, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
            </svg>
        </motion.button>
    );

    // Decorative elements
    const SidebarDecorations = () => (
        <>
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-white/30 pointer-events-none"></div>
            
            {/* Subtle corner shapes */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-100 opacity-5 rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 opacity-5 rounded-full"></div>
            
            {/* Subtle pattern grid */}
            <div className="absolute inset-0 opacity-3 pointer-events-none">
                {Array(6).fill(0).map((_, i) => (
                    <div 
                        key={i}
                        className="absolute h-px bg-green-500"
                        style={{
                            top: `${(i+1) * 16}%`,
                            left: 0,
                            right: 0,
                            opacity: 0.03
                        }}
                    ></div>
                ))}
            </div>
        </>
    );

    return (
        <>
            <MobileMenuButton />
            
            {/* Backdrop overlay for mobile */}
            <AnimatePresence>
                {isMobile && showMobileMenu && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                        onClick={() => setShowMobileMenu(false)}
                    ></motion.div>
                )}
            </AnimatePresence>
            
            {/* Sidebar */}
            <motion.div 
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 transform transition-all duration-300 ease-out z-40 ${
                    isMobile ? (showMobileMenu ? 'translate-x-0' : '-translate-x-full') : (isCollapsed ? 'w-20' : 'w-72')
                }`}
                initial={isMobile ? { x: "-100%" } : { x: 0 }}
                animate={isMobile ? (showMobileMenu ? { x: 0 } : { x: "-100%" }) : { x: 0 }}
                transition={{ duration: 0.25, type: "spring", stiffness: 200, damping: 28 }}
                style={{
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)"
                }}
            >
                <div className="relative h-full flex flex-col bg-white/90 backdrop-blur-lg border-r border-green-100 overflow-hidden">
                    <SidebarDecorations />
                    
                    {/* Logo and collapse toggle */}
                    <div className="flex items-center justify-between h-16 px-5 py-6 border-b border-green-100 bg-white/50 backdrop-blur-md relative z-10">
                        {!isCollapsed && (
                            <motion.div 
                                className="flex items-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                        <span className="text-white text-lg font-bold">A</span>
                                    </div>
                                    <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent transition-all duration-300">Admin</h1>
                                </div>
                            </motion.div>
                        )}

                        {isCollapsed && (
                            <motion.div 
                                className="mx-auto" 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white text-lg font-bold">A</span>
                                </div>
                            </motion.div>
                        )}

                        {!isMobile && (
                            <motion.button 
                                onClick={() => setIsCollapsed(!isCollapsed)} 
                                className="p-1.5 rounded-lg hover:bg-green-100/60 transition-colors duration-200"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {isCollapsed ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                                    )}
                                </svg>
                            </motion.button>
                        )}
                    </div>

                    {/* User profile section */}
                    <motion.div 
                        className={`flex flex-col px-4 py-5 border-b border-green-100 relative z-10 ${isCollapsed ? 'items-center' : ''}`}
                        whileHover={{ backgroundColor: "rgba(240, 250, 240, 0.5)" }}
                        onClick={handleProfileClick}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                                    <span className="text-lg font-semibold">{getInitials(name)}</span>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white"></div>
                            </motion.div>
                            
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div 
                                        className="ml-3"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <p className="font-medium text-gray-800">{name}</p>
                                        <div className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                                            <p className="text-xs text-gray-500">Administrator</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Navigation section */}
                    <div className="flex-grow overflow-y-auto py-6 relative z-10">
                        <ul className="space-y-2 px-3">
                            {navItems.map((item, index) => (
                                <motion.li 
                                    key={index}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.04 }}
                                    onHoverStart={() => setHoverItem(index)}
                                    onHoverEnd={() => setHoverItem(null)}
                                >
                                    <motion.button
                                        onClick={() => router.push(item.path)}
                                        className={`relative flex items-center py-3 px-4 w-full rounded-xl cursor-pointer transition-all duration-200 ${
                                            pathname === item.path 
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                                                : 'text-gray-700 hover:bg-green-50'
                                        } ${isCollapsed ? 'justify-center' : ''}`}
                                        whileHover={isCollapsed ? { scale: 1.05 } : { scale: 1.01, x: 1 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Active indicator */}
                                        {pathname === item.path && (
                                            <motion.div 
                                                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full bg-white"
                                                layoutId="activeIndicator"
                                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                            />
                                        )}
                                        
                                        <span className={`flex items-center justify-center ${pathname === item.path ? 'text-white' : 'text-green-600'}`}>
                                            {item.icon}
                                        </span>
                                        
                                        <AnimatePresence>
                                            {!isCollapsed && (
                                                <motion.span 
                                                    className="ml-3 font-medium text-sm whitespace-nowrap"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {item.name}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        
                                        {/* Item description tooltip */}
                                        {isCollapsed && hoverItem === index && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute left-16 z-50 px-3 py-2 bg-white rounded-lg shadow-lg border border-green-100"
                                                transition={{ duration: 0.15 }}
                                                style={{ width: "max-content", maxWidth: "200px" }}
                                            >
                                                <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-2 h-2 rotate-45 bg-white border-l border-t border-green-100"></div>
                                                <p className="font-medium text-sm text-gray-800">{item.name}</p>
                                                <p className="text-xs text-gray-600">{item.description}</p>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Logout section */}
                    <div className="border-t border-green-100 p-4 backdrop-blur-sm bg-white/30 relative z-10">
                        <motion.button
                            onClick={handleLogout}
                            className={`relative flex items-center p-3 w-full rounded-xl text-red-500 hover:bg-red-50 cursor-pointer transition-all duration-200 ${isCollapsed ? 'justify-center' : ''} overflow-hidden`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Logout animation */}
                            {isLoggingOut && (
                                <motion.div 
                                    className="absolute inset-0 bg-red-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                />
                            )}
                            
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 ${isLoggingOut ? 'text-white' : 'text-red-500'} relative z-10`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span 
                                        className={`ml-3 font-medium text-sm ${isLoggingOut ? 'text-white' : 'text-red-500'} relative z-10`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Main content area */}
            <div className={`transition-all duration-300 ease-out ${isMobile ? 'ml-0' : (isCollapsed ? 'ml-20' : 'ml-72')}`}>
                {/* This is where your main content will go */}
            </div>
        </>
    );
};

export default Sidebar;