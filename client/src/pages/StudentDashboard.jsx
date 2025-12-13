import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { BookOpen, Clock, CheckCircle, Circle, Users, Upload, FileText } from 'lucide-react';

const StudentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submission, setSubmission] = useState({
    description: '',
    fileUrl: '',
    fileName: ''
  });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'student') {
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
      if (res.ok) {
        setAssignments(data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
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

  const handleVote = async (pollId, optionIndex) => {
    try {
      const res = await fetch(`http://localhost:3001/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ optionIndex })
      });

      if (res.ok) {
        fetchPolls(); // Refresh polls
        alert('Vote submitted successfully!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to vote');
      }
    } catch (err) {
      console.error('Error voting:', err);
      alert('Error submitting vote');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const hasSubmitted = (assignment) => {
    return assignment.submissions?.some(sub => sub.studentId === user.id);
  };

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionModal(true);
  };

  const submitAssignment = async () => {
    if (!submission.description.trim() && !submission.fileUrl.trim()) {
      alert('Please provide a description or file URL');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/assignments/${selectedAssignment._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submission)
      });

      if (res.ok) {
        alert('✅ Assignment submitted successfully!');
        setShowSubmissionModal(false);
        setSubmission({ description: '', fileUrl: '', fileName: '' });
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to submit assignment');
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert('Error submitting assignment');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">
            📚 Student Dashboard
          </h1>
          <p className="text-zinc-500">View assignments and participate in polls</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="text-blue-400" size={24} />
              <span className="text-sm font-medium text-zinc-400">Total Assignments</span>
            </div>
            <div className="text-4xl font-bold text-white">{assignments.length}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-purple-400" size={24} />
              <span className="text-sm font-medium text-zinc-400">Active Polls</span>
            </div>
            <div className="text-4xl font-bold text-white">{polls.length}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-400" size={24} />
              <span className="text-sm font-medium text-zinc-400">Completed</span>
            </div>
            <div className="text-4xl font-bold text-white">0</div>
          </div>
        </div>

        {/* Assignments Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-400" />
            Assignments
          </h2>
          
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <BookOpen size={48} className="mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-500">No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          assignment.type === 'group'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {assignment.type === 'group' ? 'Group' : 'Individual'}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">By {assignment.instructorName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isOverdue(assignment.dueDate)
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : hasSubmitted(assignment)
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {isOverdue(assignment.dueDate) ? 'Overdue' : hasSubmitted(assignment) ? 'Submitted' : 'Pending'}
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 mb-4">{assignment.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Clock size={16} />
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    </div>
                    {assignment.type === 'group' ? (
                      <button
                        onClick={() => navigate(`/room/${assignment.title.toLowerCase().replace(/\s+/g, '-')}`)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Users size={16} />
                        Collaborate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubmitAssignment(assignment)}
                        disabled={hasSubmitted(assignment)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          hasSubmitted(assignment)
                            ? 'bg-green-600/20 text-green-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {hasSubmitted(assignment) ? (
                          <><CheckCircle size={16} /> Submitted</>
                        ) : (
                          <><Upload size={16} /> Submit</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Polls Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Users size={24} className="text-purple-400" />
            Active Polls
          </h2>
          
          {polls.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <Users size={48} className="mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-500">No active polls</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {polls.map((poll) => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                const hasVoted = poll.options.some(opt => opt.voters.includes(user.id));

                return (
                  <div
                    key={poll._id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{poll.question}</h3>
                    <p className="text-sm text-zinc-500 mb-4">By {poll.instructorName}</p>
                    
                    <div className="space-y-3">
                      {poll.options.map((option, index) => {
                        const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(1) : 0;
                        const isSelected = option.voters.includes(user.id);
                        
                        return (
                          <button
                            key={index}
                            onClick={() => !hasVoted && handleVote(poll._id, index)}
                            disabled={hasVoted}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                              hasVoted
                                ? isSelected
                                  ? 'bg-purple-500/20 border-purple-500/50'
                                  : 'bg-zinc-800/50 border-zinc-700'
                                : 'bg-zinc-800/50 border-zinc-700 hover:border-purple-500/50 hover:bg-purple-500/10 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <CheckCircle size={18} className="text-purple-400" />
                                ) : (
                                  <Circle size={18} className="text-zinc-600" />
                                )}
                                <span className="font-medium">{option.text}</span>
                              </div>
                              {hasVoted && (
                                <span className="text-sm font-semibold text-purple-400">{percentage}%</span>
                              )}
                            </div>
                            {hasVoted && (
                              <div className="w-full bg-zinc-700 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {hasVoted && (
                      <p className="text-xs text-zinc-500 mt-4 text-center">
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • You have voted
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Submit Assignment</h2>
            <h3 className="text-lg text-zinc-400 mb-6">{selectedAssignment.title}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Description (Optional)</label>
                <textarea
                  placeholder="Add any notes or description about your submission..."
                  value={submission.description}
                  onChange={(e) => setSubmission({ ...submission, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">File URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/..."
                  value={submission.fileUrl}
                  onChange={(e) => setSubmission({ ...submission, fileUrl: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-zinc-500 mt-1">Paste a link to your Google Drive, Dropbox, or GitHub file</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">File Name (Optional)</label>
                <input
                  type="text"
                  placeholder="assignment.pdf"
                  value={submission.fileName}
                  onChange={(e) => setSubmission({ ...submission, fileName: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSubmissionModal(false);
                  setSubmission({ description: '', fileUrl: '', fileName: '' });
                  setSelectedAssignment(null);
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitAssignment}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StudentDashboard;
