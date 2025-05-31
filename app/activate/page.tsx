'use client'

import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react';


const Activate = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        activation_code: '',
        activation_token: '',
    })

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const activationToken = query.get('token');
        setFormData((prevData) => ({ ...prevData, activation_token: activationToken || '' }));
    }, []);

    // console.log(token); 
    

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
        setApiUrl(process.env.NEXT_PUBLIC_API_URL  || 'https://softbackend.run.place');
      }
    }
  }, []);

    const handleActivate = async () => {
        console.log(formData.activation_code, formData.activation_token);
        try {
            const response = await axios.post(`${apiUrl}/api/v1/activate-AdminUser`, {
                activation_code: formData.activation_code,
                activation_token: formData.activation_token,
            })

            if (response.status === 201 || response.data.success) {
                alert('Account activated successfully!')
                router.push('/');
            } else {
                // Handle error response
                alert('Activation failed. Please try again.');
            }
        }
        catch (error) {
            // Handle error
            console.error('Error during activation:', error);
            alert('An error occurred. Please try again.');
        }
}

return (
    <div className='w-full h-screen flex justify-center items-center'>
        <div className="w-[830px] h-[640px] flex flex-col justify-center items-center gap-[42px]">
            <div className="self-stretch h-[25px] text-center text-black text-[32px] font-bold font-['Inter']">Activate Account</div>
            <Image className="w-[273px] h-60" src="/SignIn.png" alt='sign in image' width={380} height={380}  />
            <div className="self-stretch flex flex-col justify-center items-center gap-[20px]">
                <div className="flex gap-[86px]">
                    <div className="h-[68px] relative">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Index</label>
                        <input type="text" id="activation_code" value={formData.activation_code} onChange={handleChange} className="bg-green-200 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-black" placeholder="Enter OTP from mail" />
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={handleActivate}
                className="focus:outline-none text-black bg-[#0cdc09] hover:bg-green-800 hover:border hover:border-[#0cdc09] focus:ring-4 focus:ring-green-300 font-bold font-['Inter'] tracking-[3.60px] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#0cdc09] dark:hover:bg-transparent dark:focus:ring-green-800 transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"

            >
                Activate
            </button>
        </div>
    </div>
);
}

export default Activate;
