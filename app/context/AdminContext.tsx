'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';

interface Admin {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface AdminContextType {
    admin: Admin | null;
    setAdmin: React.Dispatch<React.SetStateAction<Admin | null>>;
    loading: boolean; // Add loading state
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [loading, setLoading] = useState(true); // Set loading state to true initially

    useEffect(() => {
        // Check sessionStorage first, fallback to localStorage
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

        if (token && storedUser) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setAdmin(JSON.parse(storedUser)); // Restore admin state
        }

        setLoading(false); // Set loading state to false once data is restored
    }, []);

    return (
        <AdminContext.Provider value={{ admin, setAdmin, loading }}>
            {children}
        </AdminContext.Provider>
    );
};
