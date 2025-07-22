import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full">
      <div className="bg-[#3a2b2f]/80 border border-[#ffc8fe] rounded-2xl p-8 flex flex-col items-center shadow-lg max-w-md w-full mx-auto">
        <span className="text-4xl mb-2 text-[#ffc8fe] font-extrabold">404</span>
        <span className="text-2xl text-white mb-2 font-bold text-center">This page doesn't exist</span>
        <span className="text-lg text-[#ffc8fe] mb-6 text-center">The page you are looking for could not be found.</span>
        <button
          onClick={() => navigate('/')}
          className="bg-[#a471cf] text-white px-8 py-3 rounded-lg font-semibold shadow-md flex items-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-xl text-lg"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
} 