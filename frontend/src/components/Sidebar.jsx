/* eslint-disable */
import { useState } from 'react';
import { MdSearch, MdMoreVert, MdPersonAdd, MdLogout, MdGroupAdd } from 'react-icons/md';

const Sidebar = ({ users, groups, selectedUser, onSelectUser, onLogout, onAddContact, currentUser, onOpenProfile, isDarkMode, onOpenCreateGroup }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'groups'

  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGroups = groups.filter(group => group.groupName.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddContactSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) { onAddContact(searchQuery); setSearchQuery(''); }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`w-full sm:w-[380px] flex flex-col border-r z-30 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
      
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onOpenProfile}>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 border-2 border-transparent group-hover:border-indigo-500 transition-all">
            <img src={currentUser?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Profile" className="w-full h-full object-cover" />
          </div>
          {/* 🔥 FIX: Name with @ symbol AND plain UPPERCASE Username (Hosh mein likha hua code!) */}
          <div className="hidden sm:block min-w-0">
            <h2 className={`font-bold text-base truncate max-w-[150px] leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {currentUser?.name || "NexusChat"}
            </h2>
            <p className={`text-xs truncate max-w-[150px] uppercase tracking-wider font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              @{currentUser?.username || "USERNAME"}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-full transition-colors outline-none ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}><MdMoreVert className="text-xl" /></button>
          {showMenu && (
            <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              <button onClick={() => { setShowMenu(false); onOpenCreateGroup(); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}><MdGroupAdd className="text-lg" /> New Group</button>
              <button onClick={() => { setShowMenu(false); onOpenProfile(); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}><MdPersonAdd className="text-lg" /> My Profile</button>
              <div className={`h-px w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
              <button onClick={onLogout} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 text-red-500 transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'}`}><MdLogout className="text-lg" /> Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Tabs */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
        <form onSubmit={handleAddContactSubmit} className={`flex items-center px-4 py-2.5 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          <MdSearch className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
          <input type="text" placeholder="Search or add email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none outline-none px-2 text-sm" />
          {searchQuery && <button type="submit" className="text-indigo-600 p-1 hover:bg-indigo-100 rounded-full"><MdPersonAdd /></button>}
        </form>

        <div className={`flex mt-4 bg-black/5 p-1 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button onClick={() => setActiveTab('chats')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'chats' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Chats</button>
            <button onClick={() => setActiveTab('groups')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'groups' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Groups</button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {activeTab === 'chats' ? (
            filteredUsers.length === 0 ? (
            <div className={`text-center mt-10 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <p>No contacts found.</p>
                <p className="mt-1 text-xs">Search email above to add.</p>
            </div>
            ) : (
            filteredUsers.map((user) => (
                <div key={user._id} onClick={() => onSelectUser(user)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${selectedUser?._id === user._id ? (isDarkMode ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-indigo-50 border-indigo-100') : (isDarkMode ? 'border-transparent hover:bg-slate-800' : 'border-transparent hover:bg-slate-50')} group`}>
                <div className="relative">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isDarkMode ? 'border-slate-700' : 'border-white'} shadow-sm`}><img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="DP" className="w-full h-full object-cover" /></div>
                    {user.isOnline && <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 rounded-full ${isDarkMode ? 'border-slate-800' : 'border-white'}`}></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5"><h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.name}</h3></div>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.username || user.email}</p>
                </div>
                {user.unreadCount > 0 && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{user.unreadCount}</div>}
                </div>
            ))
            )
        ) : (
            filteredGroups.length === 0 ? (
            <div className={`text-center mt-10 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <p>No groups found.</p>
                <button onClick={onOpenCreateGroup} className="mt-2 text-indigo-500 font-bold text-xs hover:underline">Create a Group</button>
            </div>
            ) : (
            filteredGroups.map((group) => (
                <div key={group._id} onClick={() => onSelectUser(group)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${selectedUser?._id === group._id ? (isDarkMode ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-indigo-50 border-indigo-100') : (isDarkMode ? 'border-transparent hover:bg-slate-800' : 'border-transparent hover:bg-slate-50')} group`}>
                <div className="relative">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isDarkMode ? 'border-slate-700' : 'border-white'} shadow-sm bg-indigo-100 p-2`}><img src={group.groupIcon} alt="DP" className="w-full h-full object-cover" /></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5"><h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{group.groupName}</h3></div>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{group.lastMessage || "Start chatting..."}</p>
                </div>
                {group.unreadCount > 0 && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{group.unreadCount}</div>}
                </div>
            ))
            )
        )}
      </div>
    </div>
  );
};

export default Sidebar;