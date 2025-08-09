import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginError() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth_failed':
        return 'Authentication with Twitch failed. Please try again.';
      case 'no_user':
        return 'No user data received from Twitch. Please try again.';
      case 'login_failed':
        return 'Login process failed. Please try again.';
      case 'session_save_failed':
        return 'Session creation failed. Please try again.';
      default:
        return 'An error occurred during login. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#45323f] to-[#4a3234] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-[#3a2b2f]/80 border border-[#b08b6f] rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Login Failed</h1>
            <p className="text-[#ffc8fe]">{getErrorMessage(error)}</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full bg-gradient-to-r from-[#a471cf] to-[#f073ba] text-white font-semibold py-3 px-6 rounded-lg hover:from-[#8b5bb8] hover:to-[#d85aa3] transition-all duration-200"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-transparent border border-[#b08b6f] text-[#b08b6f] font-semibold py-3 px-6 rounded-lg hover:bg-[#b08b6f] hover:text-white transition-all duration-200"
            >
              Go Home
            </button>
          </div>
          
          <div className="mt-6 text-sm text-[#b08b6f]">
            <p>If this problem persists, please check your internet connection and try again.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
