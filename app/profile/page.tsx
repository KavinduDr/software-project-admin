'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, FileLock, FileLock2, Lock, Mail, PersonStanding } from "lucide-react";

export default function EditProfile() {
    const router = useRouter();
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        oldPassword: '',
        newPassword: '',
    });
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        oldPassword: '',
        newPassword: '',
    });

    const [apiUrl, setApiUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setApiUrl(window.location.hostname === 'localhost' ? 'http://localhost:4000' : process.env.NEXT_PUBLIC_DEPLOYMENT_URL || 'https://softbackend.run.place');
        }
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/v1/get-profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProfile({ ...profile, name: response.data.name, email: response.data.email });
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { name: '', email: '', oldPassword: '', newPassword: '' };

        if (!profile.name && !(profile.oldPassword.length > 0) && !(profile.newPassword.length > 0)) {
            newErrors.name = 'Name is required';
            isValid = false;
        }

        if (!profile.email && !(profile.oldPassword.length > 0) && !(profile.newPassword.length > 0)) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) && !(profile.oldPassword.length > 0) && !(profile.newPassword.length > 0)) {
            newErrors.email = 'Enter a valid email';
            isValid = false;
        }

        if (profile.oldPassword && profile.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setProfile({ ...profile, [id]: value });

        if (errors[id as keyof typeof errors]) {
            setErrors({ ...errors, [id]: '' });
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        const profileData = {
            name: profile.name,
            email: profile.email,
        }

        const passwordData = {
            oldPassword: profile.oldPassword,
            newPassword: profile.newPassword,
        }

        if (profileData.name.length > 0 || profileData.email.length > 0) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`${apiUrl}/api/v1/update-profile`, profileData, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                toast.success('Profile updated successfully!');
                router.push('/dashboard');
            } catch (error) {
                console.error('Error updating profile:', error);
                toast.error('Failed to update profile');
            }
        }

        if (passwordData.oldPassword.length > 0 && passwordData.newPassword.length > 0) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`${apiUrl}/api/v1/update-password`, passwordData, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                toast.success('Password updated successfully!');
                router.push('/dashboard');
            } catch (error) {
                console.error('Error updating password:', error);
                toast.error('Failed to update password');
            }
        }
    };

    const toggleOldPasswordVisibility = () => {
        setShowOldPassword(!showOldPassword);
    };
    const toggleNewPasswordVisibility = () => {
        setShowNewPassword(!showNewPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
            {/* Cute decorative elements */}
            <div className="absolute top-50 right-10 w-16 h-16 rounded-full bg-green-200 opacity-60"></div>
            <div className="absolute top-10 left-20 w-24 h-24 rounded-full bg-green-200 opacity-40"></div>
            <div className="absolute bottom-10 left-1/4 w-20 h-20 rounded-full bg-green-200 opacity-50"></div>
            <div className="absolute bottom-20 right-1/3 w-12 h-12 rounded-full bg-green-200 opacity-30"></div>


            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[500px] relative z-10"
            >
                <Card className="rounded-3xl shadow-lg bg-white/90 backdrop-blur-md p-8 border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-3xl font-bold text-center">Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <PersonStanding size={18} />
                                </div>
                                <Input placeholder="Name" id="name" className="h-12 pl-12 rounded-xl bg-green-50/80 border-0 " value={profile.name} onChange={handleChange} />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <Input placeholder="Email" id="email" className="h-12 pl-12 rounded-xl bg-green-50/80 border-0 " type="email" value={profile.email} onChange={handleChange} />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <FileLock2 size={18} />
                                </div>
                                <Input type={showOldPassword ? "text" : "password"} placeholder="Old Password" id="oldPassword" className="h-12 pl-12 rounded-xl bg-green-50/80 border-0 " value={profile.oldPassword} onChange={handleChange} />
                                {errors.oldPassword && <p className="text-sm text-red-500">{errors.oldPassword}</p>}
                                <button
                                    type="button"
                                    onClick={toggleOldPasswordVisibility}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <Input type={showNewPassword ? "text" : "password"} placeholder="New Password" id="newPassword" className="h-12 pl-12 rounded-xl bg-green-50/80 border-0 " value={profile.newPassword} onChange={handleChange} />
                                {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword}</p>}
                                <button
                                    type="button"
                                    onClick={toggleNewPasswordVisibility}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={handleSubmit}>
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
