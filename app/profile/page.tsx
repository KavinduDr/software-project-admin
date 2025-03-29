'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";

export default function EditProfile() {
    const router = useRouter();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

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
        const newErrors = { name: '', email: '', password: '', confirmPassword: '' };

        if (!profile.name) {
            newErrors.name = 'Name is required';
            isValid = false;
        }

        if (!profile.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
            newErrors.email = 'Enter a valid email';
            isValid = false;
        }

        if (profile.password && profile.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (profile.password && profile.password !== profile.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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

        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/v1/update-profile', profile, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success('Profile updated successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted px-4">
            <Card className="w-full max-w-[600px] shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold text-center">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={profile.name} onChange={handleChange} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={profile.email} onChange={handleChange} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" value={profile.password} onChange={handleChange} />
                            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" value={profile.confirmPassword} onChange={handleChange} />
                            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={handleSubmit}>
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
