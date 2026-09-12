import React, { useState } from 'react';
import { 
  Megaphone, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Sparkles, 
  Users, 
  Filter, 
  Globe, 
  Bell, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  UserCheck,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { generateNextId } from '../lib/storage';
import { USER_ROLES } from '../lib/auth';

export default function BroadcastNotifications({ data = {}, currentUser, onSaveData }) {
  const safeData = data || {};
  const students = Array.isArray(safeData.students) ? safeData.students : [];
  const batches = Array.isArray(safeData.batches) ? safeData.batches : [];
  const classes = Array.isArray(safeData.classes) ? safeData.classes : [];
  const announcements = Array.isArray(safeData.announcements) ? safeData.announcements : [];

  const isTeacher = currentUser?.role === USER_ROLES.TEACHER;
  const assignedBatchIds = Array.isArray(currentUser?.assignedBatchIds) 
    ? currentUser.assignedBatchIds.map(String) 
    : [];
  const assignedStudentIds = Array.isArray(currentUser?.assignedStudentIds)
    ? currentUser.assignedStudentIds.map(String)
    : [];

  const accessibleBatches = isTeacher 
    ? batches.filter(b => {
        const inBatch = assignedBatchIds.includes(String(b.id));
        const hasAssignedStudent = assignedStudentIds.length > 0 && 
          students.some(s => assignedStudentIds.includes(String(s.id)) && String(s.batchId) === String(b.id));
        return inBatch || hasAssignedStudent;
      })
    : batches;

  const accessibleStudents = isTeacher 
    ? students.filter(s => {
        const inBatch = s.batchId && assignedBatchIds.includes(String(s.batchId));
        const directStudent = assignedStudentIds.includes(String(s.id));
        return inBatch || directStudent;
      })
    : students;

  // Active students: include all unless explicitly marked INACTIVE
  const activeStudents = accessibleStudents.filter(s => {
    if (!s) return false;
    const st = String(s.status || '').toUpperCase();
    return st !== 'INACTIVE' && st !== 'DISABLED';
  });

  // Filter State: 'ALL' | 'BATCH' | 'CLASS' | 'STUDENTS'
  const [targetType, setTargetType] = useState('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState(
    accessibleBatches[0]?.id ? String(accessibleBatches[0].id) : (batches[0]?.id ? String(batches[0].id) : '1')
  );
  const [selectedClassCode, setSelectedClassCode] = useState(classes[0]?.code || 'CLASS_10');
  const [selectedStudentIds, setSelectedStudentIds] = useState(() => activeStudents.slice(0, 4).map(s => s.id));
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentBatchFilter, setStudentBatchFilter] = useState('ALL');

  // Message Form State
  const [title, setTitle] = useState('Special Sunday Tuition Class');
  const [message, setMessage] = useState(
`📢 *HAYAGRIVA TUTORIALS — SPECIAL SUNDAY CLASS*

Dear Sir/Mam,

Please note that there will be a *Special Sunday Revision Class* for *{batch_name}* on *Sunday* from *09:00 AM to 12:00 PM* for Mathematics & Science revision.

Attendance is mandatory for all students. Kindly ensure {student_name} attends on time.

📍 Hayagriva Tutorials, Srinagar Colony
📞 9848266892`
  );
  const [postToParentPortal, setPostToParentPortal] = useState(true);

  // Sent Tracker (stores student IDs where WhatsApp was opened)
  const [sentStudentIds, setSentStudentIds] = useState(new Set());
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick Preset Templates
  const TEMPLATES = [
    {
      id: 'sunday',
      name: '🌟 Sunday Tuition Class',
      title: 'Special Sunday Tuition Class',
      body: `📢 *HAYAGRIVA TUTORIALS — SPECIAL SUNDAY CLASS*\n\nDear Sir/Mam,\n\nPlease note that there will be a *Special Sunday Revision Class* for *{batch_name}* on *Sunday* from *09:00 AM to 12:00 PM* for Mathematics & Science revision.\n\nAttendance is mandatory for all students. Kindly ensure {student_name} attends on time.\n\n📍 Hayagriva Tutorials, Srinagar Colony\n📞 9848266892`
    },
    {
      id: 'timing',
      name: '⏰ Timing Change Notice',
      title: 'Tuition Timings Revision',
      body: `📢 *HAYAGRIVA TUTORIALS — TIMING REVISION NOTICE*\n\nDear Sir/Mam,\n\nKindly note that starting from this week, the tuition timings for *{batch_name}* have been revised to:\n🕒 *New Timings: 05:30 PM - 07:30 PM*\n\nPlease ensure {student_name} arrives 5 minutes before class starts.\n\nThank you,\nHayagriva Tutorials`
    },
    {
      id: 'holiday',
      name: '🏖️ Holiday / Closed Notice',
      title: 'Tuition Holiday Notice',
      body: `📢 *HAYAGRIVA TUTORIALS — HOLIDAY NOTICE*\n\nDear Sir/Mam,\n\nPlease note that tuition classes will remain *closed on [Date]* on account of [Festival / Occasion]. Classes will resume as normal from [Next Working Date].\n\nWarm regards,\nHayagriva Tutorials`
    },
    {
      id: 'test',
      name: '📝 Test & Exam Schedule',
      title: 'Upcoming Slip Test / Exam Notice',
      body: `📢 *HAYAGRIVA TUTORIALS — TEST SCHEDULE*\n\nDear Sir/Mam,\n\nA unit test for *{class_name}* is scheduled on *[Date]* for *[Subject]*.\n\nPlease ensure {student_name} prepares thoroughly. Scorecards will be published in the Parent Portal.\n\nHayagriva Tutorials`
    },
    {
      id: 'custom',
      name: '💬 Custom Message',
      title: 'Important Tuition Announcement',
      body: `📢 *HAYAGRIVA TUTORIALS — ANNOUNCEMENT*\n\nDear Sir/Mam,\n\n[Write your custom message here for {student_name}]\n\nThank you,\nHayagriva Tutorials`
    }
  ];

  const applyTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setMessage(tmpl.body);
  };

  // Filtered Students for the interactive Student Picker
  const filteredStudentsForPicker = activeStudents.filter(s => {
    if (studentClassFilter !== 'ALL' && s.classCode !== studentClassFilter) return false;
    if (studentBatchFilter !== 'ALL' && String(s.batchId) !== String(studentBatchFilter)) return false;
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchRoll = s.admissionNo && s.admissionNo.toLowerCase().includes(q);
      const matchSchool = s.school && s.school.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchSchool) return false;
    }
    return true;
  });

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds(prev => {
      const exists = prev.some(id => String(id) === String(studentId));
      return exists ? prev.filter(id => String(id) !== String(studentId)) : [...prev, studentId];
    });
  };

  // Filter Target Recipients
  const targetRecipients = activeStudents.filter(student => {
    if (targetType === 'ALL') return true;
    if (targetType === 'BATCH') return String(student.batchId) === String(selectedBatchId);
    if (targetType === 'CLASS') return student.classCode === selectedClassCode;
    if (targetType === 'STUDENTS') return selectedStudentIds.some(id => String(id) === String(student.id));
    return true;
  });

  // Target Description
  const getTargetDescription = () => {
    if (targetType === 'ALL') return isTeacher ? 'All Assigned Batches' : 'All Students & Batches';
    if (targetType === 'BATCH') {
      const b = batches.find(item => String(item.id) === String(selectedBatchId));
      return b ? b.name : 'Selected Batch';
    }
    if (targetType === 'CLASS') {
      const c = classes.find(item => item.code === selectedClassCode);
      return c ? c.name : selectedClassCode;
    }
    if (targetType === 'STUDENTS') {
      return `${selectedStudentIds.length} Selected Students`;
    }
    return 'Custom Group';
  };

  // Replace variable placeholders for a specific student
  const formatMessageForStudent = (rawTemplate, student) => {
    if (!student) student = { name: 'Student' };
    const studentBatch = batches.find(b => Number(b.id) === Number(student?.batchId));
    const studentClass = classes.find(c => c.code === student?.classCode);

    return String(rawTemplate || '')
      .replace(/{student_name}/g, student?.name || 'Student')
      .replace(/{parent_name}/g, student?.parentName || 'Parent / Guardian')
      .replace(/{batch_name}/g, studentBatch?.name || 'Tuition Batch')
      .replace(/{class_name}/g, studentClass?.name || 'Class');
  };

  // Build WhatsApp URL
  const getWhatsAppUrlForStudent = (student) => {
    const cleanPhone = String(student?.parentPhone || '').replace(/\D/g, '');
    const personalized = formatMessageForStudent(message, student);
    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(personalized)}`;
  };

  // Mark sent when clicked
  const handleOpenWhatsApp = (student) => {
    if (!student) return;
    const url = getWhatsAppUrlForStudent(student);
    window.open(url, '_blank');
    setSentStudentIds(prev => new Set([...prev, student.id]));
  };

  // Copy All Phone Numbers
  const handleCopyPhoneNumbers = () => {
    const numbers = targetRecipients
      .map(s => String(s?.parentPhone || '').replace(/\D/g, ''))
      .filter(Boolean)
      .join(', ');

    if (!numbers) return;
    navigator.clipboard.writeText(numbers).then(() => {
      setCopiedNumbers(true);
      setTimeout(() => setCopiedNumbers(false), 2200);
    });
  };

  // Copy Formatted Message
  const handleCopyFormattedMessage = () => {
    const sampleText = formatMessageForStudent(message, targetRecipients[0] || { name: 'Student' });
    navigator.clipboard.writeText(sampleText).then(() => {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2200);
    });
  };

  // Save / Publish to In-App Parent Portal
  const handleSaveAndPublish = () => {
    if (!title.trim() || !message.trim()) {
      alert('Please enter both title and announcement message.');
      return;
    }

    const currentAnnouncements = Array.isArray(announcements) ? announcements : [];
    const newAnnouncement = {
      id: generateNextId(currentAnnouncements),
      title: title.trim(),
      message: message.trim(),
      targetType,
      targetId: targetType === 'BATCH' ? selectedBatchId : targetType === 'CLASS' ? selectedClassCode : (targetType === 'STUDENTS' ? selectedStudentIds : null),
      targetName: getTargetDescription(),
      postedBy: currentUser?.name || (isTeacher ? 'Faculty' : 'Admin (Director)'),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    if (typeof onSaveData === 'function') {
      onSaveData({
        ...safeData,
        announcements: [newAnnouncement, ...currentAnnouncements]
      });
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Delete an existing announcement
  const handleDeleteAnnouncement = (id) => {
    if (window.confirm('Delete this announcement notice?')) {
      const currentAnnouncements = Array.isArray(announcements) ? announcements : [];
      const filtered = currentAnnouncements.filter(a => a.id !== id);
      if (typeof onSaveData === 'function') {
        onSaveData({ ...safeData, announcements: filtered });
      }
    }
  };

  // Open next unsent student WhatsApp
  const handleOpenNextUnsent = () => {
    const unsent = targetRecipients.find(s => !sentStudentIds.has(s.id));
    if (unsent) {
      handleOpenWhatsApp(unsent);
    } else {
      alert('All target parents have already been messaged! ✓');
    }
  };

  return (
    <div className="broadcast-page">
      {/* Page Header */}
      <div className="broadcast-header-card glass-card">
        <div className="header-meta-left">
          <div className="flex items-center gap-2">
            <div className="header-icon-wrap bg-amber-subtle">
              <Megaphone size={22} className="text-amber" />
            </div>
            <div>
              <h1 className="page-title">Broadcast & Student Notifications</h1>
              <p className="page-subtitle">
                Dispatch timing updates, Sunday class alerts, holiday notices, and custom announcements to parents via WhatsApp & the Parent Portal
              </p>
            </div>
          </div>
        </div>

        <div className="header-stats-right">
          <div className="recipient-counter-pill">
            <Users size={16} className="text-primary" />
            <span>Target: <strong>{targetRecipients.length}</strong> Parents / Students</span>
          </div>
        </div>
      </div>

      {isTeacher && (
        <div className="teacher-scope-banner glass-card mb-4" style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center gap-2 text-xs">
            <Users size={15} className="text-emerald" />
            <span className="font-semibold text-white">Faculty Access:</span>
            <span className="text-slate-300">
              You are authorized to broadcast notices to students in your {accessibleBatches.length} assigned batches.
            </span>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="connection-alert alert-success mb-4 animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Announcement published successfully! It is now visible on the Student & Parent Portal.</span>
          </div>
        </div>
      )}

      {/* Main Grid: Composer (Left) + Audience & Dispatch (Right) */}
      <div className="broadcast-layout-grid">
        {/* LEFT COLUMN: Message Composer & Presets */}
        <div className="composer-column flex flex-col gap-4">
          {/* Target Audience Card */}
          <div className="glass-card audience-selector-card">
            <div className="section-title-sm mb-3 flex items-center gap-2">
              <Filter size={16} className="text-primary" />
              <span>1. Choose Target Audience</span>
            </div>

            <div className="audience-type-tabs">
              <button
                type="button"
                className={`audience-tab-btn ${targetType === 'ALL' ? 'active' : ''}`}
                onClick={() => setTargetType('ALL')}
              >
                <Globe size={14} />
                <span>All Enrolled ({activeStudents.length})</span>
              </button>

              <button
                type="button"
                className={`audience-tab-btn ${targetType === 'BATCH' ? 'active' : ''}`}
                onClick={() => setTargetType('BATCH')}
              >
                <Clock size={14} />
                <span>By Batch</span>
              </button>

              <button
                type="button"
                className={`audience-tab-btn ${targetType === 'CLASS' ? 'active' : ''}`}
                onClick={() => setTargetType('CLASS')}
              >
                <Users size={14} />
                <span>By Class</span>
              </button>

              <button
                type="button"
                className={`audience-tab-btn ${targetType === 'STUDENTS' ? 'active' : ''}`}
                onClick={() => setTargetType('STUDENTS')}
              >
                <UserCheck size={14} />
                <span>By Student Names ({selectedStudentIds.length})</span>
              </button>
            </div>

            {/* Sub-selector for Batch */}
            {targetType === 'BATCH' && (
              <div className="mt-3 pt-3 border-top-subtle">
                <label className="form-label text-xs">Select Tuition Batch Slot:</label>
                <select 
                  className="form-select"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  {accessibleBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.timing}) — {activeStudents.filter(s => Number(s.batchId) === Number(b.id)).length} students
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-selector for Class */}
            {targetType === 'CLASS' && (
              <div className="mt-3 pt-3 border-top-subtle">
                <label className="form-label text-xs">Select Standard / Class:</label>
                <select 
                  className="form-select"
                  value={selectedClassCode}
                  onChange={(e) => setSelectedClassCode(e.target.value)}
                >
                  {classes.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({activeStudents.filter(s => s.classCode === c.code).length} students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-selector for Individual Students by Name */}
            {targetType === 'STUDENTS' && (
              <div className="mt-3 pt-3 border-top-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white">
                    Select Students by Name ({selectedStudentIds.length} of {activeStudents.length} chosen):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-link-action text-xs text-primary"
                      onClick={() => {
                        const filteredIds = filteredStudentsForPicker.map(s => s.id);
                        setSelectedStudentIds(prev => {
                          const existingSet = new Set(prev.map(String));
                          const toAdd = filteredIds.filter(id => !existingSet.has(String(id)));
                          return [...prev, ...toAdd];
                        });
                      }}
                    >
                      Select All Filtered
                    </button>
                    <span className="text-muted text-xs">•</span>
                    <button
                      type="button"
                      className="btn-link-action text-xs text-rose-400"
                      onClick={() => setSelectedStudentIds([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Filter Row */}
                <div className="student-picker-filter-row mb-2">
                  <div className="search-input-box flex-1">
                    <Search size={13} className="search-icon" />
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="Search student name or roll..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="form-select text-xs picker-select"
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                  >
                    <option value="ALL">All Classes</option>
                    {classes.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    className="form-select text-xs picker-select"
                    value={studentBatchFilter}
                    onChange={(e) => setStudentBatchFilter(e.target.value)}
                  >
                    <option value="ALL">All Batches</option>
                    {accessibleBatches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Scrollable Students Checklist */}
                <div className="student-picker-checklist">
                  {filteredStudentsForPicker.map(student => {
                    const isSelected = selectedStudentIds.some(id => String(id) === String(student.id));
                    const sClass = classes.find(c => c.code === student.classCode);
                    const sBatch = batches.find(b => Number(b.id) === Number(student.batchId));
                    return (
                      <div 
                        key={student.id} 
                        className={`student-picker-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleToggleStudent(student.id)}
                        style={{ userSelect: 'none' }}
                      >
                        <div className="picker-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStudent(student.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                          />
                        </div>
                        <div className="picker-avatar">{student.name.charAt(0)}</div>
                        <div className="picker-student-details flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">{student.name}</span>
                            <span className="badge badge-class text-3xs">{sClass?.name || student.classCode}</span>
                          </div>
                          <div className="text-3xs text-muted flex items-center gap-2 mt-0.5">
                            <span>Roll: {student.admissionNo || '-'}</span>
                            <span>•</span>
                            <span className="text-secondary">{sBatch?.name || 'No Batch Slot'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredStudentsForPicker.length === 0 && (
                    <div className="p-3 text-center text-xs text-muted">
                      No students found matching your filter.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preset Templates */}
          <div className="glass-card presets-card">
            <div className="section-title-sm mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber" />
                <span>2. 1-Tap Notice Templates</span>
              </span>
              <span className="text-xs text-muted">Click to auto-populate</span>
            </div>

            <div className="preset-chips-wrap">
              {TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  className="preset-chip-btn"
                  onClick={() => applyTemplate(tmpl)}
                >
                  <span>{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Content Editor */}
          <div className="glass-card message-editor-card">
            <div className="section-title-sm mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare size={16} className="text-emerald" />
                <span>3. Message Title & WhatsApp Text</span>
              </span>
              <span className="text-xs text-muted font-mono">{message.length} chars</span>
            </div>

            <div className="form-group mb-3">
              <label className="form-label text-xs">Notice Heading / Title</label>
              <input 
                type="text" 
                className="form-input font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Special Sunday Tuition Class"
              />
            </div>

            <div className="form-group mb-2">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label text-xs mb-0">Message Body (Supports WhatsApp Bold *text* and Emojis)</label>
              </div>
              <textarea 
                rows={9}
                className="form-textarea font-sans text-sm leading-relaxed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
              />
            </div>

            {/* Variable Tags Help */}
            <div className="variables-hint-box mb-3">
              <span className="text-xs text-muted font-medium">Dynamic placeholders:</span>
              <div className="variable-pills">
                <span className="var-pill" onClick={() => setMessage(prev => prev + ' {student_name}')}>{'{student_name}'}</span>
                <span className="var-pill" onClick={() => setMessage(prev => prev + ' {batch_name}')}>{'{batch_name}'}</span>
                <span className="var-pill" onClick={() => setMessage(prev => prev + ' {class_name}')}>{'{class_name}'}</span>
              </div>
            </div>

            {/* Publish Actions */}
            <div className="publish-actions-row">
              <div className="portal-post-toggle flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="postPortal"
                  checked={postToParentPortal}
                  onChange={(e) => setPostToParentPortal(e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor="postPortal" className="text-xs text-slate-300 cursor-pointer select-none">
                  Also pin as Notice in Parent & Student Portal
                </label>
              </div>

              {postToParentPortal && (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveAndPublish}
                >
                  <Bell size={14} />
                  <span>Publish Notice</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live WhatsApp Preview & Recipient Dispatch List */}
        <div className="dispatch-column flex flex-col gap-4">
          {/* Live Preview Box */}
          <div className="glass-card whatsapp-preview-card">
            <div className="section-title-sm mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-emerald">
                <MessageSquare size={14} />
                <span>Live WhatsApp Message Preview</span>
              </span>
              <span className="text-xs text-muted">As seen on Parent's Phone</span>
            </div>

            <div className="whatsapp-bubble-mock">
              <div className="bubble-header-strip">
                <span className="badge badge-whatsapp">WhatsApp Official Notice</span>
                <span className="bubble-time font-mono">Today</span>
              </div>
              <div className="bubble-content-text">
                {formatMessageForStudent(message, targetRecipients[0] || { name: 'Aarav Kumar', batchId: 2, classCode: 'CLASS_10' })}
              </div>
            </div>
          </div>

          {/* Recipient Roster & Dispatch Actions */}
          <div className="glass-card recipient-roster-card">
            <div className="roster-header-row">
              <div>
                <div className="font-semibold text-sm text-white flex items-center gap-2">
                  <span>Target Parents ({targetRecipients.length})</span>
                  <span className="badge badge-class text-xs">{getTargetDescription()}</span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {sentStudentIds.size} of {targetRecipients.length} messaged
                </div>
              </div>

              {/* Bulk Quick Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  type="button"
                  className={`btn btn-xs ${copiedNumbers ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleCopyPhoneNumbers}
                  title="Copy all parent phone numbers for WhatsApp group"
                >
                  {copiedNumbers ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedNumbers ? 'Numbers Copied!' : 'Copy Numbers'}</span>
                </button>

                <button 
                  type="button"
                  className={`btn btn-xs ${copiedMessage ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleCopyFormattedMessage}
                  title="Copy full message text"
                >
                  {copiedMessage ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button 
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={handleOpenNextUnsent}
                  title="Open WhatsApp for the next unsent parent"
                >
                  <ArrowRight size={12} />
                  <span>Next Unsent</span>
                </button>
              </div>
            </div>

            {/* Recipient Rows */}
            <div className="recipients-list-wrap">
              {targetRecipients.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">
                  No active students found in this target selection.
                </div>
              ) : (
                targetRecipients.map((student) => {
                  const isSent = sentStudentIds.has(student.id);
                  const studentClass = classes.find(c => c.code === student.classCode);
                  const studentBatch = batches.find(b => b.id === student.batchId);

                  return (
                    <div key={student.id} className={`recipient-item-row ${isSent ? 'is-sent' : ''}`}>
                      <div className="recipient-info-col">
                        <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                          <span>{student.name}</span>
                          <span className="badge badge-class text-3xs">{studentClass?.name || student.classCode}</span>
                        </div>
                        <div className="text-3xs text-muted flex items-center gap-1.5 mt-0.5">
                          <span>Parent: {student.parentName}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald">{student.parentPhone}</span>
                          <span>•</span>
                          <span>{studentBatch?.name || 'Main Batch'}</span>
                        </div>
                      </div>

                      <div className="recipient-action-col">
                        {isSent && (
                          <span className="sent-status-badge">
                            <CheckCircle2 size={11} className="text-emerald" />
                            <span>Sent</span>
                          </span>
                        )}
                        <button
                          type="button"
                          className="btn btn-xs btn-success whatsapp-send-btn"
                          onClick={() => handleOpenWhatsApp(student)}
                          title="Open WhatsApp chat with pre-filled customized message"
                        >
                          <Send size={11} />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Published Announcements Board */}
          {Array.isArray(announcements) && announcements.length > 0 && (
            <div className="glass-card published-announcements-card">
              <div className="section-title-sm mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-white">
                  <Bell size={14} className="text-primary" />
                  <span>Published Notices on Parent Portal ({announcements.length})</span>
                </span>
              </div>

              <div className="published-notices-list">
                {announcements.map((ann) => (
                  <div key={ann.id} className="published-notice-item">
                    <div className="notice-item-main">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{ann.title}</span>
                        <span className="badge badge-class text-3xs">{ann.targetName || 'All Students'}</span>
                        <span className="text-3xs text-muted font-mono">{ann.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 whitespace-pre-line line-clamp-2">
                        {ann.message}
                      </p>
                    </div>

                    {!isTeacher && (
                      <button 
                        type="button"
                        className="btn-delete-mini"
                        title="Remove Notice"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .broadcast-page {
          padding-bottom: 30px;
        }
        .broadcast-header-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          margin-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .recipient-counter-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          color: white;
        }
        .broadcast-layout-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        .section-title-sm {
          font-size: 0.875rem;
          font-weight: 700;
          color: white;
        }
        .audience-type-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
        }
        .audience-tab-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          font-size: 0.775rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .audience-tab-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.06);
        }
        .audience-tab-btn.active {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-500);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
        }
        .preset-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .preset-chip-btn {
          padding: 5px 10px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .preset-chip-btn:hover {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.4);
          color: #FDE68A;
        }
        .variables-hint-box {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .variable-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .var-pill {
          font-family: monospace;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #93C5FD;
          cursor: pointer;
        }
        .var-pill:hover {
          background: rgba(59, 130, 246, 0.2);
        }
        .publish-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          gap: 10px;
          flex-wrap: wrap;
        }
        .whatsapp-preview-card {
          background: #0B141A !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
          padding: 14px;
        }
        .whatsapp-bubble-mock {
          background: #005C4B;
          color: #E9EDEF;
          border-radius: 8px 8px 8px 2px;
          padding: 10px 12px;
          font-size: 0.8125rem;
          line-height: 1.45;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .bubble-header-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .badge-whatsapp {
          background: rgba(255, 255, 255, 0.2);
          color: #D1FAE5;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 3px;
        }
        .bubble-time {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .bubble-content-text {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .roster-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 8px;
          flex-wrap: wrap;
        }
        .recipients-list-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .recipient-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          gap: 8px;
          transition: all 0.15s ease;
        }
        .recipient-item-row.is-sent {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .recipient-info-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .recipient-action-col {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .sent-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.65rem;
          color: #34D399;
          font-weight: 600;
        }
        .whatsapp-send-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          font-size: 0.725rem;
        }
        .published-notices-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .published-notice-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-md);
          gap: 8px;
        }
        .text-3xs {
          font-size: 0.625rem;
        }
        .btn-xs {
          padding: 4px 8px;
          font-size: 0.725rem;
        }
        .student-picker-filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .picker-select {
          width: auto;
          min-width: 110px;
          padding: 4px 8px;
          font-size: 0.75rem;
        }
        .student-picker-checklist {
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(0, 0, 0, 0.25);
          padding: 8px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .student-picker-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .student-picker-row:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .student-picker-row.is-selected {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
        }
        .picker-checkbox-wrapper {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .picker-avatar {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
          color: white;
          font-weight: 700;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .picker-student-details {
          min-width: 0;
        }

        @media (max-width: 860px) {
          .broadcast-layout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
