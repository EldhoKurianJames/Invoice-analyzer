import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Upload, 
  BarChart3, 
  CheckCircle, 
  Users, 
  FileText, 
  Shield,
  Home,
  Search,
  Moon,
  Sun
} from 'lucide-react';
import './index.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import pages
import Dashboard from './pages/Dashboard';
import UploadInvoice from './pages/UploadInvoice';
import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import Vendors from './pages/Vendors';
import SignedInvoices from './pages/SignedInvoices';
import ProductClassifier from './pages/ProductClassifier';

const navItems = [
  { path: '/', name: 'Dashboard', icon: Home },
  { path: '/upload', name: 'Upload Invoice', icon: Upload },
  { path: '/analytics', name: 'Analytics', icon: BarChart3 },
  { path: '/approvals', name: 'Approvals', icon: CheckCircle },
  { path: '/vendors', name: 'Vendors & Fraud', icon: Shield },
  { path: '/signed', name: 'Signed Invoices', icon: FileText },
  { path: '/classify', name: 'Product Classifier', icon: Search },
];

function Sidebar() {
  const location = useLocation();
  const { dark, toggle } = useTheme();

  return (
    <div className="w-60 bg-slate-900 min-h-screen fixed left-0 top-0 flex flex-col">
      <div className="px-6 py-7 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Invoice AI</h1>
            <p className="text-xs text-slate-500">Processing System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
        >
          {dark ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <p className="text-xs text-slate-600 px-3">v1.0 · localhost:8001</p>
      </div>
    </div>
  );
}

function AppInner() {
  const { dark } = useTheme();
  return (
    <Router>
      <div className={`min-h-screen ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Sidebar />
        <main className="ml-60 min-h-screen">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadInvoice />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/signed" element={<SignedInvoices />} />
              <Route path="/classify" element={<ProductClassifier />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

export default App;
