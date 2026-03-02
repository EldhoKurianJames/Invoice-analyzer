import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { getAnalyticsSummary, getApprovalsDashboard } from '../services/api';

function StatCard({ title, value, icon: Icon, link, sub }) {
  const content = (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
          <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>
      {link && (
        <div className="mt-4 flex items-center gap-1 text-xs text-indigo-600 font-medium">
          View details <ArrowUpRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
  if (link) return <Link to={link}>{content}</Link>;
  return content;
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [approvals, setApprovals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, approvalsData] = await Promise.all([
          getAnalyticsSummary(),
          getApprovalsDashboard()
        ]);
        setSummary(summaryData.summary);
        setApprovals(approvalsData);
      } catch (err) {
        setError('Failed to load dashboard data. Make sure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800">Connection Error</p>
          <p className="text-sm text-slate-500 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of your invoice processing system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Invoices" value={summary?.total_invoices || 0} icon={FileText} link="/analytics" sub="All time" />
        <StatCard title="Amount Processed" value={`$${(summary?.total_amount_processed || 0).toLocaleString()}`} icon={DollarSign} link="/analytics" sub="Total value" />
        <StatCard title="Pending Approvals" value={approvals?.summary?.total_pending || 0} icon={Clock} link="/approvals" sub="Awaiting review" />
        <StatCard title="High Risk Invoices" value={summary?.high_risk_invoices || 0} icon={AlertTriangle} link="/vendors" sub="Score ≥ 70" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/upload', icon: Upload, label: 'Upload Invoice' },
            { to: '/approvals', icon: CheckCircle, label: 'Review Approvals' },
            { to: '/analytics', icon: TrendingUp, label: 'View Analytics' },
            { to: '/signed', icon: FileText, label: 'Download Signed' },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group"
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Tax Collected', value: `$${(summary?.total_tax_collected || 0).toLocaleString()}`, sub: 'Total from all invoices' },
          { label: 'This Month', value: summary?.invoices_this_month || 0, sub: 'Invoices processed' },
          { label: 'Vendors Tracked', value: summary?.unique_vendors || 0, sub: 'Unique vendors in system' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
