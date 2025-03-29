'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAdmin } from "./context/AdminContext";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({
        email: '',
        password: '',
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const { setAdmin } = useAdmin();
    const [apiUrl, setApiUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setApiUrl(window.location.hostname === 'localhost' ? 'http://localhost:4000' : process.env.NEXT_PUBLIC_DEPLOYMENT_URL || '');
        }
    }, []);

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            email: '',
            password: '',
        };

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
        
        // Clear error when user starts typing
        if (errors[id as keyof typeof errors]) {
            setErrors({ ...errors, [id]: '' });
        }
    };

    const handleSignIn = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        setIsLoading(true);
        setShowLoading(false);
        setTimeout(() => setShowLoading(true), 500); // 500ms delay before showing the loading component

        try {
            const response = await axios.post(`${apiUrl}/api/v1/login-AdminUser`, {
                email: formData.email,
                password: formData.password,
            });

            console.log('Response Data:', response.data);

            if (response.status === 200 || response.data.success) {
                const token = response.data.accessToken;
                sessionStorage.setItem('name', response.data.user.name);

                console.log('Token before request:', token);

                // Store token in either localStorage or sessionStorage based on 'rememberMe'
                if (rememberMe) {
                    try {
                        localStorage.setItem('token', token);
                        console.log('Token stored in localStorage:', localStorage.getItem('token'));
                    } catch (e) {
                        console.error('Error storing token in localStorage:', e);
                    }
                } else {
                    // For non-remember-me, store in sessionStorage (and localStorage for compatibility)
                    localStorage.setItem('token', token);
                    sessionStorage.setItem('token', token);
                    console.log('Token stored in sessionStorage:', sessionStorage.getItem('token'));
                }

                // Update admin context
                setAdmin(response.data.user);
                
                // Set the Authorization header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
                
                toast.success('Successfully signed in!');
                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error('Error during sign in:', error);
            const errorMessage = error.response?.data?.message || 'Invalid email or password';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
            setShowLoading(false);
        }
    };

    const handleResetPassword = () => {
        router.push('/forgot-password');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted px-4">
            <Card className="w-full max-w-[830px] shadow-xl">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <CardTitle className="text-3xl font-bold">Sign in</CardTitle>
                    <Image
                        src="/SignIn.png"
                        alt="Sign in illustration"
                        width={273}
                        height={240}
                        className="mt-6"
                        priority
                    />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`bg-background ${errors.email ? 'border-red-500' : ''}`}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`bg-background ${errors.password ? 'border-red-500' : ''}`}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                />
                                <Label htmlFor="remember" className="text-sm">Remember me</Label>
                            </div>
                            <Button
                                variant="link"
                                className="text-primary hover:text-primary/80"
                                onClick={handleResetPassword}
                            >
                                Forgot Password?
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                            onClick={handleSignIn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>

                        <div className="text-center space-x-2">
                            <span className="text-muted-foreground">Don't have an account?</span>
                            <Button
                                variant="link"
                                className="text-primary hover:text-primary/80"
                                onClick={() => router.push('/signup')}
                            >
                                Sign Up
                            </Button>
                        </div>
                        {/* Edit Profile Button */}
<div className="text-center mt-4">
    <Button
        variant="outline"
        className="text-primary border-primary hover:bg-primary hover:text-white"
        onClick={() => router.push('/profile')}
    >
        Edit Profile
    </Button>
</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}