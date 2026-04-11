import { useEffect, useRef, useState } from 'react';
import { MdCallEnd, MdCall, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdAutoFixHigh } from 'react-icons/md';

const VideoCallModal = ({ 
    callStatus, 
    callContext, 
    myStream, 
    remoteStream, 
    onAnswer, 
    onReject, 
    onEnd,
    toggleMic,
    toggleVideo,
    isMicOn,
    isVideoOn
}) => {
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    
    // 🔥 NEW: Cinematic Filters Logic
    const [filterIndex, setFilterIndex] = useState(0);
    const filters = [
        'none', 
        'grayscale(100%)', // Black & White
        'sepia(100%)',     // Vintage/Yellowish
        'invert(100%)',    // Matrix/Negative
        'hue-rotate(90deg)', // Alien Colors
        'contrast(150%) saturate(150%)' // Pop/Vibrant
    ];

    const cycleFilter = () => {
        setFilterIndex((prev) => (prev + 1) % filters.length);
    };

    useEffect(() => {
        if (myVideoRef.current && myStream) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [myStream, callStatus]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callStatus]);

    if (callStatus === 'idle' || !callContext) return null;

    const { type, partner } = callContext;
    const isVideo = type === 'video';
    const currentFilter = filters[filterIndex];

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center font-sans">
            
            {/* RINGING / CALLING SCREEN */}
            {(callStatus === 'receiving' || callStatus === 'calling') && (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 scale-150"></div>
                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-40 scale-110"></div>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 relative z-10 bg-slate-800">
                            <img src={partner?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-2">{partner?.name}</h2>
                    <p className="text-indigo-300 uppercase tracking-widest text-sm font-semibold mb-12">
                        {callStatus === 'receiving' ? `Incoming ${type} call...` : `Calling...`}
                    </p>

                    <div className="flex gap-8">
                        {callStatus === 'receiving' && (
                            <button onClick={onAnswer} className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-110 outline-none">
                                <MdCall className="text-white text-3xl" />
                            </button>
                        )}
                        <button onClick={callStatus === 'receiving' ? onReject : onEnd} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-110 outline-none">
                            <MdCallEnd className="text-white text-3xl" />
                        </button>
                    </div>
                </div>
            )}

            {/* CONNECTED / ACTIVE CALL SCREEN */}
            {callStatus === 'connected' && (
                <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden">
                    
                    {/* Remote Video/Audio */}
                    {isVideo ? (
                        <video 
                            ref={remoteVideoRef} 
                            autoPlay 
                            playsInline 
                            style={{ filter: currentFilter, transition: 'filter 0.5s ease-in-out' }} // 🔥 Filter Applied Here
                            className="w-full h-full object-cover bg-slate-900"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-6">
                                <img src={partner?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">{partner?.name}</h2>
                            <p className="text-emerald-400 font-mono mt-2 animate-pulse">Connected</p>
                            <audio ref={remoteVideoRef} autoPlay /> 
                        </div>
                    )}

                    {/* Local Video */}
                    <div className={`absolute top-6 right-6 w-32 md:w-48 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 z-10 transition-all ${!isVideo ? 'opacity-0' : ''}`}>
                        <video 
                            ref={myVideoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            style={{ filter: currentFilter, transition: 'filter 0.5s ease-in-out' }} // 🔥 Filter Applied Here too
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* 🔥 Filter Status Indicator */}
                    {isVideo && filterIndex !== 0 && (
                        <div className="absolute top-6 left-6 bg-indigo-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-20">
                            Filter Active
                        </div>
                    )}

                    {/* Call Controls Dock */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur-xl px-6 md:px-8 py-3 md:py-4 rounded-full border border-slate-700 shadow-2xl flex items-center gap-4 md:gap-6 z-20">
                        <button onClick={toggleMic} className={`p-3 md:p-4 rounded-full transition-all outline-none ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}>
                            {isMicOn ? <MdMic className="text-xl md:text-2xl" /> : <MdMicOff className="text-xl md:text-2xl" />}
                        </button>
                        
                        {isVideo && (
                            <button onClick={toggleVideo} className={`p-3 md:p-4 rounded-full transition-all outline-none ${isVideoOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}>
                                {isVideoOn ? <MdVideocam className="text-xl md:text-2xl" /> : <MdVideocamOff className="text-xl md:text-2xl" />}
                            </button>
                        )}

                        {/* 🔥 NEW: Magic Filter Button */}
                        {isVideo && (
                            <button onClick={cycleFilter} title="Change Filter" className="p-3 md:p-4 bg-slate-700 hover:bg-indigo-600 rounded-full text-indigo-300 hover:text-white transition-all outline-none active:scale-95">
                                <MdAutoFixHigh className="text-xl md:text-2xl" />
                            </button>
                        )}

                        <button onClick={onEnd} className="p-3 md:p-4 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all outline-none hover:scale-110 ml-2">
                            <MdCallEnd className="text-xl md:text-2xl" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCallModal;