import { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MdClose, MdCameraAlt } from 'react-icons/md';

const ProfileModal = ({ isOpen, onClose, currentUser, token, onProfileUpdate }) => {
  // Local state for tracking form inputs
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [dob, setDob] = useState(currentUser?.dob || '');
  const [country, setCountry] = useState(currentUser?.country || '');
  
  // Media states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentUser?.profilePic || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef(null);

  // Constants mapping to your Cloudinary Dashboard
  const CLOUD_NAME = "dertukhn8";
  const UPLOAD_PRESET = "nexuschat_preset";

  if (!isOpen) return null;

  // Process the file object instantly for local UI preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Submit all user data changes to the backend
  const handleSave = async () => {
    setIsSaving(true);
    let finalImageUrl = currentUser?.profilePic;

    try {
      // 1. Upload new image strictly if a file is attached
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", UPLOAD_PRESET);

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          formData
        );
        finalImageUrl = cloudinaryRes.data.secure_url;
      }

      // 2. Transmit fully formatted data object to the backend endpoint
      const response = await axios.put(
        'https://nexuschat-backend-ysa6.onrender.com/api/users/profile',
        {
          profilePic: finalImageUrl,
          dob,
          country,
          bio
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Profile updated successfully!");
      onProfileUpdate(response.data.user); 
      onClose(); 

    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Title Bar Segment */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Edit Profile</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors outline-none">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Circular Image File Trigger Module */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <MdCameraAlt className="text-white text-2xl" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
            />
            <p className="text-xs text-slate-400 mt-2 font-medium">Click to change photo</p>
          </div>

          {/* Profile Details Registration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Bio</label>
              <input 
                type="text" 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 text-sm font-medium" 
                placeholder="Hey there! I am using NexusChat." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Date of Birth</label>
                <input 
                  type="date" 
                  value={dob} 
                  onChange={e => setDob(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Country</label>
                <input 
                  type="text" 
                  value={country} 
                  onChange={e => setCountry(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 text-sm font-medium" 
                  placeholder="e.g. India" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Processing Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors outline-none">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;