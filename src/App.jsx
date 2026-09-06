import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Batches from './components/Batches';
import Attendance from './components/Attendance';
import Fees from './components/Fees';
import Exams from './components/Exams';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import ParentPortal from './components/ParentPortal';
import { getStoredData, saveStoredData, getSupabaseConfig, getEmptyTuitionData } from './lib/storage';
import { getSupabaseClient, fetchTuitionDataFromSupabase, syncTuitionDataToSupabase } from './lib/supabase';
import { getAuthSession, clearAuthSession, USER_ROLES } from './lib/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getAuthSession);
  const [activeTab, setActiveTab] = useState(getAuthSession()?.role === USER_ROLES.PARENT ? 'parent-portal' : 'dashboard');
  const [data, setData] = useState(getStoredData);
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
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

    window.addEventListener('tuition-db-updated', handleDbUpdate);
    window.addEventListener('tuition-supabase-config-changed', handleConfigChange);

    return () => {
      window.removeEventListener('tuition-db-updated', handleDbUpdate);
      window.removeEventListener('tuition-supabase-config-changed', handleConfigChange);
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
        const remote = await fetchTuitionDataFromSupabase();
        if (isMounted && remote) {
          if (remote.hasData) {
            setData(remote);
            saveStoredData(remote);
          } else {
            console.log('Connected to Supabase PostgreSQL. Tables are ready.');
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
                setActiveTab={setActiveTab}
                setSelectedClassFilter={setSelectedClassFilter}
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
                onSaveData={handleSaveData}
                setActiveTab={setActiveTab}
                setSelectedClassFilter={setSelectedClassFilter}
              />
            )}

            {activeTab === 'attendance' && (
              <Attendance 
                data={data}
                onSaveData={handleSaveData}
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
                onSaveData={handleSaveData}
              />
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
