'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';
import { log } from "console";

interface Admin {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface AdminContextType {
    admin: Admin | null;
    setAdmin: React.Dispatch<React.SetStateAction<Admin | null>>;
    loading: boolean;
    error: string | null;
    logout: () => void; // Add logout function type
}

const AdminContext = createContext<AdminContextType>({
    admin: null,
    setAdmin: () => null,
    loading: false,
    error: null,
    logout: () => null
});

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const [admin, setAdmin] = useState<Admin | null>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('adminData');
            return cached ? JSON.parse(cached) : null;
        }
        return null;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminData');
        setAdmin(null);
        window.location.href = '/signin'; // Redirect to signin page
    };

    useEffect(() => {
        let mounted = true;

        const fetchAdmin = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    if (mounted) {
                        setLoading(false);
                        setAdmin(null);
                    }
                    return;
                }

                const response = await axios.get('http://localhost:4000/api/v1/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success && mounted) {
                    const userData = response.data.user;
                    setAdmin(userData);
                    localStorage.setItem('adminData', JSON.stringify(userData));
                }
            } catch (err) {
                if (mounted) {
                    console.error('Error fetching admin:', err);
                    setError(err instanceof Error ? err.message : 'An error occurred');
                    localStorage.removeItem('adminData');
                    localStorage.removeItem('token');
                    setAdmin(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchAdmin();

        return () => {
            mounted = false;
        };
    }, []);

    

    const value = {
        admin,
        setAdmin,
        loading,
        error,
        logout
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};

export default AdminContext;