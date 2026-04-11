/* eslint-disable */
import React, { useState } from 'react';
import { MdClose, MdCheck, MdGroupAdd } from 'react-icons/md';

const CreateGroupModal = ({ isOpen, onClose, contacts, onCreateGroup, isDarkMode }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);

  if (!isOpen) return null;

  const toggleContact = (userId) => {
    if (selectedContacts.includes(userId)) {
      setSelectedContacts(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedContacts(prev => [...prev, userId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (groupName.trim() && selectedContacts.length >= 2) {
      onCreateGroup(groupName, selectedContacts);
      setGroupName('');
      setSelectedContacts([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
        
        <div className={`px-6 py-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-2">
            <MdGroupAdd className="text-2xl text-indigo-500" />
            <h2 className="text-xl font-bold">New Group</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-500/20 transition-colors outline-none">
            <MdClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Group Subject</label>
            <input 
              type="text" 
              placeholder="Enter group name..." 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={`w-full p-3 rounded-xl outline-none transition-all border ${isDarkMode ? 'bg-slate-900 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
              required
            />
          </div>

          <div>
             <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                 Select Participants ({selectedContacts.length} selected)
             </label>
             <div className={`max-h-48 overflow-y-auto rounded-xl border p-2 space-y-1 ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
                {contacts.length === 0 ? <p className="text-center text-sm py-4 opacity-50">No contacts found</p> : 
                  contacts.map(u => (
                    <div key={u._id} onClick={() => toggleContact(u._id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isDarkMode ? 'border-indigo-500 bg-slate-800' : 'border-indigo-300 bg-white'}`}>
                            {selectedContacts.includes(u._id) && <MdCheck className="text-indigo-500" />}
                        </div>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-300">
                            <img src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="dp" className="w-full h-full object-cover"/>
                        </div>
                        <span className="font-semibold text-sm">{u.name}</span>
                    </div>
                  ))
                }
             </div>
             {selectedContacts.length > 0 && selectedContacts.length < 2 && (
                 <p className="text-xs text-red-500 mt-2 font-medium">* Select at least 2 members</p>
             )}
          </div>

          <button 
            type="submit" 
            disabled={!groupName.trim() || selectedContacts.length < 2}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] outline-none"
          >
            Create Group
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreateGroupModal;