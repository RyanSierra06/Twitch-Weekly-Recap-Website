import React from 'react';

export default function LoginPrompt({ onLogin, message = 'You need to log in to view this page.' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full">
      <div className="bg-[#3a2b2f]/80 border border-[#ffc8fe] rounded-2xl p-8 flex flex-col items-center shadow-lg max-w-md w-full mx-auto">
        <span className="text-3xl mb-2 text-[#ffc8fe] font-extrabold">Welcome!</span>
        <span className="text-lg text-white mb-4 text-center">{message}</span>
        <button
          onClick={onLogin}
          className="mt-2 bg-[#a471cf] text-white px-8 py-3 rounded-lg font-semibold shadow-md flex items-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-xl text-lg"
        >
          <img
            src="/HomePageIcon.png"
            alt="Twitch Icon"
            className="w-7 h-7 object-contain"
          />
          <span>Login</span>
        </button>
      </div>
    </div>
  );
} 