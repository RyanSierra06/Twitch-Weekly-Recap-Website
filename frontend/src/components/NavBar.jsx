import { Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NavBar() {
    const { user, loading, login, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#45323f] to-[#4a3234] shadow-sm z-50 border-b border-[#b08b6f]/40">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div
                        className="bg-[#a471cf] rounded-lg p-1.5 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigate('/')}
                        title="Go to Home"
                    >
                        <Play className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                    <div
                        className="flex flex-col leading-tight cursor-pointer hover:text-[#ffc8fe] transition-colors"
                        onClick={() => navigate('/')}
                        title="Go to Home"
                    >
                        <span className="text-lg font-extrabold text-[#ffc8fe] tracking-tight">TwitchRecap</span>
                        <span className="text-xs text-white/80 -mt-1">Never miss a moment</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4 h-10">
                    {user ? (
                        <>
                            <button
                                onClick={() => navigate('/')}
                                className={`flex items-center h-full text-white font-medium hover:text-[#ffc8fe] transition-colors border-b-2 ${isActive('/') ? 'border-[#ffc8fe]' : 'border-transparent'}`}
                            >
                                <span className="mx-auto">Home</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={`flex items-center h-full text-white font-medium hover:text-[#ffc8fe] transition-colors border-b-2 ${isActive('/dashboard') ? 'border-[#ffc8fe]' : 'border-transparent'}`}
                            >
                                <span className="mx-auto">Dashboard</span>
                            </button>
                            <button
                                onClick={() => navigate('/profile')}
                                className={`flex items-center h-full text-white font-medium hover:text-[#ffc8fe] transition-colors border-b-2 ${isActive('/profile') ? 'border-[#ffc8fe]' : 'border-transparent'}`}
                            >
                                <span className="mx-auto">Profile</span>
                            </button>
                            <button onClick={logout} className="flex items-center space-x-2 h-full bg-[#a471cf] px-4 py-1 rounded-md shadow-md border-white text-white font-semibold hover:scale-105 transition-all border-0">
                                <img
                                    src="/HomePageIcon.png"
                                    alt="Twitch Icon"
                                    className="w-6 h-6 object-contain"
                                />
                                <span className="text-sm font-semibold">Logout</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={login}
                            className="flex items-center space-x-2 h-full bg-[#a471cf] px-4 py-1 rounded-md shadow-md border-white text-white font-semibold hover:scale-105 transition-all border-0"
                        >
                            <img
                                src="/HomePageIcon.png"
                                alt="Twitch Icon"
                                className="w-6 h-6 object-contain"
                            />
                            <span className="text-sm font-semibold">Login</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}