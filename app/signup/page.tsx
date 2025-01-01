'use client'

import { useRouter } from 'next/navigation'

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SignUp: React.FC = () => {

    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        registrationNumber: '',
        password: '',
        confirmPassword: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }
    const [apiUrl, setApiUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // This will run only on the client side
            if (window.location.hostname === 'localhost') {
                setApiUrl('http://localhost:4000');
            } else {
                setApiUrl('http://13.228.36.212');
            }
        }
    }, []);
    const handleSignUp = async () => {
        // console.log({
        //   name: formData.name,
        //   email: formData.email,
        //   password: formData.password,
        //   registrationNumber: formData.registrationNumber,
        // });
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match')
            return
        }

        try {
            const response = await axios.post(`${apiUrl}/api/v1/AdminRegistration`, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            if (response.status === 201 || response.data.success) {
                if (response.data.activationToken) {
                    const token = response.data.activationToken;
                    alert(`Registration successful! Please check your email to activate your account.`);
                    router.push(`/activate?token=${token}`);
                } else {
                    // Registration successful, and no activation needed
                    router.push('/dashboard');
                }
            } else {
                // Handle error response
                alert('Registration failed. Please try again.');
            }
        } catch (error) {
            // Handle error
            console.error('Error during registration:', error);
            alert('An error occurred. Please try again.');
        }
    }

    return (
        <div className='w-full h-screen flex justify-center items-center'>
            <div className="w-[372px] h-[635px] flex flex-col justify-start items-center gap-[27px]">
                <div className="self-stretch h-7 text-center text-black text-[32px] font-bold font-['Inter']">Signing you UP!</div>

                <div className="h-[68px] relative w-full">
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} className="bg-green-200 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-black" placeholder="Perera A.B.C." />
                </div>

                <div className="h-[68px] relative w-full">
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                    <input type="email" id="email" value={formData.email} onChange={handleChange} className="bg-green-200 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-black" placeholder="name@flowbite.com" />
                </div>

                <div className="h-[68px] relative w-full">
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                    <input type="password" id="password" value={formData.password} onChange={handleChange} className="bg-green-200 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-black" placeholder="Password" />
                </div>

                <div className="h-[68px] relative w-full">
                    <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm Password</label>
                    <input type="password" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="bg-green-200 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-black" placeholder="Confirm Password" />
                </div>

                <button
                    type="button"
                    onClick={handleSignUp}
                    className="focus:outline-none text-black bg-[#0cdc09] hover:bg-green-800 hover:border hover:border-[#0cdc09] focus:ring-4 focus:ring-green-300 font-bold font-['Inter'] tracking-[3.60px] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#0cdc09] dark:hover:bg-transparent dark:focus:ring-green-800 transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                >
                    Sign up
                </button>

                <div className="flex flex-row items-center gap-2">
                    <div className="text-black text-xl font-light font-['Inter']">Already have an account?</div>
                    <button
                        onClick={() => router.push('/')}
                        className="text-blue-500 hover:underline text-xl font-bold font-['Inter']"
                    >
                        Sign in
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
