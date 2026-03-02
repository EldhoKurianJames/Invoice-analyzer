import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { getSignedInvoices, downloadSignedInvoice, getAllInvoices, exportInvoices, deleteAllInvoices } from '../services/api';

function SignedInvoices() {
  const [signedFiles, setSignedFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [signedData, invoicesData] = await Promise.all([
        getSignedInvoices(),
        getAllInvoices()
      ]);
      setSignedFiles(signedData.files || []);
      setInvoices(invoicesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const blob = await exportInvoices();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices_export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Failed to export: ' + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL invoices? This cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      await deleteAllInvoices();
      alert('All invoices deleted successfully');
      fetchData();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Signed Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Download signed PDFs and manage invoice records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={handleDeleteAll} disabled={deleting} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </div>

      {/* Signed PDFs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Signed PDF Files ({signedFiles.length})</h2>
        {signedFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {signedFiles.map((file, index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={file.filename}>{file.filename}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'PDF Document'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={downloadSignedInvoice(file.filename)} download
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <a href={downloadSignedInvoice(file.filename)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center px-3 py-2 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <FileText className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">No signed invoices yet</p>
            <p className="text-xs text-slate-300 mt-1">Upload and process invoices to generate signed PDFs</p>
          </div>
        )}
      </div>

      {/* All Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">All Processed Invoices ({invoices.length})</h2>
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['ID','Invoice ID','Date','Customer','Total Amount','Tax'].map(h => (
                    <th key={h} className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left py-3 px-3 last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-3 text-slate-400 dark:text-slate-500 text-xs">{invoice.id}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-100">{invoice.invoice_id || '—'}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{invoice.invoice_date || '—'}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{invoice.customer_name || '—'}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800 dark:text-slate-100">${invoice.total_amount?.toLocaleString() || 0}</td>
                    <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400">${invoice.tax_amount?.toLocaleString() || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No invoices in database</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignedInvoices;
