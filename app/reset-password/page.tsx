'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2 } from "lucide-react";
import { Suspense } from 'react';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const [formData, setFormData] = useState({
        resetCode: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [step, setStep] = useState('verify'); // 'verify' or 'reset'
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    useEffect(() => {
        const resetToken = sessionStorage.getItem('resetToken');
        if (!resetToken || !email) {
            router.push('/forgot-password');
        }
    }, [email, router]);

    const verifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
    
        try {
            const resetToken = sessionStorage.getItem('resetToken');
            const response = await axios.get(`${apiUrl}/api/v1/verify-reset-token`, {
                params: {
                    resetToken,
                    resetCode: formData.resetCode
                }
            });
    
            if (response.data.success) {
                setStep('reset');
                setMessage('');
            }
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Invalid reset code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const resetToken = sessionStorage.getItem('resetToken');
            const response = await axios.post(`${apiUrl}/api/v1/reset-password`, {
                resetToken,
                newPassword: formData.newPassword
            });

            if (response.data.success) {
                sessionStorage.removeItem('resetToken');
                setMessage('Password reset successful!');
                setTimeout(() => router.push('/'), 2000);
            }
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted px-4">
            <Card className="w-full max-w-[500px] shadow-xl">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <CardTitle className="text-2xl font-bold">
                        {step === 'verify' ? 'Enter Reset Code' : 'Reset Password'}
                    </CardTitle>
                    <Image
                        src="/reset-password.png"
                        alt="Reset password illustration"
                        width={200}
                        height={200}
                        className="mt-6"
                        priority
                    />
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 'verify' ? (
                        <form onSubmit={verifyCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="resetCode">Reset Code</Label>
                                <Input
                                    id="resetCode"
                                    type="text"
                                    placeholder="Enter the code sent to your email"
                                    value={formData.resetCode}
                                    onChange={(e) => setFormData({ ...formData, resetCode: e.target.value })}
                                    required
                                    className="bg-background"
                                />
                            </div>

                            {message && (
                                <p className="text-sm text-red-500">
                                    {message}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-green-500 hover:bg-green-600 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Code'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={resetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter your new password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    required
                                    className="bg-background"
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    className="bg-background"
                                    minLength={6}
                                />
                            </div>

                            {message && (
                                <p className={`text-sm ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
                                    {message}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-green-500 hover:bg-green-600 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="text-center space-x-2">
                        <Button
                            variant="link"
                            className="text-primary hover:text-primary/80"
                            onClick={() => router.push('/')}
                        >
                            Back to Sign In
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}