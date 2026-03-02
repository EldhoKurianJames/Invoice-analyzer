import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { uploadInvoice } from '../services/api';

const COUNTRIES = [
  { value: 'russia', label: 'Russia' },
  { value: 'china', label: 'China' },
  { value: 'india', label: 'India' },
  { value: 'usa', label: 'United States' },
  { value: 'germany', label: 'Germany' },
];

function UploadInvoice() {
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [country, setCountry] = useState('russia');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInvoiceChange = (e) => {
    if (e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
    }
  };

  const handleCertificateChange = (e) => {
    if (e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceFile) {
      alert('Please select an invoice file');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await uploadInvoice(invoiceFile, certificateFile, country);
      setResult(response);
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Upload failed';
      let errorDetails = null;
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        errorDetails = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setResult({
        status: 'error',
        message: errorMessage,
        error_details: errorDetails,
        full_error: error
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInvoiceFile(null);
    setCertificateFile(null);
    setResult(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload Invoice</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload invoices for AI-powered validation and processing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-5">Invoice Details</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Destination Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Invoice Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Invoice File <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${invoiceFile ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleInvoiceChange} className="hidden" id="invoice-upload" />
                <label htmlFor="invoice-upload" className="cursor-pointer">
                  {invoiceFile ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{invoiceFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Click to upload invoice</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, PNG, JPG — up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Certificate <span className="text-slate-400 dark:text-slate-500 font-normal">(optional — required for restricted items)</span>
              </label>
              <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${certificateFile ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleCertificateChange} className="hidden" id="certificate-upload" />
                <label htmlFor="certificate-upload" className="cursor-pointer">
                  {certificateFile ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{certificateFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Click to upload certificate</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !invoiceFile}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Upload className="w-4 h-4" /> Upload & Validate</>}
            </button>
          </form>
        </div>

        {/* Result Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-5">Processing Result</h2>

          {!result && !loading && (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400 dark:text-slate-500">Upload an invoice to see results</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 mx-auto text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Processing invoice...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium ${
                result.status === 'processed_and_saved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : result.status === 'validation_failed'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {result.status === 'processed_and_saved' ? <CheckCircle className="w-4 h-4" />
                  : result.status === 'validation_failed' ? <AlertTriangle className="w-4 h-4" />
                  : <XCircle className="w-4 h-4" />}
                {result.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>

              {/* Validation Errors */}
              {result.errors?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Validation Errors</p>
                  <ul className="space-y-1.5">
                    {result.errors.map((error, i) => (
                      <li key={i} className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* System Error */}
              {result.status === 'error' && result.message && (
                <div className="text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-medium text-red-800 mb-1">{result.message}</p>
                  {result.error_details && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-red-500">Show technical details</summary>
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">{JSON.stringify(result.error_details, null, 2)}</pre>
                    </details>
                  )}
                </div>
              )}

              {/* Success — download + approval */}
              {result.status === 'processed_and_saved' && (
                <div className="space-y-3">
                  {result.download_url && (
                    <a href={result.download_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors">
                      <FileText className="w-4 h-4" /> Download Signed Invoice
                    </a>
                  )}
                  {result.approval && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Approval Status</p>
                      <p>Status: <span className="font-medium text-slate-800 dark:text-slate-100">{result.approval.status}</span></p>
                      <p>Level: <span className="font-medium text-slate-800 dark:text-slate-100">{result.approval.level}</span></p>
                      <p>Approver: <span className="font-medium text-slate-800 dark:text-slate-100">{result.approval.current_approver}</span></p>
                    </div>
                  )}
                </div>
              )}

              {/* Fraud Analysis */}
              {result.fraud_analysis && (
                <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Fraud Analysis</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      result.fraud_analysis.risk_level === 'HIGH' ? 'bg-red-100 text-red-700'
                      : result.fraud_analysis.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                    }`}>{result.fraud_analysis.risk_level}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Score: <span className="font-semibold">{result.fraud_analysis.fraud_score}</span></span>
                  </div>
                  {result.fraud_analysis.flags?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {result.fraud_analysis.flags.map((flag, i) => (
                        <li key={i} className="text-xs text-red-600">• {flag}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <button onClick={resetForm}
                className="w-full border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors">
                Upload Another Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadInvoice;
