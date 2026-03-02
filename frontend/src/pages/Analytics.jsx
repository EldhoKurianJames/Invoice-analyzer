import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { getAnalyticsDashboard } from '../services/api';

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAnalyticsDashboard();
      setData(response);
    } catch (err) {
      setError('Failed to load analytics data');
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

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-5 flex items-center gap-3">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const summary = data?.summary?.summary || {};
  const charts = data?.charts || {};

  const noData = <p className="text-sm text-slate-400 text-center py-10">No data available</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visual insights into your invoice data</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Invoices', value: summary.total_invoices || 0 },
          { label: 'Total Amount', value: `$${(summary.total_amount_processed || 0).toLocaleString()}` },
          { label: 'Tax Collected', value: `$${(summary.total_tax_collected || 0).toLocaleString()}` },
          { label: 'Countries', value: summary.unique_countries || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* By Country */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">By Country</h3>
          {charts.by_country?.data?.length > 0 ? (
            <div className="space-y-3">
              {charts.by_country.data.map((item, i) => {
                const pct = Math.min(100, (item.total_amount / (charts.by_country.data[0]?.total_amount || 1)) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize truncate">{item.country}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-24 text-right">${item.total_amount.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 w-10 text-right">{item.invoice_count}</span>
                  </div>
                );
              })}
            </div>
          ) : noData}
        </div>

        {/* By Category */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">By Product Category</h3>
          {charts.by_category?.data?.length > 0 ? (
            <div className="space-y-3">
              {charts.by_category.data.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" style={{ opacity: 1 - i * 0.12 }} />
                    <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{item.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.item_count} items</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">${item.total_amount?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : noData}
        </div>

        {/* By Month */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">By Month</h3>
          {charts.by_month?.data?.length > 0 ? (
            <div className="space-y-3">
              {charts.by_month.data.slice(-6).map((item, i) => {
                const maxVal = Math.max(...charts.by_month.data.map(d => d.total_amount)) || 1;
                const pct = Math.min(100, (item.total_amount / maxVal) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-16 text-xs font-medium text-slate-600 dark:text-slate-300">{item.month}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-24 text-right">${item.total_amount.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 w-6 text-right">{item.invoice_count}</span>
                  </div>
                );
              })}
            </div>
          ) : noData}
        </div>

        {/* Tax by Product */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Tax by Product</h3>
          {charts.tax_by_product?.data?.length > 0 ? (
            <div className="space-y-2">
              {charts.tax_by_product.data.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{item.category?.replace(/_/g, ' ')}</span>
                    {item.hs_code && <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">HS {item.hs_code}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.avg_tax_rate}%</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">${item.total_tax_collected?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : noData}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Vendors */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Top Vendors</h3>
          {charts.top_vendors?.data?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Vendor','Invoices','Amount','Risk'].map(h => (
                    <th key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left py-2 last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {charts.top_vendors.data.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-100">{v.vendor_name}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{v.total_invoices}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">${v.total_amount?.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        v.risk_score >= 70 ? 'bg-red-50 text-red-700' :
                        v.risk_score >= 40 ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'}`}>{v.risk_score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : noData}
        </div>

        {/* Top Importers */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Top Importers</h3>
          {charts.top_importers?.data?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Importer','Invoices','Total Amount'].map(h => (
                    <th key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left py-2 last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {charts.top_importers.data.map((imp, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-100">{imp.importer_name}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{imp.invoice_count}</td>
                    <td className="py-2.5 text-right font-medium text-slate-800 dark:text-slate-100">${imp.total_amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : noData}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
