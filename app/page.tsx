'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAdmin } from "./context/AdminContext";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card } from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
    const [showPassword, setShowPassword] = useState(false);
    const { setAdmin } = useAdmin();
    const [apiUrl, setApiUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setApiUrl(window.location.hostname === 'localhost' ? 'http://localhost:4000' : process.env.NEXT_PUBLIC_DEPLOYMENT_URL || 'https://softbackendnewrender.onrender.com');
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
        const { id, value } = e.target as HTMLInputElement;
        setFormData({ ...formData, [id]: value });

        // Clear error when user starts typing
        if (id in errors) {
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

            if (response.status === 200 || response.data.success) {
                const token = response.data.accessToken;
                sessionStorage.setItem('name', response.data.user.name);

                // Store token in either localStorage or sessionStorage based on 'rememberMe'
                if (rememberMe) {
                    try {
                        localStorage.setItem('token', token);
                    } catch (e) {
                        console.error('Error storing token in localStorage:', e);
                    }
                } else {
                    // For non-remember-me, store in sessionStorage (and localStorage for compatibility)
                    localStorage.setItem('token', token);
                    sessionStorage.setItem('token', token);
                }

                // Update admin context
                setAdmin(response.data.user);

                // Set the Authorization header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

                toast.success('Successfully signed in!');
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Error during sign in:', error);
            const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
                ? error.response.data.message
                : 'Invalid email or password';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
            setShowLoading(false);
        }
    };

    const handleResetPassword = () => {
        router.push('/forgot-password');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // stuff for animate bubbles with framer motion

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4" >
            {/* Cute decorative elements */}
            <motion.div
                initial={{ top: Math.random() * 100, left: Math.random() * 100 }}
                animate={{ top: Math.random() * 100, left: Math.random() * 100 }}
                transition={{ duration: 1.0, repeat: Infinity, repeatType: "reverse" }}
                className="absolute w-16 h-16 rounded-full bg-green-200 opacity-60"
            >
            </motion.div>
            <motion.div
                initial={{ top: Math.random() * 100, right: Math.random() * 100 }}
                animate={{ bottom: Math.random() * 100, right: Math.random() * 100 }
                }
                transition={{ duration: 1.0, repeat: Infinity, repeatType: "reverse" }}
                className="absolute w-24 h-24 rounded-full bg-green-200 opacity-60"></motion.div>
            <motion.div className="absolute bottom-10 left-1/4 w-20 h-20 rounded-full bg-green-200 opacity-50"></motion.div>
            <motion.div className="absolute bottom-20 right-1/3 w-12 h-12 rounded-full bg-green-100 opacity-30"></motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[500px] relative z-10"
            >
                <Card className="rounded-3xl shadow-lg bg-white/90 backdrop-blur-md p-8 border-0">
                    <div className="flex flex-col items-center">
                        <div className="mb-6">
                            <Image
                                src="/SignIn.png"
                                alt="Sign in illustration"
                                width={180}
                                height={180}
                                priority
                                className="rounded-2xl"
                            />
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign in with email</h1>
                            <p className="text-gray-600">
                                Signup for free,<br />

                            </p>
                        </div>

                        <div className="space-y-5 w-full">
                            <div className="space-y-2">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`h-12 pl-12 rounded-xl bg-green-50/80 border-0 ${errors.email ? 'ring-2 ring-red-500' : 'focus:ring-green-300'}`}
                                    />
                                </div>
                                {errors.email && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-sm text-red-500 mt-1 pl-2"
                                    >
                                        {errors.email}
                                    </motion.p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`h-12 pl-12 pr-12 rounded-xl bg-green-50/80 border-0 ${errors.password ? 'ring-2 ring-red-500' : 'focus:ring-green-300'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-sm text-red-500 mt-1 pl-2"
                                    >
                                        {errors.password}
                                    </motion.p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    variant="link"
                                    className="text-green-600 hover:text-green-800 p-0 text-sm"
                                    onClick={handleResetPassword}
                                >
                                    Forgot password?
                                </Button>
                            </div>

                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <Button
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium"
                                    onClick={handleSignIn}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span>Signing in...</span>
                                        </div>
                                    ) : (
                                        'Get Started'
                                    )}
                                </Button>
                            </motion.div>

                            <div className="flex items-center space-x-2 mt-4">
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                                    className="data-[state=checked]:bg-green-500 border-gray-300"
                                />
                                <Label htmlFor="remember" className="text-sm text-gray-600">Remember me</Label>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <span className="text-gray-500 text-sm">Don&apos;t have an account?</span>
                            <Button
                                variant="link"
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                onClick={() => router.push('/signup')}
                            >
                                Sign Up
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div >
    );
}