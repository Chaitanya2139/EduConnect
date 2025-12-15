import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import config from '../config';
import { 
  CheckCircle, 
  MessageCircle, 
  Users, 
  FileText,
  Edit,
  Eye,
  BarChart3
} from 'lucide-react';

const TADashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (user.role !== 'teaching-assistant') {
      navigate('/');
    }
    fetchAssignments();
    fetchSubmissions();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/assignments`, {
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

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) setSubmissions(data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">👨‍💼 Teaching Assistant Dashboard</h1>
          <p className="text-zinc-400">Review submissions, moderate discussions, and assist students</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6">
            <CheckCircle className="text-green-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">{submissions.filter(s => s.status === 'graded').length}</p>
            <p className="text-zinc-400 text-sm">Graded Submissions</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
            <FileText className="text-orange-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">{submissions.filter(s => s.status === 'pending').length}</p>
            <p className="text-zinc-400 text-sm">Pending Reviews</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
            <MessageCircle className="text-blue-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">12</p>
            <p className="text-zinc-400 text-sm">Active Discussions</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6">
            <Users className="text-purple-400 mb-3" size={32} />
            <p className="text-2xl font-bold text-white">24</p>
            <p className="text-zinc-400 text-sm">Total Students</p>
          </div>
        </div>

        {/* Active Assignments */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Active Assignments</h2>
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment._id} className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{assignment.title}</h3>
                  <p className="text-zinc-400 text-sm mb-2">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                      {submissions.filter(s => s.assignmentId === assignment._id).length} submissions
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/room/${assignment.title.toLowerCase().replace(/\s+/g, '-')}`)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    title="View Assignment"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => navigate(`/assignments/${assignment._id}/submissions`)}
                    className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                  >
                    Review Submissions
                  </button>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No active assignments at the moment
              </div>
            )}
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Pending Reviews</h2>
          <div className="space-y-3">
            {submissions.filter(s => s.status === 'pending').map((submission) => (
              <div key={submission._id} className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {submission.studentName?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{submission.studentName}</h3>
                      <p className="text-zinc-400 text-sm">{submission.assignmentTitle}</p>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs">
                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/submissions/${submission._id}/grade`)}
                  className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-medium"
                >
                  Review & Grade
                </button>
              </div>
            ))}
            {submissions.filter(s => s.status === 'pending').length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No pending reviews. Great job!
              </div>
            )}
          </div>
        </div>

        {/* Discussion Moderation */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Discussions</h2>
          <div className="space-y-3">
            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Help with React Hooks</h3>
                  <p className="text-zinc-400 text-sm">Posted by John Doe in Web Development</p>
                </div>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  5 replies
                </span>
              </div>
              <p className="text-zinc-300 text-sm mb-3">
                I'm having trouble understanding useEffect cleanup functions. Can someone explain?
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                  Reply
                </button>
                <button className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
                  Mark Resolved
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Assignment 2 Clarification</h3>
                  <p className="text-zinc-400 text-sm">Posted by Jane Smith in General</p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Resolved
                </span>
              </div>
              <p className="text-zinc-300 text-sm mb-3">
                Should we include unit tests in Assignment 2?
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                  View Thread
                </button>
              </div>
            </div>

            <div className="text-center py-8">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors">
                View All Discussions
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TADashboard;
