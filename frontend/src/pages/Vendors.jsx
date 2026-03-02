import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Search } from 'lucide-react';
import { getVendors, getFraudStats } from '../services/api';

function Vendors() {
  const [vendors, setVendors] = useState(null);
  const [fraudStats, setFraudStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorsData, fraudData] = await Promise.all([
        getVendors(),
        getFraudStats()
      ]);
      setVendors(vendorsData);
      setFraudStats(fraudData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  const vendorList = vendors?.vendors || [];
  const filteredVendors = vendorList.filter(v => 
    v.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const summary = fraudStats?.summary || {};

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Vendors & Fraud Detection</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monitor vendor risk scores and fraud signals</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Invoices', value: summary.total_invoices_processed || 0, icon: Shield },
          { label: 'Vendors Tracked', value: summary.total_vendors_tracked || 0, icon: TrendingUp },
          { label: 'High Risk Vendors', value: summary.high_risk_vendors || 0, icon: AlertTriangle },
          { label: 'Price Records', value: summary.price_history_records || 0, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Detection Features */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Detection Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: 'Duplicate Detection', desc: 'Flags invoices with same ID, amount+date, or similar patterns' },
            { title: 'Price Anomaly', desc: 'Alerts when prices deviate >30% from historical average' },
            { title: 'Vendor Risk Scoring', desc: 'Tracks vendor reliability based on invoice success/failure rate' },
          ].map(({ title, desc }) => (
            <div key={title} className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Vendor Risk Scores</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search vendors..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        {filteredVendors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Vendor Name','Invoices','Successful','Failed','Success Rate','Total Amount','Risk Score','Level'].map(h => (
                    <th key={h} className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left py-3 px-3 first:pl-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filteredVendors.map((vendor, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-3 pl-0 font-medium text-slate-800 dark:text-slate-100">{vendor.vendor_name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{vendor.total_invoices}</td>
                    <td className="py-3 px-3 text-emerald-600 font-medium">{vendor.successful_invoices}</td>
                    <td className="py-3 px-3 text-red-500">{vendor.failed_invoices}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{vendor.success_rate}</td>
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-100 font-medium">${vendor.total_amount_processed?.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-600 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${vendor.risk_score >= 70 ? 'bg-red-500' : vendor.risk_score >= 40 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${vendor.risk_score}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{vendor.risk_score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        vendor.risk_level === 'HIGH' ? 'bg-red-50 text-red-700' :
                        vendor.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'}`}>
                        {vendor.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Shield className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">No vendors tracked yet</p>
            <p className="text-xs text-slate-300 mt-1">Upload invoices to start tracking vendor performance</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Vendors;
