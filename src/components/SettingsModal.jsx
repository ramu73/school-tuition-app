import React, { useState } from 'react';
import { Database, Copy, Check, RefreshCw, Download, AlertTriangle, X, CloudUpload, Trash2 } from 'lucide-react';
import { testSupabaseConnection, syncTuitionDataToSupabase, clearSupabaseDatabase } from '../lib/supabase';
import { getSupabaseConfig, saveSupabaseConfig, getStoredData, saveStoredData, getEmptyTuitionData, INITIAL_CLASSES, INITIAL_BATCHES, INITIAL_STUDENTS, INITIAL_FEES, INITIAL_RECEIPTS, INITIAL_EXAMS, INITIAL_MARKS, INITIAL_ATTENDANCE } from '../lib/storage';

export default function SettingsModal({ isOpen, onClose, onDataReset }) {
  if (!isOpen) return null;

  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

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
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-primary" />
            <h2 className="modal-title">Database & Cloud Sync Settings</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Supabase Config Form */}
        <form onSubmit={handleTestAndSave} className="admission-form">
          <div className="settings-notice">
            <strong>Free Cloud PostgreSQL with Real-time:</strong> Enter your Supabase Project URL and Anon Key to activate permanent live real-time sync. If left empty, the app uses the built-in fast local real-time store.
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

        <hr className="divider mt-4 mb-4" />

        {/* Cloud Actions (if connected) */}
        {currentConfig.isConnected && (
          <div className="data-management-row mb-4">
            <div>
              <div className="font-semibold text-xs text-primary">Live Cloud Synchronization</div>
              <div className="text-xs text-muted">Upload all current students, batches, and fees into your Supabase database</div>
            </div>
            <button 
              type="button" 
              className="btn btn-primary btn-sm" 
              onClick={handlePushToSupabase}
              disabled={pushing}
            >
              <CloudUpload size={14} />
              <span>{pushing ? 'Uploading to Supabase...' : 'Push All Data to Supabase'}</span>
            </button>
          </div>
        )}

        {/* Data Backup & Reset */}
        <div className="data-management-row">
          <div>
            <div className="font-semibold text-xs">Tuition Records Management</div>
            <div className="text-xs text-muted">Start fresh with clean database or backup data</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-secondary btn-sm" onClick={handleExportJson}>
              <Download size={13} />
              <span>Backup JSON</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleResetData} title="Restore standard 12 sample students">
              <RefreshCw size={13} />
              <span>Sample Demo</span>
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleStartClean} title="Wipe out demo data and start with 0 students">
              <Trash2 size={13} />
              <span>Start Fresh (0 Students)</span>
            </button>
          </div>
        </div>
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
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
      `}</style>
    </div>
  );
}
