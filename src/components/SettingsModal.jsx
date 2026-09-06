import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  X, 
  CloudUpload, 
  Trash2,
  ShieldCheck,
  Key,
  User,
  Lock,
  Eye,
  EyeOff,
  FolderArchive
} from 'lucide-react';
import { testSupabaseConnection, syncTuitionDataToSupabase, clearSupabaseDatabase } from '../lib/supabase';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  getStoredData, 
  saveStoredData, 
  getEmptyTuitionData, 
  INITIAL_CLASSES, 
  INITIAL_BATCHES, 
  INITIAL_STUDENTS, 
  INITIAL_FEES, 
  INITIAL_RECEIPTS, 
  INITIAL_EXAMS, 
  INITIAL_MARKS, 
  INITIAL_ATTENDANCE 
} from '../lib/storage';
import { getStaffAccounts, saveStaffAccounts } from '../lib/auth';

export default function SettingsModal({ isOpen, onClose, onDataReset }) {
  if (!isOpen) return null;

  const [activeSettingsTab, setActiveSettingsTab] = useState('database');

  // Supabase Config State
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Staff Credentials State
  const initialAccounts = getStaffAccounts();
  const [adminUser, setAdminUser] = useState(initialAccounts.admin.username || 'admin');
  const [adminPass, setAdminPass] = useState(initialAccounts.admin.password || 'admin123');
  const [adminName, setAdminName] = useState(initialAccounts.admin.name || 'Tuition Director');
  
  const [teacherUser, setTeacherUser] = useState(initialAccounts.teacher.username || 'teacher');
  const [teacherPass, setTeacherPass] = useState(initialAccounts.teacher.password || 'teacher123');
  const [teacherName, setTeacherName] = useState(initialAccounts.teacher.name || 'Mr. R. Sharma');

  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [credSaved, setCredSaved] = useState(false);

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url, anonKey);
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig({
        url,
        anonKey,
        isConnected: true
      });
    }
  };

  const handleDisconnect = () => {
    saveSupabaseConfig({
      url: '',
      anonKey: '',
      isConnected: false
    });
    setUrl('');
    setAnonKey('');
    setTestResult({ success: false, message: 'Disconnected. Switched back to local storage.' });
  };

  const handlePushToSupabase = async () => {
    setPushing(true);
    try {
      const currentData = getStoredData();
      const res = await syncTuitionDataToSupabase(currentData);
      if (res.success) {
        alert('All local tuition data successfully uploaded & synced to your Supabase PostgreSQL database!');
      } else {
        alert('Failed to upload data to Supabase: ' + (res.error || 'Check connection settings'));
      }
    } catch (err) {
      alert('Error during cloud sync: ' + err.message);
    } finally {
      setPushing(false);
    }
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    const updatedAccounts = {
      admin: {
        ...initialAccounts.admin,
        username: adminUser.trim(),
        password: adminPass.trim(),
        name: adminName.trim()
      },
      teacher: {
        ...initialAccounts.teacher,
        username: teacherUser.trim(),
        password: teacherPass.trim(),
        name: teacherName.trim()
      }
    };
    saveStaffAccounts(updatedAccounts);
    setCredSaved(true);
    setTimeout(() => setCredSaved(false), 3000);
  };

  const handleStartClean = async () => {
    if (window.confirm('Clear all sample students, fees, attendance, and exams to start fresh with 0 students? (Class 1 to 10 structure will be kept).')) {
      const cleanData = getEmptyTuitionData();
      saveStoredData(cleanData);
      onDataReset(cleanData);

      const config = getSupabaseConfig();
      if (config.isConnected) {
        await clearSupabaseDatabase();
      }
      alert('Cleared! Your tuition database is now clean with 0 students, ready for real student admissions.');
      onClose();
    }
  };

  const handleExportJson = () => {
    const data = localStorage.getItem('vidyatrack_tuition_data_v1') || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `Hayagriva_Tutorials_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all records to standard Class 1 to 10 sample demo data?')) {
      const defaultData = {
        classes: INITIAL_CLASSES,
        batches: INITIAL_BATCHES,
        students: INITIAL_STUDENTS,
        fees: INITIAL_FEES,
        receipts: INITIAL_RECEIPTS,
        exams: INITIAL_EXAMS,
        marks: INITIAL_MARKS,
        attendance: INITIAL_ATTENDANCE
      };
      saveStoredData(defaultData);
      onDataReset(defaultData);

      const config = getSupabaseConfig();
      if (config.isConnected) {
        syncTuitionDataToSupabase(defaultData);
      }
      alert('Data reset to demo data successfully!');
      onClose();
    }
  };

  const sqlCode = `-- Run this in Supabase SQL Editor to create all tables with real-time replication:
CREATE TABLE IF NOT EXISTS class_levels (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL,
    default_monthly_fee NUMERIC(10,2) DEFAULT 800.00
);
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(20) REFERENCES class_levels(code),
    timing VARCHAR(50) NOT NULL,
    tutor_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    max_capacity INT DEFAULT 30
);
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    admission_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    class_code VARCHAR(20) REFERENCES class_levels(code),
    batch_id INT REFERENCES batches(id),
    school_name VARCHAR(150),
    parent_name VARCHAR(150) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    monthly_fee NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    batch_id INT REFERENCES batches(id),
    date DATE NOT NULL,
    status VARCHAR(15) NOT NULL,
    UNIQUE(student_id, date)
);
CREATE TABLE IF NOT EXISTS fee_records (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    month_year VARCHAR(20) NOT NULL,
    amount_due NUMERIC(10,2) NOT NULL,
    amount_paid NUMERIC(10,2) DEFAULT 0.00,
    balance NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'PENDING'
);
ALTER PUBLICATION supabase_realtime ADD TABLE students, attendance, fee_records;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary" />
            <h2 className="modal-title">Settings & System Management</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="settings-nav-tabs">
          <button 
            type="button"
            className={`settings-nav-btn ${activeSettingsTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('database')}
          >
            <Database size={15} />
            <span>Supabase Cloud DB</span>
          </button>
          <button 
            type="button"
            className={`settings-nav-btn ${activeSettingsTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('security')}
          >
            <Key size={15} />
            <span>Staff Passwords</span>
          </button>
          <button 
            type="button"
            className={`settings-nav-btn ${activeSettingsTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('backup')}
          >
            <FolderArchive size={15} />
            <span>Data & Backup</span>
          </button>
        </div>

        {/* TAB 1: DATABASE & SUPABASE */}
        {activeSettingsTab === 'database' && (
          <div className="settings-tab-content">
            <form onSubmit={handleTestAndSave} className="admission-form">
              <div className="settings-notice">
                <strong>Free Cloud PostgreSQL with Real-time:</strong> Enter your Supabase Project URL and Anon Key to activate permanent live real-time sync.
              </div>

              <div className="form-group">
                <label className="form-label">Supabase Project URL</label>
                <input 
                  type="url"
                  className="form-input"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supabase Anon Public API Key</label>
                <input 
                  type="password"
                  className="form-input"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                />
              </div>

              {testResult && (
                <div className={`connection-alert ${testResult.success ? 'alert-success' : 'alert-danger'}`}>
                  {testResult.message}
                </div>
              )}

              <div className="modal-actions-flex">
                {currentConfig.isConnected && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleDisconnect}>
                    Disconnect
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={testing || !url || !anonKey}>
                  {testing ? 'Testing...' : 'Test & Connect to Supabase'}
                </button>
              </div>
            </form>

            <hr className="divider mt-4 mb-4" />

            {/* SQL Schema Copy Section */}
            <div className="sql-section">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-xs text-secondary">
                  Supabase SQL Table Schema & Realtime Setup:
                </div>
                <button className="btn btn-secondary btn-sm" onClick={copySql}>
                  {copiedSql ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
                </button>
              </div>
              <pre className="sql-snippet-box">
                <code>{sqlCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF PASSWORDS & SECURITY */}
        {activeSettingsTab === 'security' && (
          <div className="settings-tab-content">
            <form onSubmit={handleSaveCredentials} className="security-form">
              <div className="settings-notice">
                <strong>Protect Your Tuition Data:</strong> Change your Admin & Teacher login passwords here. Only authorized personnel with these credentials can access staff dashboards.
              </div>

              {credSaved && (
                <div className="connection-alert alert-success">
                  <Check size={16} />
                  <span>Staff credentials updated successfully! Keep your new password secure.</span>
                </div>
              )}

              {/* Admin Account Section */}
              <div className="security-card">
                <div className="security-card-header">
                  <ShieldCheck size={16} className="text-primary" />
                  <span className="font-semibold text-sm text-white">Admin Account (Director Access)</span>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Admin Username</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={adminUser} 
                      onChange={(e) => setAdminUser(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Password</label>
                    <div className="input-with-icon-right">
                      <input 
                        type={showAdminPass ? 'text' : 'password'} 
                        required 
                        className="form-input" 
                        value={adminPass} 
                        onChange={(e) => setAdminPass(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        className="pass-eye-btn" 
                        onClick={() => setShowAdminPass(!showAdminPass)}
                      >
                        {showAdminPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher Account Section */}
              <div className="security-card mt-3">
                <div className="security-card-header">
                  <Key size={16} className="text-emerald" />
                  <span className="font-semibold text-sm text-white">Teacher / Tutor Account</span>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Teacher Username</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={teacherUser} 
                      onChange={(e) => setTeacherUser(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teacher Password</label>
                    <div className="input-with-icon-right">
                      <input 
                        type={showTeacherPass ? 'text' : 'password'} 
                        required 
                        className="form-input" 
                        value={teacherPass} 
                        onChange={(e) => setTeacherPass(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        className="pass-eye-btn" 
                        onClick={() => setShowTeacherPass(!showTeacherPass)}
                      >
                        {showTeacherPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>Save Updated Passwords</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: DATA BACKUP & RESET */}
        {activeSettingsTab === 'backup' && (
          <div className="settings-tab-content">
            {/* Cloud Push */}
            {currentConfig.isConnected && (
              <div className="backup-card mb-4">
                <div>
                  <div className="font-semibold text-sm text-primary">Live Cloud Push</div>
                  <div className="text-xs text-muted">Upload and replace current tuition records directly into your Supabase database</div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={handlePushToSupabase}
                  disabled={pushing}
                >
                  <CloudUpload size={14} />
                  <span>{pushing ? 'Uploading...' : 'Push Data to Supabase'}</span>
                </button>
              </div>
            )}

            {/* Export JSON */}
            <div className="backup-card mb-3">
              <div>
                <div className="font-semibold text-sm text-white">Download Offline Backup</div>
                <div className="text-xs text-muted">Save a complete JSON snapshot of all students, fees, and marks to your computer</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleExportJson}>
                <Download size={14} />
                <span>Backup JSON</span>
              </button>
            </div>

            {/* Clear or Demo Reset */}
            <div className="backup-card mb-3">
              <div>
                <div className="font-semibold text-sm text-amber">Reset to Demo Data</div>
                <div className="text-xs text-muted">Load 12 sample demo students across classes 1 to 10 for testing</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleResetData}>
                <RefreshCw size={14} />
                <span>Load Demo Data</span>
              </button>
            </div>

            <div className="backup-card danger-card">
              <div>
                <div className="font-semibold text-sm text-rose-400">Start Fresh with 0 Students</div>
                <div className="text-xs text-muted">Wipes out all test/demo students & fee records so you can begin real admissions</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleStartClean}>
                <Trash2 size={14} />
                <span>Clear All Records</span>
              </button>
            </div>
          </div>
        )}
      </div>


      <style>{`
        .settings-modal {
          max-width: 650px;
        }
        .settings-notice {
          font-size: 0.8125rem;
          color: #C7D2FE;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 12px 14px;
          border-radius: var(--radius-md);
          margin-bottom: 16px;
        }
        .connection-alert {
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          margin-bottom: 14px;
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.12);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .alert-danger {
          background: rgba(244, 63, 94, 0.12);
          color: #FB7185;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }
        .divider {
          border: none;
          border-top: 1px solid var(--border-subtle);
        }
        .sql-snippet-box {
          background: rgba(0, 0, 0, 0.5);
          padding: 12px;
          border-radius: var(--radius-md);
          font-family: monospace;
          font-size: 0.725rem;
          color: #94A3B8;
          max-height: 140px;
          overflow-y: auto;
          white-space: pre-wrap;
          border: 1px solid var(--border-subtle);
        }
        .data-management-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .settings-nav-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          background: rgba(15, 23, 42, 0.6);
          padding: 4px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          margin-bottom: 20px;
        }
        .settings-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .settings-nav-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .settings-nav-btn.active {
          color: white;
          background: var(--primary-600);
          box-shadow: 0 2px 10px rgba(79, 70, 229, 0.4);
        }
        .security-card {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px;
        }
        .security-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .input-with-icon-right {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-icon-right .form-input {
          padding-right: 36px;
        }
        .pass-eye-btn {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        .pass-eye-btn:hover {
          color: white;
        }
        .backup-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          gap: 12px;
        }
        .danger-card {
          border-color: rgba(244, 63, 94, 0.25);
          background: rgba(244, 63, 94, 0.05);
        }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
      `}</style>
    </div>
  );
}
