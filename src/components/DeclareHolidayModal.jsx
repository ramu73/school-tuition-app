import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Check,
  Copy,
  Share2,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Send,
  ExternalLink
} from 'lucide-react';
import { generateNextId } from '../lib/storage';

export default function DeclareHolidayModal({
  isOpen,
  onClose,
  initialDate,
  initialReason = '',
  students = [],
  attendance = [],
  announcements = [],
  currentUser,
  onSaveData,
  onHolidayDeclared
}) {
  if (!isOpen) return null;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [targetDate, setTargetDate] = useState(initialDate || todayStr);
  const [reason, setReason] = useState(initialReason);
  const [alsoAnnounce, setAlsoAnnounce] = useState(true);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isSuccessView, setIsSuccessView] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Check if target date is already a declared holiday
  const existingHolidayRec = useMemo(() => {
    return (attendance || []).find(a => a.date === targetDate && (a.status === 'HOLIDAY' || a.status === 'NO_CLASS'));
  }, [attendance, targetDate]);

  const isAlreadyHoliday = Boolean(existingHolidayRec);
  const activeExistingReason = existingHolidayRec?.remarks || '';

  // Formatted date string for user-facing prompts
  const formattedDate = useMemo(() => {
    try {
      const parts = targetDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      return targetDate;
    } catch {
      return targetDate;
    }
  }, [targetDate]);

  // Quick Preset Categories
  const PRESET_GROUPS = [
    {
      label: '👨‍🏫 Teacher & Faculty Leave',
      highlight: true,
      items: [
        'Teacher Unavailable (Personal Reason)',
        'Faculty Emergency Leave',
        'Teacher Medical / Sick Leave',
        'Staff Meeting / Training'
      ]
    },
    {
      label: '🌧️ Weather & Local Conditions',
      highlight: false,
      items: [
        'Heavy Rain / Monsoon Holiday',
        'Power Cut / Maintenance Work',
        'Local Government / City Holiday'
      ]
    },
    {
      label: '🎉 Festivals & Academic Breaks',
      highlight: false,
      items: [
        'Exam Preparation Break',
        'Diwali Holiday',
        'Sankranti / Pongal Vacation',
        'Dussehra / Navratri',
        'General Tuition Holiday'
      ]
    }
  ];

  // WhatsApp Notice Text Generator
  const generateWhatsAppNotice = (dateFormatted, reasonText) => {
    return `📢 *HAYAGRIVA TUTORIALS — TUITION NOTICE*\n\nDear Parents,\n\nPlease note that tuition classes will remain *CLOSED on ${dateFormatted}* due to *${reasonText}*.\n\nRegular batches will resume as scheduled the next working day. Students are requested to complete their revision homework.\n\nThank you,\n*Hayagriva Tutorials, Srinagar Colony*\n📞 Contact: 9848266892\n🌐 https://hayagrivatutorials.com`;
  };

  const handleConfirmHoliday = () => {
    const holidayTitle = (reason || 'Tuition Holiday').trim();
    if (!holidayTitle) {
      alert('Please select or enter a reason for the holiday.');
      return;
    }

    // 1. Remove previous records for this date
    let updatedAttendance = (attendance || []).filter(a => a.date !== targetDate);
    const activeStudentsList = (students || []).filter(s => (s.status || 'ACTIVE') === 'ACTIVE');

    if (activeStudentsList.length === 0) {
      updatedAttendance.push({
        id: generateNextId(updatedAttendance),
        studentId: 'CENTER_WIDE',
        date: targetDate,
        status: 'HOLIDAY',
        remarks: holidayTitle
      });
    } else {
      activeStudentsList.forEach(st => {
        updatedAttendance.push({
          id: generateNextId(updatedAttendance),
          studentId: st.id,
          batchId: st.batchId,
          classCode: st.classCode,
          date: targetDate,
          status: 'HOLIDAY',
          remarks: holidayTitle
        });
      });
    }

    // 2. Add announcement to Parent Portal if checked
    let updatedAnnouncements = Array.isArray(announcements) ? [...announcements] : [];
    if (alsoAnnounce) {
      // Remove previous duplicate announcement for this date if exists
      updatedAnnouncements = updatedAnnouncements.filter(a => !(a.date === targetDate && a.title?.includes('Tuition Closed')));

      const newAnn = {
        id: generateNextId(updatedAnnouncements),
        title: `Tuition Closed: ${holidayTitle}`,
        message: `Please note that tuition classes are closed on ${formattedDate} on account of "${holidayTitle}". Regular batches will resume as scheduled the following working day.`,
        targetType: 'ALL',
        targetId: null,
        targetName: 'All Enrolled Students (Classes 1–10)',
        postedBy: currentUser?.name || 'Hayagriva Tutorials Administration',
        date: targetDate,
        createdAt: new Date().toISOString()
      };
      updatedAnnouncements.unshift(newAnn);
    }

    if (typeof onSaveData === 'function') {
      onSaveData({
        attendance: updatedAttendance,
        announcements: updatedAnnouncements
      });
    }

    if (typeof onHolidayDeclared === 'function') {
      onHolidayDeclared(targetDate, holidayTitle);
    }

    // Transition to success & WhatsApp share screen
    setSuccessData({
      date: targetDate,
      formattedDate,
      reason: holidayTitle,
      whatsAppText: generateWhatsAppNotice(formattedDate, holidayTitle),
      studentCount: activeStudentsList.length
    });
    setIsSuccessView(true);
  };

  const handleRevertHoliday = () => {
    if (window.confirm(`Revert ${formattedDate} back to normal working day? Regular classes will resume and attendance roll call will be active.`)) {
      const remainingAttendance = (attendance || []).filter(a => !(a.date === targetDate && (a.status === 'HOLIDAY' || a.status === 'NO_CLASS')));
      const remainingAnnouncements = (announcements || []).filter(a => !(a.date === targetDate && a.title?.includes('Tuition Closed')));

      if (typeof onSaveData === 'function') {
        onSaveData({
          attendance: remainingAttendance,
          announcements: remainingAnnouncements
        });
      }

      onClose();
    }
  };

  const handleCopyNotice = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content glass-card declare-holiday-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span style={{ fontSize: '1.4rem' }}>🌴</span>
            <div>
              <h3 className="modal-title text-base font-bold text-white mb-0">
                {isSuccessView ? 'Holiday Declared & Ready!' : 'Declare Tuition Holiday / Leave'}
              </h3>
              <p className="text-xs text-slate-400 mb-0">
                {isSuccessView
                  ? 'All students protected • Share WhatsApp notice with parents'
                  : 'Classes closed • Students not penalized • Site updates like Sunday'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn text-muted hover:text-white"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* View 1: Main Holiday Declaration Form */}
        {!isSuccessView ? (
          <div className="modal-body py-4 space-y-4">
            {/* If Already A Declared Holiday Alert */}
            {isAlreadyHoliday && (
              <div
                className="p-3 rounded-lg flex items-start justify-between gap-3"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#FEF3C7'
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-amber mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <strong className="text-white block font-semibold">
                      {formattedDate} is currently marked as a Holiday:
                    </strong>
                    <span className="text-amber-200 font-medium">"{activeExistingReason}"</span>
                    <p className="text-slate-300 mt-1 mb-0">
                      You can change the reason below or revert it back to a normal working class day.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-xs btn-warning flex items-center gap-1 flex-shrink-0"
                  onClick={handleRevertHoliday}
                  title="Revert back to regular class day"
                  style={{ fontSize: '0.75rem', padding: '5px 9px' }}
                >
                  <RotateCcw size={12} />
                  <span>Revert to Working Day</span>
                </button>
              </div>
            )}

            {/* Date Selection with Quick Shortcuts */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-white mb-1.5 flex items-center justify-between">
                <span>Select Holiday Date</span>
                <span className="text-xs text-amber-400 font-bold">{formattedDate}</span>
              </label>

              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-xs ${targetDate === todayStr ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetDate(todayStr)}
                  style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  ⚡ Today
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${targetDate === tomorrowStr ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetDate(tomorrowStr)}
                  style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  Tomorrow
                </button>
                <div className="relative flex-1">
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>

            {/* 1-Tap Quick Presets */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                <span>Quick Presets (1-Tap Selection)</span>
                <Sparkles size={13} className="text-amber-400" />
              </label>

              <div className="space-y-2 mt-1">
                {PRESET_GROUPS.map((grp, idx) => (
                  <div key={idx} className="preset-group">
                    <div
                      className="text-2xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: grp.highlight ? '#FBBF24' : '#94A3B8' }}
                    >
                      {grp.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {grp.items.map(preset => {
                        const isSelected = reason === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setReason(preset)}
                            style={{
                              fontSize: '0.73rem',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              background: isSelected
                                ? '#3B82F6'
                                : grp.highlight
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : 'rgba(51, 65, 85, 0.6)',
                              borderColor: isSelected
                                ? '#60A5FA'
                                : grp.highlight
                                  ? 'rgba(245, 158, 11, 0.35)'
                                  : 'rgba(71, 85, 105, 0.5)',
                              color: isSelected
                                ? '#FFFFFF'
                                : grp.highlight
                                  ? '#FDE68A'
                                  : '#E2E8F0'
                            }}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reason Input Box */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-white mb-1">
                Holiday Reason / Title (shown to parents &amp; on website)
              </label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="e.g. Teacher Unavailable (Personal Reason), Heavy Rain, Pongal Vacation"
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Notice Broadcast Checkbox */}
            <div
              className="p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer"
              style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(71, 85, 105, 0.4)' }}
              onClick={() => setAlsoAnnounce(!alsoAnnounce)}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📢</span>
                <div>
                  <div className="text-xs font-semibold text-white">
                    Post notice to Parent Portal &amp; generate WhatsApp notice
                  </div>
                  <div className="text-2xs text-slate-400">
                    Parents will see "Tuition Closed: {reason || 'Holiday'}" in the Parent Portal
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={alsoAnnounce}
                onChange={e => setAlsoAnnounce(e.target.checked)}
                className="checkbox"
                style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
              />
            </div>

            {/* How It Updates The Site (Reassurance) */}
            <div
              className="p-2.5 rounded-lg text-2xs space-y-1"
              style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#A7F3D0' }}
            >
              <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Check size={13} />
                <span>What happens when you confirm (Exact same behavior as Sundays):</span>
              </div>
              <div className="text-slate-300">
                • <strong>Dashboard:</strong> Shows <code>🌴 Holiday</code> &amp; "Tuition Closed Today" instead of absentees.
              </div>
              <div className="text-slate-300">
                • <strong>Attendance:</strong> Zero absentees recorded. Student attendance percentages are 100% protected.
              </div>
              <div className="text-slate-300">
                • <strong>Public Website:</strong> Top alert banner displays the holiday notice so visiting parents know immediately.
              </div>
            </div>
          </div>
        ) : (
          /* View 2: Success Screen with 1-Click WhatsApp Broadcast */
          <div className="modal-body py-4 space-y-4">
            <div
              className="p-4 rounded-xl text-center space-y-2"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)'
              }}
            >
              <div className="inline-flex p-2 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.25)' }}>
                <Check size={28} className="text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-0">
                Holiday Declared for {successData?.formattedDate}!
              </h4>
              <p className="text-xs text-emerald-200 mb-0">
                Reason: <strong>"{successData?.reason}"</strong>
              </p>
              <p className="text-2xs text-slate-300 mb-0">
                Protected {successData?.studentCount} students across Classes 1–10. No penalties or absences recorded.
              </p>
            </div>

            {/* WhatsApp Message Ready Card */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white flex items-center justify-between">
                <span>📱 WhatsApp Parent Broadcast Message</span>
                <span className="text-2xs text-slate-400">Ready to send to parent groups</span>
              </label>

              <div
                className="p-3 rounded-lg text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-all"
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  maxHeight: '140px',
                  overflowY: 'auto'
                }}
              >
                {successData?.whatsAppText}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  className={`btn btn-sm ${copiedNotice ? 'btn-success' : 'btn-secondary'} flex-1 flex items-center justify-center gap-1.5`}
                  onClick={() => handleCopyNotice(successData?.whatsAppText)}
                >
                  {copiedNotice ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedNotice ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(successData?.whatsAppText || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary flex-1 flex items-center justify-center gap-1.5"
                  style={{ background: '#25D366', borderColor: '#25D366', color: '#FFFFFF' }}
                >
                  <Share2 size={14} />
                  <span>Open WhatsApp</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="modal-footer flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          {!isSuccessView ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
              >
                Cancel
              </button>

              {isAlreadyHoliday && (
                <button
                  type="button"
                  className="btn btn-warning btn-sm flex items-center gap-1"
                  onClick={handleRevertHoliday}
                >
                  <RotateCcw size={13} />
                  <span>Revert to Working Day</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={handleConfirmHoliday}
                style={{ background: '#F59E0B', borderColor: '#D97706', color: '#1E293B', fontWeight: 700 }}
              >
                <span>🌴</span>
                <span>{isAlreadyHoliday ? 'Update Holiday Reason' : 'Confirm & Declare Holiday'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              Done &amp; Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

