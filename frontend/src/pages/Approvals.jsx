import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { getApprovalsDashboard, approveInvoice, rejectInvoice } from '../services/api';

function Approvals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [approverName, setApproverName] = useState('');
  const [showModal, setShowModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [comments, setComments] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getApprovalsDashboard();
      setData(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (approvalId) => {
    if (!approverName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    setActionLoading(approvalId);
    try {
      const result = await approveInvoice(approvalId, approverName, comments);
      alert(result.message || 'Approved successfully');
      setShowModal(null);
      setComments('');
      fetchData();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (approvalId) => {
    if (!approverName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    
    setActionLoading(approvalId);
    try {
      const result = await rejectInvoice(approvalId, approverName, rejectReason);
      alert(result.message || 'Rejected successfully');
      setShowModal(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const pendingByLevel = data?.pending_by_level || {};
  const pendingApprovals = data?.pending_approvals || [];
  const overdueApprovals = data?.overdue_approvals || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Approval Workflow</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review and approve pending invoices</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Approver Name Input */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-5 flex items-center gap-3">
        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Enter your name to approve or reject invoices"
          value={approverName}
          onChange={(e) => setApproverName(e.target.value)}
          className="flex-1 text-sm px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Pending', value: summary.total_pending || 0, icon: Clock },
          { label: 'Approved', value: summary.total_approved || 0, icon: CheckCircle },
          { label: 'Rejected', value: summary.total_rejected || 0, icon: XCircle },
          { label: 'Overdue', value: summary.overdue_count || 0, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Pending by Level */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Pending by Approval Level</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { level: 'Manager', count: pendingByLevel.Manager || 0, sub: 'All invoices' },
            { level: 'Finance', count: pendingByLevel.Finance || 0, sub: '> $50,000' },
            { level: 'Compliance', count: pendingByLevel.Compliance || 0, sub: '> $100,000 or High Risk' },
          ].map(({ level, count, sub }) => (
            <div key={level} className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-lg">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{level}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Approvals */}
      {overdueApprovals.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Overdue — Waiting &gt; 3 days
          </h2>
          <div className="space-y-2">
            {overdueApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between bg-amber-50 px-4 py-2.5 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-slate-800">{approval.invoice_id}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{approval.vendor_name} · ${approval.total_amount?.toLocaleString()}</span>
                </div>
                <span className="text-xs font-semibold text-amber-700">{approval.waiting_days}d overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Pending Approvals</h2>
        {pendingApprovals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Invoice ID','Vendor','Country','Amount','Level','Risk','Waiting','Actions'].map(h => (
                    <th key={h} className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left py-3 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-100">{approval.invoice_id}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{approval.vendor_name || '—'}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 capitalize">{approval.country || '—'}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-100">${approval.total_amount?.toLocaleString() || 0}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        approval.level === 3 ? 'bg-red-50 text-red-700' :
                        approval.level === 2 ? 'bg-indigo-50 text-indigo-700' :
                        'bg-slate-100 text-slate-600'}`}>
                        {approval.level_name}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {approval.fraud_score !== null && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          approval.fraud_score >= 70 ? 'bg-red-50 text-red-700' :
                          approval.fraud_score >= 40 ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'}`}>
                          {approval.fraud_score?.toFixed(0)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400 dark:text-slate-500">{approval.waiting_days}d</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setShowModal({ type: 'approve', approval })}
                          disabled={actionLoading === approval.id}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors">
                          Approve
                        </button>
                        <button onClick={() => setShowModal({ type: 'reject', approval })}
                          disabled={actionLoading === approval.id}
                          className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckCircle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">No pending approvals</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {showModal.type === 'approve' ? 'Approve Invoice' : 'Reject Invoice'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {showModal.approval.invoice_id} &middot; <span className="font-medium text-slate-700">${showModal.approval.total_amount?.toLocaleString()}</span>
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {showModal.type === 'approve' ? 'Comments (optional)' : 'Rejection Reason *'}
              </label>
              <textarea
                value={showModal.type === 'approve' ? comments : rejectReason}
                onChange={(e) => showModal.type === 'approve' ? setComments(e.target.value) : setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                placeholder={showModal.type === 'approve' ? 'Add any comments...' : 'Enter reason for rejection...'}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowModal(null); setComments(''); setRejectReason(''); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => showModal.type === 'approve' ? handleApprove(showModal.approval.id) : handleReject(showModal.approval.id)}
                disabled={!!actionLoading}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${
                  showModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {actionLoading ? 'Processing...' : showModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Approvals;
