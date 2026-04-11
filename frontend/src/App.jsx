/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast'; 
import Peer from 'peerjs'; 

import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ProfileModal from './components/ProfileModal'; 
import VideoCallModal from './components/VideoCallModal'; 
import CreateGroupModal from './components/CreateGroupModal'; 

const socket = io.connect("https://nexuschat-backend-ysa6.onrender.com");

const msgNotificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'); 
const incomingRingSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3'); 
incomingRingSound.loop = true; 
const outgoingRingSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1197/1197-preview.mp3'); 
outgoingRingSound.loop = true; 

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [myId, setMyId] = useState(localStorage.getItem('myId') || ''); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); 
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false); 
  
  const [users, setUsers] = useState([]); 
  const [groups, setGroups] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  
  const [messageList, setMessageList] = useState([]); 
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const incomingAudioRef = useRef(null);
  const outgoingAudioRef = useRef(null);
  const msgAudioRef = useRef(null);
  const peerInstance = useRef(null);
  const currentCallRef = useRef(null); 
  const [callStatus, setCallStatus] = useState('idle'); 
  const callStatusRef = useRef('idle'); 
  const [callContext, setCallContext] = useState(null); 
  const [incomingCallObject, setIncomingCallObject] = useState(null); 
  const [myStream, setMyStream] = useState(null);
  const myStreamRef = useRef(null); 
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const callStateRef = useRef({ isActive: false, isCaller: false, startTime: null, partnerId: null, type: null, logSent: false });

  const getRoomId = (id1, id2) => [id1, id2].sort().join("_");
  const getCurrentRoomId = (targetObj) => targetObj.isGroup ? targetObj._id : getRoomId(myId, targetObj._id);

  const handleLoginSuccess = (newToken, newMyId) => {
    setToken(newToken); setMyId(newMyId);
    localStorage.setItem('token', newToken); localStorage.setItem('myId', newMyId);
  };

  const handleLogout = () => {
    socket.disconnect(); socket.connect(); 
    if(peerInstance.current) peerInstance.current.destroy(); 
    setToken(''); setMyId(''); localStorage.removeItem('token'); localStorage.removeItem('myId');
    setUsers([]); setGroups([]); setSelectedUser(null); setCurrentUser(null);
    toast("Logged out successfully", { icon: '👋' }); 
  };

  // 🔥 BONUS TIP APPLIED: Browser Tab Alert Logic
  useEffect(() => {
    const totalUnread = users.reduce((acc, u) => acc + (u.unreadCount || 0), 0) + groups.reduce((acc, g) => acc + (g.unreadCount || 0), 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) NexusChat` : 'NexusChat';
  }, [users, groups]);

  useEffect(() => { if (myId) socket.emit("user_connected", myId); }, [myId]);
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

  useEffect(() => {
    if (myId && currentUser) {
      const peer = new Peer(`nexus_${myId}`);
      peer.on('call', (call) => {
        const callerData = call.metadata; 
        callStateRef.current = { isActive: true, isCaller: false, startTime: null, partnerId: callerData.callerId, type: callerData.type, logSent: false };
        setIncomingCallObject(call); setCallContext({ type: callerData.type, partner: callerData.caller, partnerId: callerData.callerId }); setCallStatus('receiving'); 
        if(incomingAudioRef.current) incomingAudioRef.current.play().catch(e=>e); 
      });
      peerInstance.current = peer; return () => peer.destroy();
    }
  }, [myId, currentUser]);

  useEffect(() => {
      const handleCallCancelled = () => { if (callStatusRef.current === 'receiving') { toast("Missed Call", { icon: '❌' }); cleanupCall(false); } };
      const handleCallRejected = () => { if (callStatusRef.current === 'calling') { toast("Call Rejected", { icon: '❌' }); cleanupCall(false); } };
      const handleCallEnded = () => { if (callStatusRef.current === 'connected') { cleanupCall(false); } };
      socket.on("call_cancelled", handleCallCancelled); socket.on("call_rejected", handleCallRejected); socket.on("call_ended", handleCallEnded);
      return () => { socket.off("call_cancelled", handleCallCancelled); socket.off("call_rejected", handleCallRejected); socket.off("call_ended", handleCallEnded); };
  }, []);

  const sendCallLogToChat = async (logText, partnerId) => {
    if (!partnerId) return;
    try {
      const roomId = getRoomId(myId, partnerId);
      const response = await axios.post(`https://nexuschat-backend-ysa6.onrender.com/api/messages/send/${partnerId}`, { text: logText }, { headers: { Authorization: `Bearer ${token}` } });
      const messageData = { ...response.data, roomId };
      socket.emit("send_message", messageData);
      if (selectedUser && selectedUser._id === partnerId) setMessageList((prev) => [...prev, messageData]);
    } catch(err) {}
  };

  const handleCallLog = () => {
      const state = callStateRef.current;
      if (!state.isCaller || state.logSent || !state.partnerId) return;
      state.logSent = true;
      let logMessage = "";
      if (state.startTime) {
          const durationSecs = Math.floor((Date.now() - state.startTime) / 1000);
          const mins = Math.floor(durationSecs / 60).toString().padStart(2, '0');
          const secs = (durationSecs % 60).toString().padStart(2, '0');
          logMessage = `📞 ${state.type === 'video' ? 'Video' : 'Audio'} Call ended (${mins}:${secs})`;
      } else { logMessage = `❌ Missed ${state.type === 'video' ? 'Video' : 'Audio'} Call`; }
      sendCallLogToChat(logMessage, state.partnerId);
  };

  const cleanupCall = (emitSignal = false) => {
      if(incomingAudioRef.current) { incomingAudioRef.current.pause(); incomingAudioRef.current.currentTime = 0; }
      if(outgoingAudioRef.current) { outgoingAudioRef.current.pause(); outgoingAudioRef.current.currentTime = 0; }
      if (myStreamRef.current) { myStreamRef.current.getTracks().forEach(track => { track.stop(); }); myStreamRef.current = null; }
      if (currentCallRef.current) currentCallRef.current.close();
      if (incomingCallObject) incomingCallObject.close();
      if (emitSignal && callStateRef.current.partnerId) {
          const roomId = getRoomId(myId, callStateRef.current.partnerId);
          if (callStatusRef.current === 'calling') { socket.emit("cancel_call", { roomId }); handleCallLog(); } 
          else if (callStatusRef.current === 'receiving') { socket.emit("reject_call", { roomId }); } 
          else if (callStatusRef.current === 'connected') { socket.emit("end_call", { roomId }); handleCallLog(); }
      } else if (callStateRef.current.isCaller) { handleCallLog(); }
      setMyStream(null); setRemoteStream(null); setCallStatus('idle'); setCallContext(null); setIncomingCallObject(null); currentCallRef.current = null;
      callStateRef.current = { isActive: false, isCaller: false, startTime: null, partnerId: null, type: null, logSent: false };
  };

  const handleEndCallClick = () => cleanupCall(true);

  const initiateCall = async (targetUser, callType) => {
    if(targetUser.isGroup) { toast.error("Calls in Groups are not supported yet."); return; } 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      setMyStream(stream); myStreamRef.current = stream; setIsMicOn(true); setIsVideoOn(callType === 'video');
      callStateRef.current = { isActive: true, isCaller: true, startTime: null, partnerId: targetUser._id, type: callType, logSent: false };
      setCallContext({ type: callType, partner: targetUser, partnerId: targetUser._id }); setCallStatus('calling');
      if(outgoingAudioRef.current) { outgoingAudioRef.current.volume = 0.6; outgoingAudioRef.current.play().catch(e=>e); }
      const call = peerInstance.current.call(`nexus_${targetUser._id}`, stream, { metadata: { type: callType, caller: { name: currentUser.name, profilePic: currentUser.profilePic }, callerId: myId } });
      currentCallRef.current = call;
      call.on('stream', (userVideoStream) => { 
          if(outgoingAudioRef.current) { outgoingAudioRef.current.pause(); outgoingAudioRef.current.currentTime = 0; }
          setRemoteStream(userVideoStream); setCallStatus('connected'); callStateRef.current.startTime = Date.now(); 
      });
    } catch (err) { toast.error("Camera/Microphone access denied!"); setCallStatus('idle'); }
  };

  const answerCall = async () => {
    try {
      if(incomingAudioRef.current) { incomingAudioRef.current.pause(); incomingAudioRef.current.currentTime = 0; }
      const stream = await navigator.mediaDevices.getUserMedia({ video: callContext.type === 'video', audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      setMyStream(stream); myStreamRef.current = stream; setIsMicOn(true); setIsVideoOn(callContext.type === 'video');
      incomingCallObject.answer(stream); currentCallRef.current = incomingCallObject;
      incomingCallObject.on('stream', (userVideoStream) => { setRemoteStream(userVideoStream); setCallStatus('connected'); callStateRef.current.startTime = Date.now(); });
    } catch (err) { toast.error("Camera/Microphone access denied!"); handleEndCallClick(); }
  };

  const toggleMic = () => { if (myStreamRef.current) { const t = myStreamRef.current.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setIsMicOn(t.enabled); } } };
  const toggleVideo = () => { if (myStreamRef.current) { const t = myStreamRef.current.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setIsVideoOn(t.enabled); } } };

  useEffect(() => {
    if (token) {
      axios.get('https://nexuschat-backend-ysa6.onrender.com/api/users/contacts', { headers: { Authorization: `Bearer ${token}` } })
        .then(response => { setUsers(response.data); response.data.forEach(contact => socket.emit("join_room", getRoomId(myId, contact._id))); }).catch(err => { if (err.response?.status === 401) handleLogout(); });
      axios.get('https://nexuschat-backend-ysa6.onrender.com/api/groups/my-groups', { headers: { Authorization: `Bearer ${token}` } })
        .then(response => { setGroups(response.data); response.data.forEach(group => socket.emit("join_room", group._id)); }).catch(err => console.log(err));
      axios.get('https://nexuschat-backend-ysa6.onrender.com/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(response => setCurrentUser(response.data));
    }
  }, [token, myId]);

  const handleAddContact = async (identifier) => {
    try {
      const response = await axios.post('https://nexuschat-backend-ysa6.onrender.com/api/users/add-contact', { searchQuery: identifier }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers((prev) => [...prev, response.data.contact]);
      socket.emit("join_room", getRoomId(myId, response.data.contact._id));
      toast.success(response.data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Failed to add contact"); }
  };

  const handleCreateGroup = async (groupName, selectedIds) => {
      try {
          const toastId = toast.loading("Creating group...");
          const response = await axios.post('https://nexuschat-backend-ysa6.onrender.com/api/groups/create', { groupName, participants: selectedIds }, { headers: { Authorization: `Bearer ${token}` } });
          const newGroup = response.data;
          setGroups(prev => [newGroup, ...prev]);
          socket.emit("join_room", newGroup._id); 
          setIsCreateGroupModalOpen(false);
          toast.success("Group created successfully!", { id: toastId });
          setSelectedUser(newGroup); 
      } catch (error) { toast.error(error.response?.data?.message || "Failed to create group"); }
  };

  useEffect(() => {
    const statusUpdateHandler = ({ userId, isOnline, lastSeen }) => {
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isOnline, lastSeen } : u));
      setSelectedUser((prev) => (prev && !prev.isGroup && prev._id === userId) ? { ...prev, isOnline, lastSeen } : prev);
    };
    socket.on("user_status_update", statusUpdateHandler); return () => socket.off("user_status_update", statusUpdateHandler);
  }, []);

  useEffect(() => {
    if (selectedUser && token) {
      setPage(1); setHasMoreMessages(true); setMessageList([]); 
      if(selectedUser.isGroup) { setGroups(prev => prev.map(g => g._id === selectedUser._id ? { ...g, unreadCount: 0 } : g)); }
      else { setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u)); }
      
      axios.get(`https://nexuschat-backend-ysa6.onrender.com/api/messages/${selectedUser._id}?page=1&limit=50`, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => {
          if (response.data.length < 50) setHasMoreMessages(false);
          setMessageList(response.data);
          const roomId = getCurrentRoomId(selectedUser);
          response.data.forEach((msg) => { if (msg.sender !== myId && msg.status !== 'read') socket.emit("mark_as_read", { messageId: msg._id, roomId }); });
        });
    }
  }, [selectedUser, token, myId]);

  const loadMoreMessages = async () => {
    if (isLoadingHistory || !hasMoreMessages || !selectedUser) return;
    setIsLoadingHistory(true);
    try {
      const nextPage = page + 1;
      const response = await axios.get(`https://nexuschat-backend-ysa6.onrender.com/api/messages/${selectedUser._id}?page=${nextPage}&limit=50`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.length < 50) setHasMoreMessages(false);
      setMessageList((prev) => [...response.data, ...prev]); setPage(nextPage);
    } catch (error) {}
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    const receiveMessageHandler = (data) => {
      const isCurrentChat = selectedUser && (data.roomId === getCurrentRoomId(selectedUser));
      
      if (isCurrentChat) {
        setMessageList((prev) => [...prev, data]);
        if (data.sender !== myId && msgAudioRef.current) msgAudioRef.current.play().catch(e=>e);
        if (data.sender !== myId) socket.emit("mark_as_read", { messageId: data._id, roomId: data.roomId });
      } else {
        if (data.sender !== myId) {
          if(msgAudioRef.current) msgAudioRef.current.play().catch(e=>e);
          const isGroupMsg = groups.some(g => g._id === data.roomId);
          if (isGroupMsg) { setGroups(prev => prev.map(g => g._id === data.roomId ? { ...g, unreadCount: (g.unreadCount || 0) + 1 } : g)); } 
          else { setUsers(prev => prev.map(u => u._id === data.sender ? { ...u, unreadCount: (u.unreadCount || 0) + 1 } : u)); }
        }
      }
    };
    
    const messageReadHandler = ({ messageId, status }) => setMessageList((prev) => prev.map((m) => m._id === messageId ? { ...m, status } : m));
    const messageDeletedHandler = (messageId) => setMessageList((prev) => prev.filter((m) => m._id !== messageId));
    const reactionUpdateHandler = (updatedMsg) => setMessageList((prev) => prev.map((m) => m._id === updatedMsg._id ? updatedMsg : m));

    socket.on("receive_message", receiveMessageHandler);
    socket.on("message_read_update", messageReadHandler);
    socket.on("message_deleted_update", messageDeletedHandler);
    socket.on("message_reaction_update", reactionUpdateHandler);

    return () => { 
      socket.off("receive_message", receiveMessageHandler); socket.off("message_read_update", messageReadHandler); 
      socket.off("message_deleted_update", messageDeletedHandler); socket.off("message_reaction_update", reactionUpdateHandler);
    };
  }, [selectedUser, myId, groups]); 

  const sendMessage = async (payload) => {
    if (!selectedUser) return;
    const roomId = getCurrentRoomId(selectedUser);
    try {
      const response = await axios.post(`https://nexuschat-backend-ysa6.onrender.com/api/messages/send/${selectedUser._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      const messageData = { ...response.data, roomId };
      socket.emit("send_message", messageData);
      setMessageList((prev) => [...prev, messageData]);
    } catch (error) { toast.error("Failed to send message"); }
  };

  const handleForwardMessage = async (messageToForward, targetUserIds) => {
    try {
      const { text, imageUrl, videoUrl, audioUrl, documentUrl, documentName } = messageToForward;
      for (const targetId of targetUserIds) {
        const isGroupTarget = groups.some(g => g._id === targetId);
        const roomId = isGroupTarget ? targetId : getRoomId(myId, targetId);
        const response = await axios.post(`https://nexuschat-backend-ysa6.onrender.com/api/messages/send/${targetId}`, 
          { text, imageUrl, videoUrl, audioUrl, documentUrl, documentName, isForwarded: true }, { headers: { Authorization: `Bearer ${token}` } }
        );
        const messageData = { ...response.data, roomId };
        socket.emit("send_message", messageData);
        if (selectedUser && selectedUser._id === targetId) setMessageList((prev) => [...prev, messageData]);
      }
      toast.success("Message forwarded successfully!");
    } catch (error) { toast.error("Failed to forward message"); }
  };

  const deleteMessage = async (msgId, deleteType) => {
    try {
      await axios.delete(`https://nexuschat-backend-ysa6.onrender.com/api/messages/${msgId}?type=${deleteType}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessageList((prev) => prev.filter((m) => m._id !== msgId));
      if (deleteType === 'everyone') { socket.emit("delete_message", { messageId: msgId, roomId: getCurrentRoomId(selectedUser) }); toast.success("Message deleted"); } 
      else { toast.success("Message deleted for you"); }
    } catch (error) { toast.error("Failed to delete message"); }
  };

  const handleReactToMessage = async (msgId, emoji) => {
    try {
      const response = await axios.put(`https://nexuschat-backend-ysa6.onrender.com/api/messages/${msgId}/react`, { emoji }, { headers: { Authorization: `Bearer ${token}` } });
      setMessageList((prev) => prev.map((m) => m._id === msgId ? response.data : m));
    } catch (error) { toast.error("Failed to react to message"); }
  };

  const clearChat = async () => {
    try {
      await axios.delete(`https://nexuschat-backend-ysa6.onrender.com/api/messages/clear/${selectedUser._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessageList([]); toast.success("Chat cleared"); 
    } catch (error) { toast.error("Failed to clear chat"); }
  };

  if (!token) return <><Toaster position="top-center" /><Auth onLoginSuccess={handleLoginSuccess} /></>;

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <audio ref={incomingAudioRef} src="https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3" loop />
      <audio ref={outgoingAudioRef} src="https://assets.mixkit.co/active_storage/sfx/1197/1197-preview.mp3" loop />
      <audio ref={msgAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" />

      <Toaster position="top-center" /> 
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} token={token} onProfileUpdate={setCurrentUser} />
      
      <CreateGroupModal isOpen={isCreateGroupModalOpen} onClose={() => setIsCreateGroupModalOpen(false)} contacts={users} onCreateGroup={handleCreateGroup} isDarkMode={isDarkMode} />
      
      <VideoCallModal callStatus={callStatus} callContext={callContext} myStream={myStream} remoteStream={remoteStream} onAnswer={answerCall} onReject={handleEndCallClick} onEnd={handleEndCallClick} toggleMic={toggleMic} toggleVideo={toggleVideo} isMicOn={isMicOn} isVideoOn={isVideoOn} />
      
      {/* 🔥 MOBILE RESPONSIVENESS APPLIED HERE */}
      <div className={`h-screen w-full flex items-center justify-center p-0 sm:p-6 font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'}`}>
        <div className={`flex h-full w-full max-w-[1400px] sm:rounded-[2rem] shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white/50'}`}>
          
          {/* Sidebar is hidden on mobile if a user is selected */}
          <div className={`w-full sm:w-[380px] h-full ${selectedUser ? 'hidden sm:flex' : 'flex'}`}>
             <Sidebar users={users} groups={groups} selectedUser={selectedUser} onSelectUser={setSelectedUser} onLogout={handleLogout} onAddContact={handleAddContact} currentUser={currentUser} onOpenProfile={() => setIsProfileModalOpen(true)} isDarkMode={isDarkMode} onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)} />
          </div>
          
          {/* ChatArea is hidden on mobile if NO user is selected */}
          <div className={`flex-1 flex-col relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-[#f8fafc]'} ${!selectedUser ? 'hidden sm:flex' : 'flex w-full'}`}>
             <ChatArea selectedUser={selectedUser} myId={myId} messageList={messageList} users={users} onSendMessage={sendMessage} onForwardMessage={handleForwardMessage} onDeleteMessage={deleteMessage} onClearChat={clearChat} socket={socket} onInitiateCall={initiateCall} onLoadMore={loadMoreMessages} hasMoreMessages={hasMoreMessages} isLoadingHistory={isLoadingHistory} onReact={handleReactToMessage} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} onBack={() => setSelectedUser(null)} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;