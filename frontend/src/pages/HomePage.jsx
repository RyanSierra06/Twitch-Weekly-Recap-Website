import { PlayCircle, Star, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
    const { user, login, logout, loading } = useAuth();
    return (
        <body className="min-h-screen bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full">
            <main className="max-w-5xl mx-auto p-5 space-y-9 pt-18">
                <section className="text-center space-y-4">
                    <h1 className="text-5xl md:text-[4.9rem] font-extrabold text-white text-center leading-tight max-w-4xl mx-auto">
                        Never miss a{' '}
                        <span className="bg-gradient-to-r from-[#a471cf] to-[#f073ba] bg-clip-text text-transparent">
                            moment
                        </span>{' '}
                        from your favorite streamers
                    </h1>
                    <p className="text-xl text-[#ffc8fe] leading-relaxed max-w-4xl mx-auto">
                        Catch up on the streams you missed from the streamers you follow with personalized recaps,
                        highlight reels, top clips, and full VODs from the past week. Perfect for busy viewers who want to watch
                        the best moments without having to watch full VODs from start to finish.
                    </p>
                </section>

                <section className="text-center space-y-5">
                    {!loading && !user && (
                        <div
                            className="bg-[#a471cf] px-9 py-0 rounded-lg shadow-md border-white hover:transform hover:scale-105 hover:shadow-xl transition-all duration-250 ease-in-out cursor-pointer w-fit mx-auto"
                            onClick={login}
                        >
                            <div className="flex items-center space-x-1">
                                <img
                                    src="/HomePageIcon.png"
                                    alt="Twitch Icon"
                                    className="w-9 h-13 object-contain"
                                />
                                <p className="text-[1.05rem] text-white p-5 font-semibold rounded-md">
                                    Login
                                </p>
                            </div>
                        </div>
                    )}
                    {!loading && user && (
                        <div
                            className="bg-[#a471cf] px-9 py-0 rounded-lg shadow-md border-white hover:transform hover:scale-105 hover:shadow-xl transition-all duration-250 ease-in-out cursor-pointer w-fit mx-auto"
                            onClick={logout}
                        >
                            <div className="flex items-center space-x-1">
                                <img
                                    src="/HomePageIcon.png"
                                    alt="Twitch Icon"
                                    className="w-9 h-13 object-contain"
                                />
                                <p className="text-[1.05rem] text-white p-5 font-semibold rounded-md">
                                    Logout
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                <section className="mt-14 px-3">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="bg-[#4f3d35]/80 border border-[#b08b6f] rounded-xl text-white text-center shadow-lg p-7 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-2xl duration-200">
                            <div className="bg-gradient-to-tr from-[#a471cf] to-[#f073ba] rounded-xl p-2.5 mb-3.5 inline-block">
                                <PlayCircle className="h-9 w-9 text-white" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold mb-1.5">Stream Highlights</h3>
                            <p className="text-[1.05rem] text-[#ffc8fe]">An automatically curated playlist of the best moments from each stream.</p>
                        </div>

                        <div className="bg-[#4f3d35]/80 border border-[#b08b6f] rounded-xl text-white text-center shadow-lg p-7 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-2xl duration-200">
                            <div className="bg-gradient-to-tr from-[#a471cf] to-[#f073ba] rounded-xl p-2.5 mb-3.5 inline-block">
                                <Star className="h-9 w-9 text-white" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold mb-1.5">Top 3 Clips</h3>
                            <p className="text-[1.05rem] text-[#ffc8fe]">The 3 most viewed clips from each day that viewers loved the most.</p>
                        </div>

                        <div className="bg-[#4f3d35]/80 border border-[#b08b6f] rounded-xl text-white text-center shadow-lg p-7 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-2xl duration-200">
                            <div className="bg-gradient-to-tr from-[#a471cf] to-[#f073ba] rounded-xl p-2.5 mb-3.5 inline-block">
                                <Video className="h-9 w-9 text-white" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold mb-1.5">Full VODs</h3>
                            <p className="text-[1.05rem] text-[#ffc8fe]">Access complete streams whenever you want to dive deeper.</p>
                        </div>
                    </div>
                </section>
            </main>
        </body>
    )
}