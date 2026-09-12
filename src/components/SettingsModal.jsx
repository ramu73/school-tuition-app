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
  FolderArchive,
  Plus,
  GraduationCap,
  Users,
  Search,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { testSupabaseConnection, syncTuitionDataToSupabase, clearSupabaseDatabase, syncStaffAccountsToSupabase } from '../lib/supabase';
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
import { 
  getStaffAccounts, 
  saveStaffAccounts, 
  getTeacherAccounts, 
  addTeacherAccount, 
  deleteTeacherAccount,
  assignBatchesToTeacher,
  assignStudentsToTeacher
} from '../lib/auth';

export default function SettingsModal({ isOpen, onClose, onDataReset, batches = [], students = [], onSaveData }) {
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
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Teacher Accounts State
  const allBatches = batches.length > 0 ? batches : (getStoredData().batches || INITIAL_BATCHES);
  const allStudents = students.length > 0 ? students : (getStoredData().students || INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState(initialAccounts.teachers || []);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [newTeacherBatches, setNewTeacherBatches] = useState([]);
  const [newTeacherStudents, setNewTeacherStudents] = useState([]);
  const [newTeacherStudentQuery, setNewTeacherStudentQuery] = useState('');
  const [teacherPassVisible, setTeacherPassVisible] = useState({});
  const [staffMsg, setStaffMsg] = useState(null);

  const [expandedTeacherStudentPicker, setExpandedTeacherStudentPicker] = useState({});
  const [teacherStudentSearchQuery, setTeacherStudentSearchQuery] = useState('');

  const handleToggleTeacherBatch = (teacherId, batchId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    const current = Array.isArray(teacher.assignedBatchIds) ? teacher.assignedBatchIds : [];
    const exists = current.some(id => String(id) === String(batchId));
    const updated = exists
      ? current.filter(id => String(id) !== String(batchId))
      : [...current, batchId];

    assignBatchesToTeacher(teacherId, updated);
    setTeachers(getTeacherAccounts());
    setStaffMsg({ type: 'success', text: `Assigned batches updated for ${teacher.name}!` });
    setTimeout(() => setStaffMsg(null), 2500);
  };

  const handleAssignAllBatches = (teacherId) => {
    const allIds = allBatches.map(b => b.id);
    assignBatchesToTeacher(teacherId, allIds);
    setTeachers(getTeacherAccounts());
    setStaffMsg({ type: 'success', text: `Assigned all batches to teacher!` });
    setTimeout(() => setStaffMsg(null), 2500);
  };

  const handleClearBatches = (teacherId) => {
    assignBatchesToTeacher(teacherId, []);
    setTeachers(getTeacherAccounts());
    setStaffMsg({ type: 'success', text: `Cleared batch assignments for teacher!` });
    setTimeout(() => setStaffMsg(null), 2500);
  };

  const handleToggleTeacherStudent = (teacherId, studentId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    const current = Array.isArray(teacher.assignedStudentIds) ? teacher.assignedStudentIds : [];
    const exists = current.some(id => String(id) === String(studentId));
    const updated = exists
      ? current.filter(id => String(id) !== String(studentId))
      : [...current, studentId];

    assignStudentsToTeacher(teacherId, updated);
    setTeachers(getTeacherAccounts());
    setStaffMsg({ type: 'success', text: `Student assignments updated for ${teacher.name}!` });
    setTimeout(() => setStaffMsg(null), 2500);
  };

  const handleClearTeacherStudents = (teacherId) => {
    assignStudentsToTeacher(teacherId, []);
    setTeachers(getTeacherAccounts());
    setStaffMsg({ type: 'success', text: `Cleared direct student assignments for teacher!` });
    setTimeout(() => setStaffMsg(null), 2500);
  };

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

  const handleSaveAdminCreds = (e) => {
    e.preventDefault();
    const currentAccs = getStaffAccounts();
    const updated = {
      ...currentAccs,
      admin: {
        ...currentAccs.admin,
        username: adminUser.trim(),
        password: adminPass.trim()
      }
    };
    saveStaffAccounts(updated);
    if (getSupabaseConfig().isConnected) {
      syncStaffAccountsToSupabase(updated).catch(() => {});
    }
    setStaffMsg({ type: 'success', text: 'Admin login credentials updated successfully!' });
    setTimeout(() => setStaffMsg(null), 3500);
  };

  const handleAddNewTeacher = (e) => {
    e.preventDefault();
    const res = addTeacherAccount({
      name: newTeacherName,
      subject: newTeacherSubject,
      username: newTeacherUsername,
      password: newTeacherPassword,
      assignedBatchIds: newTeacherBatches,
      assignedStudentIds: newTeacherStudents
    });

    if (res.success) {
      setTeachers(getTeacherAccounts());
      setShowAddTeacher(false);

      // If batches were assigned, update their tutor in data.batches so Batches and Timetable display the new teacher!
      if (newTeacherBatches.length > 0) {
        const stored = getStoredData();
        const updatedBatches = (stored.batches || []).map(b => {
          if (newTeacherBatches.includes(b.id)) {
            return { ...b, tutor: `${newTeacherName.trim()} (${newTeacherSubject.trim() || 'Faculty'})` };
          }
          return b;
        });
        if (typeof onSaveData === 'function') {
          onSaveData({ ...stored, batches: updatedBatches });
        } else {
          saveStoredData({ ...stored, batches: updatedBatches });
        }
      }

      // Sync to Supabase PostgreSQL so other devices / logins immediately have the new teacher
      if (getSupabaseConfig().isConnected) {
        syncStaffAccountsToSupabase(getStaffAccounts()).catch(() => {});
      }

      setNewTeacherName('');
      setNewTeacherSubject('');
      setNewTeacherUsername('');
      setNewTeacherPassword('');
      setNewTeacherBatches([]);
      setNewTeacherStudents([]);
      setNewTeacherStudentQuery('');
      setStaffMsg({ type: 'success', text: `Teacher "${newTeacherName}" account created! They can now log in using username "${newTeacherUsername}".` });
      setTimeout(() => setStaffMsg(null), 4000);
    } else {
      setStaffMsg({ type: 'error', text: res.message || 'Failed to create teacher' });
      setTimeout(() => setStaffMsg(null), 4000);
    }
  };

  const handleDeleteTeacher = (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to remove the teacher account for "${teacherName}"?`)) {
      const res = deleteTeacherAccount(teacherId);
      if (res.success) {
        const remainingTeachers = getTeacherAccounts();
        setTeachers(remainingTeachers);

        // Update any batches that listed this deleted teacher as tutor
        const stored = getStoredData();
        const replacementTutor = remainingTeachers[0] 
          ? `${remainingTeachers[0].name} (${remainingTeachers[0].subject || 'Faculty'})` 
          : 'Faculty';
        const cleanName = (teacherName || '').trim();
        const firstName = cleanName.split(' ')[0] || '';
        const lastName = cleanName.split(' ').pop() || '';

        const updatedBatches = (stored.batches || []).map(b => {
          if (b.tutor && (
            b.tutor.includes(cleanName) || 
            (lastName.length >= 3 && b.tutor.includes(lastName)) ||
            (firstName.length >= 3 && b.tutor.includes(firstName))
          )) {
            return { ...b, tutor: replacementTutor };
          }
          return b;
        });

        if (typeof onSaveData === 'function') {
          onSaveData({ ...stored, batches: updatedBatches });
        } else {
          saveStoredData({ ...stored, batches: updatedBatches });
        }

        // Sync deletion to Supabase PostgreSQL cloud so all other devices and logins purge the deleted teacher
        if (getSupabaseConfig().isConnected) {
          syncStaffAccountsToSupabase(getStaffAccounts()).catch(() => {});
        }

        setStaffMsg({ type: 'success', text: `Teacher "${teacherName}" deleted and batch assignments updated.` });
        setTimeout(() => setStaffMsg(null), 3000);
      } else {
        alert(res.message);
      }
    }
  };

  const toggleTeacherPass = (id) => {
    setTeacherPassVisible(prev => ({ ...prev, [id]: !prev[id] }));
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
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_type VARCHAR(50) DEFAULT 'ALL',
    target_id VARCHAR(50),
    target_name VARCHAR(100),
    posted_by VARCHAR(100) DEFAULT 'Admin',
    announcement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS staff_accounts (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    pin VARCHAR(20) DEFAULT '1234',
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL,
    title VARCHAR(150),
    subject VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    assigned_batch_ids JSONB DEFAULT '[]'::jsonb,
    assigned_student_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER PUBLICATION supabase_realtime ADD TABLE students, attendance, fee_records, announcements, staff_accounts;`;

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
            <ShieldCheck size={22} className="text-primary flex-shrink-0" />
            <h2 className="modal-title">Settings & System Management</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close Settings">
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
            <Users size={15} />
            <span>Staff & Teachers</span>
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

        {/* TAB 2: STAFF & TEACHERS MANAGEMENT */}
        {activeSettingsTab === 'security' && (
          <div className="settings-tab-content">
            <div className="settings-notice mb-3">
              <strong>Staff Roles & Student Privacy:</strong>
              <div className="text-xs text-muted mt-1 leading-relaxed">
                • <strong>Admin</strong> has full access to financial data, fees, admissions, and student records.<br />
                • <strong>Teachers</strong> can only take attendance, view batch schedules, and enter test marks. <em>All student personal details (parent phone numbers, addresses, fee records) are strictly hidden from teachers.</em>
              </div>
            </div>

            {staffMsg && (
              <div className={`connection-alert ${staffMsg.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                {staffMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                <span>{staffMsg.text}</span>
              </div>
            )}

            {/* Section 1: Admin Account */}
            <div className="security-card mb-4">
              <div className="security-card-header">
                <ShieldCheck size={16} className="text-primary" />
                <span className="font-semibold text-sm text-white">Admin Account (Tuition Director)</span>
              </div>
              <form onSubmit={handleSaveAdminCreds}>
                <div className="form-grid-2">
                  <div className="form-group mb-2">
                    <label className="form-label">Admin Username</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={adminUser} 
                      onChange={(e) => setAdminUser(e.target.value)} 
                    />
                  </div>
                  <div className="form-group mb-2">
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
                        title={showAdminPass ? "Hide password" : "Show password"}
                      >
                        {showAdminPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Check size={14} />
                    <span>Save Admin Credentials</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Section 2: Teacher Accounts Management */}
            <div className="security-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-emerald" />
                  <div>
                    <span className="font-semibold text-sm text-white">Teacher & Faculty Accounts</span>
                    <span className="badge badge-class ml-2">{teachers.length} Active</span>
                  </div>
                </div>
                {!showAddTeacher && (
                  <button 
                    type="button" 
                    className="btn btn-success btn-sm"
                    onClick={() => setShowAddTeacher(true)}
                  >
                    <Plus size={14} />
                    <span>Add New Teacher</span>
                  </button>
                )}
              </div>

              {/* Add New Teacher Form */}
              {showAddTeacher && (
                <div className="add-teacher-form-card mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-white">Create New Teacher Account</span>
                    <button 
                      type="button" 
                      className="btn-delete-mini"
                      onClick={() => setShowAddTeacher(false)}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleAddNewTeacher}>
                    <div className="form-grid-2">
                      <div className="form-group mb-2">
                        <label className="form-label">Teacher Name *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Mrs. S. Lakshmi"
                          className="form-input"
                          value={newTeacherName}
                          onChange={(e) => setNewTeacherName(e.target.value)}
                        />
                      </div>
                      <div className="form-group mb-2">
                        <label className="form-label">Subject / Faculty Specialization</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Science & English or Maths"
                          className="form-input"
                          value={newTeacherSubject}
                          onChange={(e) => setNewTeacherSubject(e.target.value)}
                        />
                      </div>
                      <div className="form-group mb-2">
                        <label className="form-label">Teacher Username *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. lakshmi"
                          className="form-input font-mono"
                          value={newTeacherUsername}
                          onChange={(e) => setNewTeacherUsername(e.target.value)}
                        />
                      </div>
                      <div className="form-group mb-2">
                        <label className="form-label">Login Password *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. teach123"
                          className="form-input font-mono"
                          value={newTeacherPassword}
                          onChange={(e) => setNewTeacherPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group mb-2 mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label mb-0 text-xs text-slate-300 font-semibold">Assign Batches (Multi-Class Student Scope)</label>
                        <span className="text-xs text-muted">Teacher accesses all students in selected batches regardless of class</span>
                      </div>
                      <div className="teacher-batch-chips">
                        {allBatches.map(b => {
                          const isAssigned = newTeacherBatches.some(id => String(id) === String(b.id));
                          return (
                            <button
                              key={b.id}
                              type="button"
                              className={`batch-chip-btn ${isAssigned ? 'assigned' : ''}`}
                              onClick={() => {
                                setNewTeacherBatches(prev => {
                                  const exists = prev.some(id => String(id) === String(b.id));
                                  return exists 
                                    ? prev.filter(id => String(id) !== String(b.id)) 
                                    : [...prev, b.id];
                                });
                              }}
                            >
                              <Check size={11} className={isAssigned ? 'icon-show' : 'icon-hide'} />
                              <span>{b.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direct Students by Name Picker */}
                    <div className="form-group mb-2 mt-2 pt-2 border-top-subtle">
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label mb-0 text-xs text-slate-300 font-semibold flex items-center gap-2">
                          <UserCheck size={14} className="text-emerald flex-shrink-0" />
                          <span>Assign Specific Students by Name ({newTeacherStudents.length} selected)</span>
                        </label>
                        {newTeacherStudents.length > 0 && (
                          <button
                            type="button"
                            className="btn-link-action text-xs text-rose-400"
                            onClick={() => setNewTeacherStudents([])}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="search-input-box mb-2">
                        <Search size={13} className="search-icon" />
                        <input
                          type="text"
                          className="form-input text-xs"
                          placeholder="Search student names by typing..."
                          value={newTeacherStudentQuery}
                          onChange={(e) => setNewTeacherStudentQuery(e.target.value)}
                        />
                      </div>
                      <div className="teacher-student-chips-list" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                        {allStudents
                          .filter(s => {
                            if (!s) return false;
                            const st = String(s.status || '').toUpperCase();
                            return st !== 'INACTIVE' && st !== 'DISABLED' && st !== 'DELETED';
                          })
                          .filter(s => {
                            if (!newTeacherStudentQuery.trim()) return true;
                            const q = newTeacherStudentQuery.toLowerCase().trim();
                            return (s.name && s.name.toLowerCase().includes(q)) || 
                                   (s.admissionNo && s.admissionNo.toLowerCase().includes(q));
                          })
                          .map(student => {
                            const isAssigned = newTeacherStudents.some(id => String(id) === String(student.id));
                            return (
                              <button
                                key={student.id}
                                type="button"
                                className={`student-select-pill ${isAssigned ? 'assigned' : ''}`}
                                onClick={() => {
                                  setNewTeacherStudents(prev => {
                                    const exists = prev.some(id => String(id) === String(student.id));
                                    return exists
                                      ? prev.filter(id => String(id) !== String(student.id))
                                      : [...prev, student.id];
                                  });
                                }}
                              >
                                <Check size={11} className={isAssigned ? 'icon-show' : 'icon-hide'} />
                                <span>{student.name}</span>
                                <span className="pill-class-badge font-mono">({(student.classCode || '').replace('CLASS_', '')})</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowAddTeacher(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Plus size={14} />
                        <span>Create Teacher Account</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Existing Teachers List */}
              <div className="teachers-list-container">
                {teachers.map((teacher) => {
                  const isVisible = !!teacherPassVisible[teacher.id];
                  return (
                    <div key={teacher.id} className="teacher-account-card">
                      <div className="teacher-account-header-row">
                        <div className="teacher-info-col">
                          <div className="font-semibold text-sm text-white flex items-center gap-2">
                            <span>{teacher.name}</span>
                            {teacher.subject && (
                              <span className="badge badge-class text-xs">{teacher.subject}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted font-mono mt-0.5">
                            Username: <strong className="text-emerald">@{teacher.username}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="teacher-creds-col">
                            <span className="text-xs text-muted">Password:</span>
                            <span className="font-mono text-xs text-secondary teacher-pass-field">
                              {isVisible ? teacher.password : '••••••••'}
                            </span>
                            <button 
                              type="button" 
                              className="pass-eye-btn-inline"
                              onClick={() => toggleTeacherPass(teacher.id)}
                              title={isVisible ? "Hide password" : "Reveal password"}
                            >
                              {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>

                          <div className="teacher-actions-col">
                            <button 
                              type="button" 
                              className="btn-delete-mini"
                              title="Delete Teacher Account"
                              onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                              disabled={teachers.length <= 1}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Scoped Batch Assignment Row */}
                      {/* Scoped Batch Assignment Row */}
                      <div className="teacher-batches-selector-row">
                        <div className="teacher-batches-header">
                          <div className="teacher-batches-title-row">
                            <Users size={14} className="text-emerald flex-shrink-0" />
                            <span className="font-semibold text-slate-200 text-xs">
                              Assigned Batches ({(teacher.assignedBatchIds || []).length}):
                            </span>
                            <span className="text-xs text-muted teacher-batches-desc">— Teacher can access all students enrolled in these batches across any standard</span>
                          </div>
                          <div className="teacher-batches-actions">
                            <button 
                              type="button" 
                              className="btn-link-action text-primary"
                              onClick={() => handleAssignAllBatches(teacher.id)}
                            >
                              All
                            </button>
                            <span className="text-muted">•</span>
                            <button 
                              type="button" 
                              className="btn-link-action text-rose-400"
                              onClick={() => handleClearBatches(teacher.id)}
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="teacher-batch-chips">
                          {allBatches.map(b => {
                            const isAssigned = (teacher.assignedBatchIds || []).some(id => String(id) === String(b.id));
                            const studentsInB = allStudents.filter(s => {
                              if (!s) return false;
                              const st = String(s.status || '').toUpperCase();
                              if (st === 'INACTIVE' || st === 'DISABLED' || st === 'DELETED') return false;
                              return String(s.batchId) === String(b.id);
                            });
                            const namesInB = studentsInB.map(s => s.name).join(', ');
                            return (
                              <button
                                key={b.id}
                                type="button"
                                className={`batch-chip-btn ${isAssigned ? 'assigned' : ''}`}
                                onClick={() => handleToggleTeacherBatch(teacher.id, b.id)}
                                title={`${b.name} (${b.timing})\nEnrolled students (${studentsInB.length}): ${namesInB || 'None'}`}
                              >
                                <Check size={11} className={isAssigned ? 'icon-show' : 'icon-hide'} />
                                <span>{b.name} ({studentsInB.length})</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Student-wise Direct Assignment by Name */}
                        <div className="teacher-direct-students-section mt-2 pt-2 border-top-subtle">
                          <div className="teacher-direct-students-header">
                            <button
                              type="button"
                              className="btn-toggle-expand"
                              onClick={() => {
                                setExpandedTeacherStudentPicker(prev => ({
                                  ...prev,
                                  [teacher.id]: prev[teacher.id] !== undefined ? !prev[teacher.id] : true
                                }));
                              }}
                            >
                              <UserCheck size={14} className="text-emerald flex-shrink-0" />
                              <span className="font-semibold text-slate-200 text-xs">
                                Select Specific Students by Name ({(teacher.assignedStudentIds || []).length} assigned)
                              </span>
                              {(expandedTeacherStudentPicker[teacher.id] ?? ((teacher.assignedStudentIds || []).length > 0)) ? <ChevronUp size={14} className="flex-shrink-0 text-muted" /> : <ChevronDown size={14} className="flex-shrink-0 text-muted" />}
                            </button>

                            <div className="flex items-center gap-1.5 text-xs">
                              {(teacher.assignedStudentIds || []).length > 0 && (
                                <button
                                  type="button"
                                  className="btn-link-action text-rose-400"
                                  onClick={() => handleClearTeacherStudents(teacher.id)}
                                >
                                  Clear Students
                                </button>
                              )}
                            </div>
                          </div>

                          {(expandedTeacherStudentPicker[teacher.id] ?? ((teacher.assignedStudentIds || []).length > 0)) && (
                            <div className="teacher-student-picker-box mt-2">
                              <div className="search-input-box mb-2">
                                <Search size={14} className="search-icon" />
                                <input
                                  type="text"
                                  className="form-input text-xs"
                                  placeholder="Filter student names..."
                                  value={teacherStudentSearchQuery}
                                  onChange={(e) => setTeacherStudentSearchQuery(e.target.value)}
                                />
                              </div>

                              <div className="teacher-student-chips-list">
                                {allStudents
                                  .filter(s => {
                                    if (!s) return false;
                                    const st = String(s.status || '').toUpperCase();
                                    return st !== 'INACTIVE' && st !== 'DISABLED' && st !== 'DELETED';
                                  })
                                  .filter(s => {
                                    if (!teacherStudentSearchQuery.trim()) return true;
                                    const q = teacherStudentSearchQuery.toLowerCase().trim();
                                    return (s.name && s.name.toLowerCase().includes(q)) || 
                                           (s.admissionNo && s.admissionNo.toLowerCase().includes(q));
                                  })
                                  .map(student => {
                                    const isAssigned = (teacher.assignedStudentIds || []).some(id => String(id) === String(student.id));
                                    const sBatch = allBatches.find(b => String(b.id) === String(student.batchId));
                                    return (
                                      <button
                                        key={student.id}
                                        type="button"
                                        className={`student-select-pill ${isAssigned ? 'assigned' : ''}`}
                                        onClick={() => handleToggleTeacherStudent(teacher.id, student.id)}
                                        title={`Class: ${student.classCode} • Current Batch: ${sBatch?.name || 'Unassigned'}`}
                                      >
                                        <Check size={11} className={isAssigned ? 'icon-show' : 'icon-hide'} />
                                        <span>{student.name}</span>
                                        <span className="pill-class-badge font-mono">({(student.classCode || '').replace('CLASS_', '')})</span>
                                      </button>
                                    );
                                  })}
                              </div>

                              {/* Save & Confirm Footer Bar */}
                              <div className="picker-footer-bar mt-2 pt-2 border-top-subtle flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-xs text-primary"
                                    onClick={() => {
                                      const filteredIds = allStudents
                                        .filter(s => {
                                          if (!s) return false;
                                          const st = String(s.status || '').toUpperCase();
                                          return st !== 'INACTIVE' && st !== 'DISABLED' && st !== 'DELETED';
                                        })
                                        .filter(s => {
                                          if (!teacherStudentSearchQuery.trim()) return true;
                                          const q = teacherStudentSearchQuery.toLowerCase().trim();
                                          return (s.name && s.name.toLowerCase().includes(q)) || 
                                                 (s.admissionNo && s.admissionNo.toLowerCase().includes(q));
                                        })
                                        .map(s => s.id);

                                      const current = Array.isArray(teacher.assignedStudentIds) ? teacher.assignedStudentIds : [];
                                      const combined = [...new Set([...current.map(String), ...filteredIds.map(String)])];
                                      assignStudentsToTeacher(teacher.id, combined);
                                      setTeachers(getTeacherAccounts());
                                      setStaffMsg({ type: 'success', text: `✓ Added all filtered students to ${teacher.name}!` });
                                      setTimeout(() => setStaffMsg(null), 2500);
                                    }}
                                  >
                                    Select Filtered
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-xs text-rose-400"
                                    onClick={() => handleClearTeacherStudents(teacher.id)}
                                  >
                                    Clear All
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs flex items-center gap-1.5"
                                  onClick={() => {
                                    setStaffMsg({ 
                                      type: 'success', 
                                      text: `✓ Saved! ${teacher.name} will now only see these ${(teacher.assignedStudentIds || []).length} assigned students.` 
                                    });
                                    setTimeout(() => setStaffMsg(null), 3500);
                                  }}
                                >
                                  <Check size={13} />
                                  <span>Save Student Scope ({(teacher.assignedStudentIds || []).length} Selected)</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          width: 100%;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
          padding: 0;
          flex-shrink: 0;
        }
        .close-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.08);
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
        .add-teacher-form-card {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-md);
          padding: 14px;
        }
        .teachers-list-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .teacher-account-card {
          display: flex;
          flex-direction: column;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: var(--radius-md);
          gap: 10px;
        }
        .teacher-account-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .teacher-batches-selector-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .teacher-batches-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 2px;
        }
        .teacher-batches-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          flex: 1;
        }
        .teacher-batches-desc {
          color: var(--text-muted);
          font-size: 0.725rem;
        }
        .teacher-batches-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
        }
        .teacher-batch-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .batch-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          border-radius: var(--radius-full);
          font-size: 0.725rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .batch-chip-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .batch-chip-btn.assigned {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: #A7F3D0;
          font-weight: 600;
        }
        .btn-link-action {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0 4px;
        }
        .btn-link-action:hover {
          text-decoration: underline;
        }
        .icon-show { display: inline-block; }
        .icon-hide { display: none; }
        .teacher-info-col {
          display: flex;
          flex-direction: column;
          min-width: 140px;
        }
        .teacher-creds-col {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.25);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .teacher-pass-field {
          min-width: 70px;
        }
        .pass-eye-btn-inline {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }
        .pass-eye-btn-inline:hover {
          color: white;
        }
        .teacher-actions-col {
          display: flex;
          align-items: center;
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
        .teacher-direct-students-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
        }
        .teacher-direct-students-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn-toggle-expand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 3px 0;
          color: #E2E8F0;
          font-size: 0.78rem;
          font-weight: 600;
          transition: color 0.15s ease;
          text-align: left;
        }
        .btn-toggle-expand:hover {
          color: white;
        }
        .btn-toggle-expand svg {
          flex-shrink: 0;
        }
        .search-input-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .search-input-box .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
          flex-shrink: 0;
        }
        .search-input-box input {
          padding-left: 32px !important;
          width: 100%;
          font-size: 0.78rem;
        }
        .teacher-student-picker-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .teacher-student-chips-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 160px;
          overflow-y: auto;
          padding: 6px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .student-select-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          font-size: 0.725rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .student-select-pill:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }
        .student-select-pill.assigned {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: #A7F3D0;
          font-weight: 600;
        }
        .pill-class-badge {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .items-center { align-items: center; }
        .gap-1 { gap: 4px; }
        .gap-1\.5 { gap: 6px; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .flex-shrink-0 { flex-shrink: 0; }
        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
      `}</style>
    </div>
  );
}
