/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { 
  MdChatBubbleOutline, MdSend, MdAttachFile, MdMood, 
  MdPhone, MdVideocam, MdDeleteOutline, MdClose, MdMic, MdStop, MdCheck,
  MdDarkMode, MdLightMode, MdKeyboardArrowDown, MdArrowBack // 🔥 Imported MdArrowBack
} from 'react-icons/md';
import MessageBubble from './MessageBubble'; 

// 🔥 Added onBack prop
const ChatArea = ({ selectedUser, myId, messageList, users, onSendMessage, onForwardMessage, onDeleteMessage, onClearChat, socket, onInitiateCall, onLoadMore, hasMoreMessages, isLoadingHistory, onReact, isDarkMode, toggleDarkMode, onBack }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false); 
  const [replyingTo, setReplyingTo] = useState(null); 
  
  const [forwardMessageData, setForwardMessageData] = useState(null);
  const [selectedForwardContacts, setSelectedForwardContacts] = useState([]);

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); 
  const typingTimeoutRef = useRef(null); 
  const inputRef = useRef(null); 
  
  const chatContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  const CLOUD_NAME = "dertukhn8";
  const UPLOAD_PRESET = "nexuschat_preset";

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight > 150) { setShowScrollButton(true); } else { setShowScrollButton(false); }
    if (scrollTop === 0 && hasMoreMessages && !isLoadingHistory) {
      prevScrollHeightRef.current = scrollHeight;
      onLoadMore();
    }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  useEffect(() => {
    if (prevScrollHeightRef.current > 0 && chatContainerRef.current) {
      const newScrollHeight = chatContainerRef.current.scrollHeight;
      chatContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0; 
    } else { scrollToBottom(); }
  }, [messageList.length]); 

  useEffect(() => {
    if (!socket) return;
    const handleUserTyping = ({ userId }) => { if (selectedUser && userId === selectedUser._id) setIsTyping(true); };
    const handleUserStoppedTyping = ({ userId }) => { if (selectedUser && userId === selectedUser._id) setIsTyping(false); };
    socket.on("user_typing", handleUserTyping); socket.on("user_stopped_typing", handleUserStoppedTyping);
    return () => { socket.off("user_typing", handleUserTyping); socket.off("user_stopped_typing", handleUserStoppedTyping); };
  }, [socket, selectedUser]);

  useEffect(() => { return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); }; }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!socket || !selectedUser) return;
    const roomId = selectedUser.isGroup ? selectedUser._id : [myId, selectedUser._id].sort().join("_");
    socket.emit("typing", { roomId, userId: myId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { socket.emit("stop_typing", { roomId, userId: myId }); }, 2000);
  };

  const handleSend = () => {
    if (message.trim() !== '' || replyingTo) {
      onSendMessage({ text: message, replyTo: replyingTo ? replyingTo._id : null });
      setMessage(''); setShowEmojiPicker(false); setReplyingTo(null); 
      if (socket && selectedUser) {
         const roomId = selectedUser.isGroup ? selectedUser._id : [myId, selectedUser._id].sort().join("_");
         socket.emit("stop_typing", { roomId, userId: myId }); clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("File size must be under 15MB"); return; } 
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    const toastId = toast.loading(`Uploading file...`);
    try {
      const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", UPLOAD_PRESET);
      const cloudinaryRes = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, formData);
      const fileUrl = cloudinaryRes.data.secure_url;
      
      let payload = { text: "", replyTo: replyingTo ? replyingTo._id : null };
      if (isImage) payload.imageUrl = fileUrl;
      else if (isVideo) payload.videoUrl = fileUrl;
      else { payload.documentUrl = fileUrl; payload.documentName = file.name; }
      
      onSendMessage(payload); setReplyingTo(null); toast.success("File sent!", { id: toastId });
    } catch (error) { toast.error("Failed to upload file", { id: toastId }); } 
    finally { e.target.value = null; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream); audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' }); stream.getTracks().forEach(track => track.stop());
        if (recordingDuration < 1) { toast.error("Recording too short!"); return; }
        const toastId = toast.loading("Sending voice note...");
        try {
            const formData = new FormData(); formData.append("file", audioBlob, "voice_note.mp3"); formData.append("upload_preset", UPLOAD_PRESET);
            const cloudinaryRes = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, formData);
            onSendMessage({ audioUrl: cloudinaryRes.data.secure_url, replyTo: replyingTo ? replyingTo._id : null });
            setReplyingTo(null); toast.success("Voice note sent!", { id: toastId });
        } catch (error) { toast.error("Failed to send voice note", { id: toastId }); }
      };
      mediaRecorderRef.current.start(); setIsRecording(true); setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => { setRecordingDuration(prev => prev + 1); }, 1000);
    } catch (err) { toast.error("Microphone access denied."); }
  };

  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); clearInterval(recordingTimerRef.current); } };
  const formatRecordingTime = (seconds) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; };
  
  const handleReplyClick = useCallback((msg) => { setReplyingTo(msg); if(inputRef.current) inputRef.current.focus(); }, []);
  
  const handleScrollToMessage = useCallback((msgId) => {
    const targetElement = document.getElementById(`msg-${msgId}`);
    if (targetElement) { targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); const bubble = targetElement.querySelector('.message-bubble'); if (bubble) { bubble.classList.add('ring-4', 'ring-indigo-300', 'scale-[1.02]', 'transition-all', 'duration-300'); setTimeout(() => bubble.classList.remove('ring-4', 'ring-indigo-300', 'scale-[1.02]'), 1000); } } else { toast.error("Original message not found."); }
  }, []);
  
  const submitForward = () => { if (selectedForwardContacts.length > 0 && forwardMessageData) { onForwardMessage(forwardMessageData, selectedForwardContacts); setForwardMessageData(null); setSelectedForwardContacts([]); } };
  const toggleForwardContact = (userId) => { if (selectedForwardContacts.includes(userId)) setSelectedForwardContacts(prev => prev.filter(id => id !== userId)); else setSelectedForwardContacts(prev => [...prev, userId]); };
  
  const formatTime = useCallback((isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), []);
  
  const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString); const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `last seen today at ${time}`;
    if (isYesterday) return `last seen yesterday at ${time}`;
    return `last seen on ${date.toLocaleDateString()} at ${time}`;
  };

  const confirmDeleteMessage = useCallback((msgId, isMe) => {
    toast((t) => (
      <div className={`flex flex-col gap-2 min-w-[220px] relative ${isDarkMode ? 'text-white' : ''}`}>
        <button onClick={() => toast.dismiss(t.id)} className="absolute -top-1 -right-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors outline-none"><MdClose className="text-sm" /></button>
        <span className={`text-sm font-semibold text-center mb-1 mt-1 ${isDarkMode ? 'text-slate-800' : 'text-slate-800'}`}>Delete message?</span>
        <div className="flex flex-col gap-1.5 mt-1">
          {isMe && <button onClick={() => { toast.dismiss(t.id); onDeleteMessage(msgId, 'everyone'); }} className="px-3 py-2.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200 outline-none">Delete for Everyone</button>}
          <button onClick={() => { toast.dismiss(t.id); onDeleteMessage(msgId, 'me'); }} className="px-3 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors outline-none">Delete for Me</button>
        </div>
      </div>
    ), { duration: Infinity, id: `del-${msgId}` });
  }, [onDeleteMessage, isDarkMode]);

  const confirmClearChat = () => {
    toast((t) => (
      <div className="flex flex-col gap-2 min-w-[250px] relative">
        <button onClick={() => toast.dismiss(t.id)} className="absolute -top-1 -right-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors outline-none"><MdClose className="text-sm" /></button>
        <span className="text-sm font-semibold text-slate-800 mt-1">Clear chat history?</span>
        <button onClick={() => { toast.dismiss(t.id); onClearChat(); }} className="w-full mt-2 px-3 py-2.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors outline-none">Clear Chat</button>
      </div>
    ), { duration: Infinity, id: 'clear-chat' });
  };

  if (!selectedUser) return (<div className="flex-1 flex flex-col items-center justify-center p-6 text-center"><div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6"><MdChatBubbleOutline className="text-5xl text-indigo-300 dark:text-indigo-500" /></div><h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">NexusChat Premium</h2></div>);

  return (
    <>
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setFullscreenImage(null)}>
           <button onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-red-500 transition-colors z-50">
             <MdClose className="text-3xl"/>
           </button>
           <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-full object-contain animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <header className={`px-4 sm:px-6 py-4 flex justify-between items-center backdrop-blur-md border-b z-20 absolute top-0 w-full transition-colors ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* 🔥 NEW: Mobile Back Button (Visible only on small screens) */}
          <button onClick={onBack} className={`sm:hidden p-2 -ml-2 rounded-full transition-colors outline-none ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
             <MdArrowBack className="text-2xl" />
          </button>

          <div className="relative">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-100 rounded-full flex items-center justify-center font-bold overflow-hidden"><img src={selectedUser.groupIcon || selectedUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="DP" className="w-full h-full object-cover" /></div>
            {selectedUser.isOnline && !selectedUser.isGroup && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>}
          </div>
          <div>
            <h3 className={`font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-[200px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedUser.groupName || selectedUser.name}</h3>
            <span className={`text-[10px] sm:text-xs font-medium truncate block max-w-[150px] sm:max-w-[250px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isTyping ? <span className="text-indigo-500 font-bold italic animate-pulse">typing...</span> : 
              selectedUser.isGroup ? `${selectedUser.participants?.length || 0} participants` :
              selectedUser.isOnline ? <span className="text-emerald-500 font-bold">Online</span> : (selectedUser.lastSeen ? formatLastSeen(selectedUser.lastSeen) : "Offline")}
            </span>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 text-slate-400">
          <button onClick={toggleDarkMode} title="Toggle Theme" className={`p-2 rounded-full transition-colors outline-none ${isDarkMode ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            {isDarkMode ? <MdLightMode className="text-xl" /> : <MdDarkMode className="text-xl" />}
          </button>
          <button onClick={confirmClearChat} className="p-2 hover:bg-red-500/10 rounded-full text-red-500 transition-colors"><MdDeleteOutline className="text-xl" /></button>
          {!selectedUser.isGroup && (
            <>
              <button onClick={() => onInitiateCall(selectedUser, 'video')} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-indigo-900/50 text-indigo-400' : 'hover:bg-indigo-100 text-indigo-600 bg-indigo-50'}`}><MdVideocam className="text-xl" /></button>
              <button onClick={() => onInitiateCall(selectedUser, 'audio')} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-indigo-900/50 text-indigo-400' : 'hover:bg-indigo-100 text-indigo-600 bg-indigo-50'}`}><MdPhone className="text-xl" /></button>
            </>
          )}
        </div>
      </header>

      <div 
        ref={chatContainerRef} onScroll={handleScroll}
        className={`flex-1 overflow-y-auto p-4 sm:p-6 pt-20 sm:pt-24 ${replyingTo ? 'pb-36' : 'pb-28'} space-y-4 sm:space-y-6 z-10 flex flex-col transition-all relative`}
      >
        <div className={`self-center px-4 py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-400'}`}>{selectedUser.isGroup ? "Group Chat" : "Private Chat"}</div>
        
        {isLoadingHistory && (<div className="self-center text-indigo-500 my-2 animate-bounce"><span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>Loading older messages...</span></div>)}

        {messageList.map((msg) => (
          <MessageBubble 
            key={msg._id} msg={msg} isMe={msg.sender === myId || (msg.sender?._id === myId)} myId={myId} selectedUser={selectedUser}
            handleReplyClick={handleReplyClick} setForwardMessageData={setForwardMessageData} confirmDeleteMessage={confirmDeleteMessage} handleScrollToMessage={handleScrollToMessage} formatTime={formatTime} onReact={onReact} isDarkMode={isDarkMode}
            onImageClick={setFullscreenImage}
          />
        ))}
        
        {isTyping && <div className={`self-start flex items-center gap-2 mt-2 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}><div className="flex gap-1"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span></div></div>}
        <div ref={messagesEndRef} /> 
      </div>

      {showScrollButton && (
          <button 
             onClick={scrollToBottom} 
             className="absolute bottom-24 right-6 sm:bottom-28 sm:right-8 p-2.5 sm:p-3 bg-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform animate-in fade-in slide-in-from-bottom-4 z-40 outline-none"
             title="Scroll to bottom"
          >
             <MdKeyboardArrowDown className="text-xl sm:text-2xl" />
          </button>
      )}

      <div className={`absolute bottom-0 w-full z-20 pb-4 sm:pb-6 pt-4 sm:pt-6 bg-gradient-to-t ${isDarkMode ? 'from-slate-900 to-transparent' : 'from-[#f8fafc] to-transparent'}`}>
        <div className="px-3 sm:px-6 relative">
          {replyingTo && (
            <div className={`mb-2 mx-1 sm:mx-2 p-2 sm:p-3 rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-x flex justify-between items-start animate-in slide-in-from-bottom-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col border-l-4 border-indigo-500 pl-2 sm:pl-3">
                <span className={`text-[10px] sm:text-xs font-bold mb-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Replying to {replyingTo.sender === myId || replyingTo.sender?._id === myId ? "yourself" : (replyingTo.sender?.name || selectedUser.name)}</span>
                <span className={`text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[250px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{replyingTo.documentUrl ? "📄 Document" : replyingTo.videoUrl ? "🎥 Video" : replyingTo.audioUrl ? "🎤 Voice Note" : (replyingTo.text || "📷 Photo")}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className={`p-1 rounded-full transition-colors outline-none ${isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'}`}><MdClose className="text-base sm:text-lg" /></button>
            </div>
          )}

          {showEmojiPicker && <div className={`absolute bottom-full left-4 sm:left-6 mb-2 shadow-2xl rounded-2xl overflow-hidden border z-50 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}><EmojiPicker theme={isDarkMode ? 'dark' : 'light'} width={window.innerWidth < 400 ? '280px' : '350px'} onEmojiClick={(e) => setMessage(p => p + e.emoji)} /></div>}
          
          <div className={`p-1.5 sm:p-2 shadow-xl shadow-slate-200/50 border flex items-center gap-1 sm:gap-2 transition-all duration-300 ${replyingTo ? 'rounded-b-2xl rounded-t-sm' : 'rounded-[2rem]'} ${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-none' : 'bg-white border-slate-100'}`}>
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-3 sm:px-4 py-1 animate-in fade-in">
                 <div className="flex items-center gap-3 sm:gap-4 text-red-500"><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div><span className="font-mono font-bold text-base sm:text-lg tracking-widest">{formatRecordingTime(recordingDuration)}</span></div>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-1 sm:gap-2 animate-in fade-in">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 sm:p-3 rounded-full outline-none ${showEmojiPicker ? 'text-indigo-500 bg-indigo-500/10' : isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-50'}`}><MdMood className="text-xl sm:text-2xl" /></button>
                <button onClick={() => fileInputRef.current.click()} className={`p-2 sm:p-3 rounded-full outline-none ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-50'}`}><MdAttachFile className="text-xl sm:text-2xl" /></button>
                <input type="file" accept="image/*,video/mp4,video/webm,application/pdf,.doc,.docx,.txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <input type="text" ref={inputRef} placeholder="Message..." value={message} onChange={handleInputChange} onKeyPress={(e) => { e.key === 'Enter' && handleSend() }} className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-xl outline-none transition-all text-sm sm:text-base ${isDarkMode ? 'bg-slate-900/50 text-slate-200 placeholder-slate-500' : 'bg-slate-50/50 text-slate-700'}`} />
              </div>
            )}
            
            {isRecording ? <button onClick={stopRecording} className="bg-red-500 p-2.5 sm:p-3.5 rounded-full text-white shadow-lg"><MdStop className="text-xl" /></button> 
            : message.trim() || replyingTo ? <button onClick={handleSend} className="bg-indigo-600 p-2.5 sm:p-3.5 rounded-full text-white shadow-lg"><MdSend className="text-xl ml-1" /></button> 
            : <button onClick={startRecording} className="bg-emerald-500 p-2.5 sm:p-3.5 rounded-full text-white shadow-lg"><MdMic className="text-xl" /></button>}
          </div>
        </div>
      </div>

      {forwardMessageData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-100 bg-slate-50 text-slate-800'}`}><h2 className="text-lg font-bold">Forward Message</h2><button onClick={() => { setForwardMessageData(null); setSelectedForwardContacts([]); }}><MdClose className="text-xl" /></button></div>
            <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
              {users.map(u => (
                   <div key={u._id} onClick={() => toggleForwardContact(u._id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${isDarkMode ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-slate-50 border-slate-100'}`}>
                     <div className={`w-5 h-5 rounded border flex items-center justify-center ${isDarkMode ? 'border-indigo-500 bg-slate-900' : 'border-indigo-300 bg-white'}`}>{selectedForwardContacts.includes(u._id) && <MdCheck className="text-indigo-500" />}</div>
                     <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200"><img src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="w-full h-full object-cover"/></div>
                     <span className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{u.name}</span>
                   </div>
                 ))}
            </div>
            <div className={`px-6 py-4 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{selectedForwardContacts.length} selected</span>
              <button onClick={submitForward} disabled={selectedForwardContacts.length === 0} className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl disabled:opacity-50">Forward</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatArea;