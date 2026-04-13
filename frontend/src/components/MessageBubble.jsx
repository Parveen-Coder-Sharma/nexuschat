import React, { useState } from 'react';
import { MdReply, MdShortcut, MdDeleteOutline, MdDoneAll, MdCheck, MdInsertDriveFile, MdOutlineAddReaction } from 'react-icons/md';

const MessageBubble = React.memo(({ msg, isMe, myId, selectedUser, handleReplyClick, setForwardMessageData, confirmDeleteMessage, handleScrollToMessage, formatTime, onReact, isDarkMode, onImageClick }) => {
  const [showReactions, setShowReactions] = useState(false);
  const emojis = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

  const getPreviewText = (m) => {
    if (m.videoUrl) return "🎥 Video"; if (m.audioUrl) return "🎤 Voice Note";
    if (m.documentUrl) return "📄 Document"; if (m.imageUrl) return "📷 Photo";
    return m.text || "Message";
  };

  const handleEmojiClick = (emoji) => { onReact(msg._id, emoji); setShowReactions(false); };
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => part.match(urlRegex) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80 break-words">{part}</a> : part);
  };

  return (
    <div id={`msg-${msg._id}`} className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${isMe ? 'self-end' : 'self-start'} group transition-all relative`}>
      
      {selectedUser?.isGroup && !isMe && msg.sender && (
          <span className={`text-[11px] font-bold ml-3 mb-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{msg.sender.name}</span>
      )}

      <div className={`flex items-end gap-2 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
        
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pb-2 relative shrink-0">
          <button onClick={() => setShowReactions(!showReactions)} title="React" className={`p-1 outline-none transition-colors ${isDarkMode ? 'text-slate-400 hover:text-yellow-400' : 'text-slate-400 hover:text-yellow-500'}`}><MdOutlineAddReaction className="text-[18px]" /></button>
          {showReactions && (
            <div className={`absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} flex gap-2 p-2 rounded-full shadow-lg border animate-in zoom-in-95 z-50 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'}`}>
              {emojis.map(e => ( <button key={e} onClick={() => handleEmojiClick(e)} className="text-xl hover:scale-125 transition-transform outline-none">{e}</button> ))}
            </div>
          )}
          <button onClick={() => handleReplyClick(msg)} title="Reply" className={`p-1 outline-none transition-colors ${isDarkMode ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-400 hover:text-indigo-600'}`}><MdReply className="text-[18px]" /></button>
          <button onClick={() => setForwardMessageData(msg)} title="Forward" className={`p-1 outline-none transition-colors ${isDarkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-400 hover:text-emerald-500'}`}><MdShortcut className="text-[18px]" /></button>
          <button onClick={() => confirmDeleteMessage(msg._id, isMe)} title="Delete" className={`p-1 outline-none transition-colors ${isDarkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}><MdDeleteOutline className="text-[18px]" /></button>
        </div>
        
        <div className={`message-bubble p-3 shadow-sm text-[15px] leading-relaxed break-words flex flex-col relative overflow-hidden ${isMe ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl rounded-tr-sm text-white' : isDarkMode ? 'bg-slate-800 rounded-2xl rounded-tl-sm border border-slate-700 text-slate-200' : 'bg-white rounded-2xl rounded-tl-sm border border-slate-100 text-slate-700'}`}>
          {msg.isForwarded && (<div className={`flex items-center gap-1 text-[10px] italic mb-1 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}><MdShortcut /> Forwarded</div>)}
          
          {msg.replyTo && (
            <div onClick={() => handleScrollToMessage(msg.replyTo._id)} className={`mb-2 p-2 rounded-lg text-xs border-l-4 cursor-pointer transition-colors ${isMe ? 'bg-black/10 border-white/50 text-indigo-50 hover:bg-black/20' : isDarkMode ? 'bg-slate-700 border-indigo-500 text-slate-300 hover:bg-slate-600' : 'bg-indigo-50 border-indigo-500 text-slate-600 hover:bg-indigo-100'} flex flex-col opacity-90`}>
              <span className={`font-bold mb-0.5 ${isMe ? 'text-white' : 'text-indigo-500'}`}>{msg.replyTo.sender === myId ? "You" : selectedUser.name}</span>
              <div className="flex gap-2 items-center">
                {msg.replyTo.imageUrl && <img src={msg.replyTo.imageUrl} alt="Quote" className="w-8 h-8 object-cover rounded" />}
                <span className="truncate max-w-[200px]">{getPreviewText(msg.replyTo)}</span>
              </div>
            </div>
          )}

          {msg.imageUrl && (
            <div className="mb-1.5 rounded-lg overflow-hidden bg-black/5 cursor-pointer" onClick={() => onImageClick(msg.imageUrl)}>
                <img src={msg.imageUrl} alt="Attachment" className="w-full max-w-[220px] sm:max-w-[300px] max-h-64 object-cover rounded-lg hover:opacity-90 transition-opacity" />
            </div>
          )}
          
          {msg.videoUrl && (<div className="mb-1.5 rounded-lg overflow-hidden bg-black cursor-pointer"><video src={msg.videoUrl} controls preload="metadata" className="w-full max-w-[220px] sm:max-w-[300px] max-h-64 object-contain rounded-lg" /></div>)}
          
          {msg.documentUrl && (
            <a href={msg.documentUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl mb-1.5 cursor-pointer transition-colors ${isMe ? 'bg-indigo-700 hover:bg-indigo-800 text-white' : isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
              <div className="p-2 bg-white/20 rounded-lg"><MdInsertDriveFile className="text-2xl" /></div>
              <div className="flex flex-col overflow-hidden"><span className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px]">{msg.documentName || "Document"}</span><span className="text-[10px] uppercase opacity-70">Click to view/download</span></div>
            </a>
          )}
          
          {msg.audioUrl && (<div className="mb-1.5"><audio src={msg.audioUrl} controls className={`h-10 w-full max-w-[200px] sm:max-w-[260px] outline-none ${isMe ? 'opacity-90' : ''}`} /></div>)}
          
          {msg.linkPreview && msg.linkPreview.url && (
            <a href={msg.linkPreview.url} target="_blank" rel="noopener noreferrer" className={`block mb-2 rounded-lg overflow-hidden border transition-opacity hover:opacity-90 ${isMe ? 'border-indigo-400 bg-indigo-700' : isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
              {msg.linkPreview.image && (<img src={msg.linkPreview.image} alt="Preview" className="w-full h-32 object-cover bg-slate-200" />)}
              <div className="p-3 flex flex-col">
                <span className="text-sm font-bold truncate mb-1">{msg.linkPreview.title || "Link"}</span>
                <span className={`text-[10px] line-clamp-2 leading-tight ${isMe ? 'text-indigo-100' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{msg.linkPreview.description || msg.linkPreview.url}</span>
              </div>
            </a>
          )}
          
          {msg.text && <span className="whitespace-pre-wrap break-words">{renderTextWithLinks(msg.text)}</span>}
          
          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex items-center rounded-full px-1.5 py-0.5 shadow-md border text-[12px] z-10 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
              {[...new Set(msg.reactions.map(r => r.emoji))].map(emoji => (<span key={emoji} className="mx-0.5">{emoji}</span>))}
              {msg.reactions.length > 1 && <span className={`ml-1 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{msg.reactions.length}</span>}
            </div>
          )}
        </div>
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} ${isMe ? 'self-end mr-1' : 'ml-1'}`}>
        <span>{msg.createdAt ? formatTime(msg.createdAt) : ''}</span>
        {isMe && (<span className="ml-0.5 text-[14px]">{msg.status === 'read' ? <MdDoneAll className="text-blue-400" /> : msg.status === 'delivered' ? <MdDoneAll className="text-slate-400" /> : <MdCheck className="text-slate-400" />}</span>)}
      </div>
    </div>
  );
});

export default MessageBubble;
