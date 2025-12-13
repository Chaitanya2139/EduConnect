import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { 
  FileText, 
  Plus, 
  BarChart3, 
  Users, 
  Bell,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Send
} from 'lucide-react';

const InstructorDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [polls, setPolls] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    isEditable: false,
    type: 'individual' // 'individual' or 'group'
  });
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '']
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (user.role !== 'instructor') {
      navigate('/');
    }
    fetchAssignments();
    fetchPolls();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/assignments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) setAssignments(data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchPolls = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/polls', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) setPolls(data);
    } catch (err) {
      console.error('Error fetching polls:', err);
    }
  };

  const createAssignment = async () => {
    // Validate required fields
    if (!newAssignment.title.trim()) {
      alert('❌ Assignment title is required!');
      return;
    }
    if (!newAssignment.description.trim()) {
      alert('❌ Assignment description is required!');
      return;
    }
    if (!newAssignment.dueDate) {
      alert('❌ Due date is required!');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAssignment)
      });
      
      if (res.ok) {
        setShowAssignmentModal(false);
        setNewAssignment({ title: '', description: '', dueDate: '', isEditable: false, type: 'individual' });
        fetchAssignments();
      } else {
        const data = await res.json();
        alert('❌ Error: ' + (data.message || 'Failed to create assignment'));
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert('❌ Network error. Please try again.');
    }
  };

  const createPoll = async () => {
    // Validate required fields
    if (!newPoll.question.trim()) {
      alert('❌ Poll question is required!');
      return;
    }
    
    // Filter out empty options and validate
    const validOptions = newPoll.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('❌ Please provide at least 2 options!');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          question: newPoll.question,
          options: validOptions 
        })
      });
      
      if (res.ok) {
        setShowPollModal(false);
        setNewPoll({ question: '', options: ['', ''] });
        fetchPolls();
      } else {
        const data = await res.json();
        alert('❌ Error: ' + (data.message || 'Failed to create poll'));
      }
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('❌ Network error. Please try again.');
    }
  };

  const toggleAssignmentEditability = async (id, currentStatus) => {
    try {
      await fetch(`http://localhost:3001/api/assignments/${id}/editability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isEditable: !currentStatus })
      });
      fetchAssignments();
    } catch (err) {
      console.error('Error toggling editability:', err);
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await fetch(`http://localhost:3001/api/assignments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  const addPollOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const updatePollOption = (index, value) => {
    const updated = [...newPoll.options];
    updated[index] = value;
    setNewPoll({ ...newPoll, options: updated });
  };

  const removePollOption = (index) => {
    if (newPoll.options.length <= 2) return;
    const updated = newPoll.options.filter((_, i) => i !== index);
    setNewPoll({ ...newPoll, options: updated });
  };

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">👨‍🏫 Instructor Dashboard</h1>
          <p className="text-zinc-400">Manage assignments, polls, and student collaboration</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
            <FileText className="text-blue-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">{assignments.length}</p>
            <p className="text-zinc-400 text-sm">Active Assignments</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6">
            <BarChart3 className="text-purple-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">{polls.length}</p>
            <p className="text-zinc-400 text-sm">Active Polls</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6">
            <Users className="text-green-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">24</p>
            <p className="text-zinc-400 text-sm">Total Students</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
            <Bell className="text-orange-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">5</p>
            <p className="text-zinc-400 text-sm">Pending Reviews</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
          >
            <Plus size={20} />
            Create Assignment
          </button>
          <button
            onClick={() => setShowPollModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors"
          >
            <Plus size={20} />
            Create Poll
          </button>
        </div>

        {/* Assignments List */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Assignments</h2>
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment._id} className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{assignment.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      assignment.type === 'group'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {assignment.type === 'group' ? 'Group' : 'Individual'}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full ${assignment.isEditable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {assignment.isEditable ? 'Editable' : 'Read-Only'}
                    </span>
                    <span>{assignment.submissions?.length || 0} submission(s)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAssignmentEditability(assignment._id, assignment.isEditable)}
                    className={`p-2 rounded-lg transition-colors ${assignment.isEditable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                    title={assignment.isEditable ? 'Make Read-Only' : 'Make Editable'}
                  >
                    {assignment.isEditable ? <Unlock size={18} /> : <Lock size={18} />}
                  </button>
                  {assignment.type === 'group' && (
                    <button
                      onClick={() => navigate(`/room/${assignment.title.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                      title="Open Collaboration Room"
                    >
                      <Users size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAssignment(assignment._id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Delete Assignment"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No assignments yet. Create your first assignment to get started!
              </div>
            )}
          </div>
        </div>

        {/* Polls List */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Polls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {polls.map((poll) => (
              <div key={poll._id} className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">{poll.question}</h3>
                <div className="space-y-2">
                  {poll.options.map((option, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-300 text-sm">{option.text}</span>
                      <span className="text-zinc-400 text-xs">{option.votes} votes</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  Total votes: {poll.options.reduce((sum, opt) => sum + opt.votes, 0)}
                </div>
              </div>
            ))}
            {polls.length === 0 && (
              <div className="col-span-2 text-center py-12 text-zinc-500">
                No polls yet. Create your first poll to engage students!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New Assignment</h2>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Assignment Title *"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className={`w-full bg-zinc-800 border rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                    newAssignment.title.trim() ? 'border-white/10 focus:ring-blue-500' : 'border-red-500/50 focus:ring-red-500'
                  }`}
                />
                {!newAssignment.title.trim() && (
                  <p className="text-red-400 text-xs mt-1">* Title is required</p>
                )}
              </div>
              <div>
                <textarea
                  placeholder="Description *"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className={`w-full bg-zinc-800 border rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 h-24 resize-none ${
                    newAssignment.description.trim() ? 'border-white/10 focus:ring-blue-500' : 'border-red-500/50 focus:ring-red-500'
                  }`}
                />
                {!newAssignment.description.trim() && (
                  <p className="text-red-400 text-xs mt-1">* Description is required</p>
                )}
              </div>
              <div>
                <input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className={`w-full bg-zinc-800 border rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 ${
                    newAssignment.dueDate ? 'border-white/10 focus:ring-blue-500' : 'border-red-500/50 focus:ring-red-500'
                  }`}
                />
                {!newAssignment.dueDate && (
                  <p className="text-red-400 text-xs mt-1">* Due date is required</p>
                )}
              </div>
              
              {/* Assignment Type Selection */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Assignment Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAssignment({ ...newAssignment, type: 'individual' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newAssignment.type === 'individual'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <FileText size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium">Individual</div>
                    <div className="text-xs text-zinc-500 mt-1">File submission</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAssignment({ ...newAssignment, type: 'group' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newAssignment.type === 'group'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <Users size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium">Group</div>
                    <div className="text-xs text-zinc-500 mt-1">Collaboration</div>
                  </button>
                </div>
              </div>
              
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAssignment.isEditable}
                  onChange={(e) => setNewAssignment({ ...newAssignment, isEditable: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm">Allow students to edit</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setNewAssignment({ title: '', description: '', dueDate: '', isEditable: false });
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAssignment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New Poll</h2>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Poll Question *"
                  value={newPoll.question}
                  onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                  className={`w-full bg-zinc-800 border rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                    newPoll.question.trim() ? 'border-white/10 focus:ring-purple-500' : 'border-red-500/50 focus:ring-red-500'
                  }`}
                />
                {!newPoll.question.trim() && (
                  <p className="text-red-400 text-xs mt-1">* Question is required</p>
                )}
              </div>
              <div className="space-y-2">
                {newPoll.options.map((option, idx) => (
                  <div key={idx}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1} ${idx < 2 ? '*' : ''}`}
                        value={option}
                        onChange={(e) => updatePollOption(idx, e.target.value)}
                        className={`flex-1 bg-zinc-800 border rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                          option.trim() || idx >= 2 ? 'border-white/10 focus:ring-purple-500' : 'border-red-500/50 focus:ring-red-500'
                        }`}
                      />
                      {newPoll.options.length > 2 && (
                        <button
                          onClick={() => removePollOption(idx)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    {idx < 2 && !option.trim() && (
                      <p className="text-red-400 text-xs mt-1">* At least 2 options required</p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addPollOption}
                className="w-full px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors text-sm"
              >
                + Add Option
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPollModal(false);
                  setNewPoll({ question: '', options: ['', ''] });
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPoll}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors"
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default InstructorDashboard;
