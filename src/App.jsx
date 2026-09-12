import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Batches from './components/Batches';
import Attendance from './components/Attendance';
import Fees from './components/Fees';
import Exams from './components/Exams';
import BroadcastNotifications from './components/BroadcastNotifications';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import ParentPortal from './components/ParentPortal';
import { getStoredData, saveStoredData, getSupabaseConfig, getEmptyTuitionData } from './lib/storage';
import { getSupabaseClient, fetchTuitionDataFromSupabase, syncTuitionDataToSupabase, fetchStaffAccountsFromSupabase } from './lib/supabase';
import { getAuthSession, setAuthSession, clearAuthSession, getStaffAccounts, USER_ROLES } from './lib/auth';

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error in TabErrorBoundary:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card text-center p-6 my-4" style={{ maxWidth: 640, margin: '40px auto' }}>
          <div className="text-amber font-semibold text-base mb-2">
            Notice: Error loading {this.props.tabName || 'Section'}
          </div>
          <p className="text-xs text-muted mb-4 font-mono">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div className="flex justify-center gap-3">
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry View
            </button>
            <button 
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onResetTab) this.props.onResetTab();
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(getAuthSession);
  const [activeTab, setActiveTab] = useState(getAuthSession()?.role === USER_ROLES.PARENT ? 'parent-portal' : 'dashboard');
  const [data, setData] = useState(getStoredData);
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [attendanceViewMode, setAttendanceViewMode] = useState('all-absentees');
  const [selectedAttendanceBatchId, setSelectedAttendanceBatchId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);


  // Shared Modals
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [feeCollectModalOpen, setFeeCollectModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Supabase connection state
  const [isSupabaseLive, setIsSupabaseLive] = useState(getSupabaseConfig().isConnected);

  // Sync data whenever changed locally or by custom event
  useEffect(() => {
    const handleDbUpdate = (e) => {
      setData(e.detail || getStoredData());
    };

    const handleConfigChange = (e) => {
      setIsSupabaseLive(e.detail?.isConnected || false);
    };

    const handleAuthChange = (e) => {
      setCurrentUser(e.detail || getAuthSession());
    };

    const handleStaffChange = () => {
      const session = getAuthSession();
      if (session && session.role === USER_ROLES.TEACHER) {
        const accounts = getStaffAccounts();
        const freshTeacher = (accounts.teachers || []).find(
          t => t.id === session.id || t.username?.toLowerCase() === session.username?.toLowerCase()
        );
        if (freshTeacher) {
          const updatedUser = {
            ...session,
            id: freshTeacher.id,
            name: freshTeacher.name,
            title: freshTeacher.title || session.title,
            subject: freshTeacher.subject || session.subject,
            email: freshTeacher.email || session.email,
            phone: freshTeacher.phone || session.phone,
            assignedBatchIds: freshTeacher.assignedBatchIds || [],
            assignedStudentIds: freshTeacher.assignedStudentIds || []
          };
          setCurrentUser(updatedUser);
          setAuthSession(updatedUser);
        } else {
          // The teacher account was deleted by Admin! Invalidate immediately
          clearAuthSession();
          setCurrentUser(null);
        }
      } else if (session && session.role === USER_ROLES.ADMIN) {
        const accounts = getStaffAccounts();
        if (accounts.admin) {
          const updatedAdmin = {
            ...session,
            name: accounts.admin.name || session.name,
            title: accounts.admin.title || session.title,
            email: accounts.admin.email || session.email
          };
          setCurrentUser(updatedAdmin);
        }
      } else {
        setCurrentUser(getAuthSession());
      }
    };

    // Cross-tab synchronization listener (fires in all OTHER tabs when localStorage updates)
    const handleStorageEvent = (e) => {
      if (e.key === 'hayagriva_staff_accounts_v1' || e.key === 'hayagriva_auth_session_v1') {
        const latestSession = getAuthSession();
        setCurrentUser(latestSession);
        handleStaffChange();
      }
      if (e.key === 'vidyatrack_tuition_data_v1') {
        setData(getStoredData());
      }
    };

    window.addEventListener('tuition-db-updated', handleDbUpdate);
    window.addEventListener('tuition-supabase-config-changed', handleConfigChange);
    window.addEventListener('hayagriva-auth-changed', handleAuthChange);
    window.addEventListener('hayagriva-staff-accounts-changed', handleStaffChange);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('tuition-db-updated', handleDbUpdate);
      window.removeEventListener('tuition-supabase-config-changed', handleConfigChange);
      window.removeEventListener('hayagriva-auth-changed', handleAuthChange);
      window.removeEventListener('hayagriva-staff-accounts-changed', handleStaffChange);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Fetch remote database records from Supabase on mount / connection change
  useEffect(() => {
    let isMounted = true;

    const loadFromSupabase = async () => {
      const config = getSupabaseConfig();
      if (!config.isConnected) return;

      setIsSyncing(true);
      try {
        const [remote, remoteStaff] = await Promise.all([
          fetchTuitionDataFromSupabase(),
          fetchStaffAccountsFromSupabase()
        ]);
        if (isMounted) {
          if (remoteStaff) {
            handleStaffChange();
          }
          if (remote) {
            if (remote.hasData) {
              setData(remote);
              saveStoredData(remote);
            } else {
              console.log('Connected to Supabase PostgreSQL. Tables are ready.');
            }
          }
        }
      } catch (err) {
        console.warn('Supabase initial fetch warning:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    loadFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [isSupabaseLive]);

  // Supabase Real-Time Subscriptions Listener (cross-tab & multi-device sync)
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('tuition-live-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, async () => {
        const refreshed = await fetchTuitionDataFromSupabase();
        if (refreshed) {
          setData(refreshed);
          saveStoredData(refreshed);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, async () => {
        const refreshed = await fetchTuitionDataFromSupabase();
        if (refreshed) {
          setData(refreshed);
          saveStoredData(refreshed);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, async () => {
        const refreshed = await fetchTuitionDataFromSupabase();
        if (refreshed) {
          setData(refreshed);
          saveStoredData(refreshed);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_records' }, async () => {
        const refreshed = await fetchTuitionDataFromSupabase();
        if (refreshed) {
          setData(refreshed);
          saveStoredData(refreshed);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, async () => {
        const refreshed = await fetchTuitionDataFromSupabase();
        if (refreshed) {
          setData(refreshed);
          saveStoredData(refreshed);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_accounts' }, async () => {
        const refreshedStaff = await fetchStaffAccountsFromSupabase();
        if (refreshedStaff) {
          handleStaffChange();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupabaseLive]);

  const handleSaveData = async (updatedData) => {
    setData(updatedData);
    saveStoredData(updatedData);

    const config = getSupabaseConfig();
    if (config.isConnected) {
      setIsSyncing(true);
      try {
        await syncTuitionDataToSupabase(updatedData);
      } catch (err) {
        console.error('Failed to sync to Supabase:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  if (!currentUser) {
    return (
      <LoginModal 
        students={data.students}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === USER_ROLES.PARENT) {
            setActiveTab('parent-portal');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSettings={() => setSettingsModalOpen(true)}
        isSupabaseLive={isSupabaseLive}
        isSyncing={isSyncing}
        currentUser={currentUser}
        onLogout={() => {
          clearAuthSession();
          setCurrentUser(null);
        }}
      />

      {/* Main Content View based on Active Tab & User Role */}
      <main className="main-content">
        {/* Parent Portal View */}
        {currentUser.role === USER_ROLES.PARENT ? (
          <ParentPortal 
            currentUser={currentUser} 
            data={data} 
            onLogout={() => {
              clearAuthSession();
              setCurrentUser(null);
            }} 
          />
        ) : (

          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                data={data} 
                currentUser={currentUser}
                onSaveData={handleSaveData}
                setActiveTab={setActiveTab}
                setSelectedClassFilter={setSelectedClassFilter}
                setAttendanceViewMode={setAttendanceViewMode}
                onOpenAdmitModal={() => currentUser?.role === USER_ROLES.ADMIN && setAdmitModalOpen(true)}
                onOpenFeeCollectModal={() => currentUser?.role === USER_ROLES.ADMIN && setFeeCollectModalOpen(true)}
              />
            )}

            {activeTab === 'students' && currentUser?.role === USER_ROLES.ADMIN && (
              <Students 
                data={data}
                onSaveData={handleSaveData}
                selectedClassFilter={selectedClassFilter}
                setSelectedClassFilter={setSelectedClassFilter}
                admitModalOpen={admitModalOpen}
                setAdmitModalOpen={setAdmitModalOpen}
              />
            )}

            {activeTab === 'batches' && (
              <Batches 
                data={data}
                currentUser={currentUser}
                onSaveData={handleSaveData}
                setActiveTab={setActiveTab}
                setSelectedClassFilter={setSelectedClassFilter}
                onSelectBatchForAttendance={(batchId) => {
                  setSelectedAttendanceBatchId(batchId);
                  setAttendanceViewMode('batch');
                }}
              />
            )}

            {activeTab === 'attendance' && (
              <Attendance 
                data={data} 
                currentUser={currentUser}
                onSaveData={handleSaveData}
                viewMode={attendanceViewMode}
                onViewModeChange={setAttendanceViewMode}
                selectedBatchId={selectedAttendanceBatchId}
                onSelectedBatchChange={setSelectedAttendanceBatchId}
              />
            )}

            {activeTab === 'fees' && currentUser?.role === USER_ROLES.ADMIN && (
              <Fees 
                data={data}
                onSaveData={handleSaveData}
                feeCollectModalOpen={feeCollectModalOpen}
                setFeeCollectModalOpen={setFeeCollectModalOpen}
              />
            )}

            {activeTab === 'exams' && (
              <Exams 
                data={data}
                currentUser={currentUser}
                onSaveData={handleSaveData}
              />
            )}

            {activeTab === 'notifications' && (
              <TabErrorBoundary tabName="Broadcast & Notices" tabKey="notifications" onResetTab={() => setActiveTab('dashboard')}>
                <BroadcastNotifications 
                  data={data}
                  currentUser={currentUser}
                  onSaveData={handleSaveData}
                />
              </TabErrorBoundary>
            )}
          </>
        )}
      </main>

      {/* Settings Modal (Admin Only) */}
      {currentUser.role === USER_ROLES.ADMIN && (
        <SettingsModal 
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          onDataReset={(newData) => setData(newData)}
          batches={data.batches || []}
          students={data.students || []}
          onSaveData={handleSaveData}
        />
      )}


      {/* Footer */}
      <footer className="tuition-footer">
        <div className="footer-inner">
          <div>
            <strong>HAYAGRIVA TUTORIALS</strong> — School Tuition & Coaching Management System
            <span className="text-muted ml-2">| Classes 1 to 10 Specialized</span>
          </div>
          <div className="footer-links">
            <span className="footer-tag">100% Free Hosting Ready</span>
            <span className="footer-tag">Supabase Real-Time</span>
            <span className="footer-tag">Offline Capable</span>
          </div>
        </div>
      </footer>

      <style>{`
        .tuition-footer {
          border-top: 1px solid var(--border-subtle);
          background: rgba(11, 15, 25, 0.95);
          padding: 16px 20px;
          margin-top: auto;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .footer-inner {
          max-width: 1360px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-links {
          display: flex;
          gap: 8px;
        }
        .footer-tag {
          font-size: 0.725rem;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
        }
        .ml-2 { margin-left: 8px; }
      `}</style>
    </div>
  );
}
