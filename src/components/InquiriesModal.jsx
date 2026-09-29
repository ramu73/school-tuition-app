import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  Trash2, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  Calendar, 
  UserPlus, 
  Filter, 
  Search,
  Check
} from 'lucide-react';
import { updateInquiryStatus, deleteInquiry } from '../lib/inquiries';

export default function InquiriesModal({ 
  isOpen, 
  onClose, 
  inquiries = [], 
  onAdmitLead,
  classes = []
}) {
  const [filterType, setFilterType] = useState('ALL'); // ALL, STUDENT_DEMO, TEACHER_APPLICATION, NEW
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredInquiries = inquiries.filter(item => {
    if (filterType === 'STUDENT_DEMO' && item.type !== 'STUDENT_DEMO') return false;
    if (filterType === 'TEACHER_APPLICATION' && item.type !== 'TEACHER_APPLICATION') return false;
    if (filterType === 'NEW' && item.status !== 'NEW') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchPhone = (item.phone || '').includes(q);
      const matchParent = (item.parentName || '').toLowerCase().includes(q);
      const matchSubjects = (item.subjects || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchParent || matchSubjects;
    }
    return true;
  });

  const newCount = inquiries.filter(i => i.status === 'NEW').length;
  const demoCount = inquiries.filter(i => i.type === 'STUDENT_DEMO').length;
  const teacherCount = inquiries.filter(i => i.type === 'TEACHER_APPLICATION').length;

  const handleWhatsApp = (item) => {
    let msg = '';
    if (item.type === 'STUDENT_DEMO') {
      msg = `Hello ${item.parentName || item.name}! This is from Hayagriva Tutorials Academy regarding your request for a Free Demo Class for ${item.name} (${item.classCode?.replace('CLASS_', 'Class ')}). When would be a good time to speak?`;
    } else {
      msg = `Hello ${item.name}! This is from Hayagriva Tutorials Academy regarding your Faculty Application for ${item.subjects}. We would like to schedule a brief discussion with our Director.`;
    }
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card inquiries-modal-card" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="title-icon-badge bg-primary-soft">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="modal-title text-lg font-bold flex items-center gap-2">
                <span>Website Inquiries &amp; Leads</span>
                {newCount > 0 && (
                  <span className="badge badge-danger text-xs font-bold font-mono">
                    {newCount} New
                  </span>
                )}
              </h2>
              <p className="text-xs text-secondary">Prospective student demo bookings and teacher job inquiries from the landing page</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              className={`btn btn-xs ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('ALL')}
            >
              All ({inquiries.length})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${filterType === 'NEW' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setFilterType('NEW')}
            >
              New Unread ({newCount})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${filterType === 'STUDENT_DEMO' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('STUDENT_DEMO')}
            >
              🎓 Student Demos ({demoCount})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${filterType === 'TEACHER_APPLICATION' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('TEACHER_APPLICATION')}
            >
              💼 Teacher Inquiries ({teacherCount})
            </button>
          </div>

          <div className="search-wrap" style={{ minWidth: '220px' }}>
            <input 
              type="text"
              className="form-input text-xs"
              placeholder="Search name, phone, subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '4px 10px' }}
            />
          </div>
        </div>

        {/* Inquiries List */}
        <div className="inquiries-list-scroll flex-1 p-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {filteredInquiries.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <Sparkles size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No inquiries matching this filter.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredInquiries.map((item) => {
                const isStudent = item.type === 'STUDENT_DEMO';
                const isNew = item.status === 'NEW';

                return (
                  <div 
                    key={item.id} 
                    className={`inquiry-item-card p-3 rounded-lg border transition-all ${
                      isNew ? 'border-primary/40 bg-indigo-950/20' : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${isStudent ? 'badge-success' : 'badge-primary'} text-3xs font-bold uppercase`}>
                          {isStudent ? '🎓 Student Demo' : '💼 Teacher Job'}
                        </span>
                        {isNew && (
                          <span className="badge badge-danger text-3xs font-extrabold">NEW</span>
                        )}
                        <h4 className="text-sm font-bold text-white m-0">{item.name}</h4>
                        {item.parentName && (
                          <span className="text-xs text-muted">
                            (Parent: <strong>{item.parentName}</strong>)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-3xs text-muted font-mono">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid-details-row grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted text-3xs uppercase block">Target / Class</span>
                        <span className="font-semibold text-white">
                          {item.classCode ? item.classCode.replace('CLASS_', 'Class ') : 'All'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted text-3xs uppercase block">Subject Focus</span>
                        <span className="text-white truncate block">{item.subjects || 'All Subjects'}</span>
                      </div>
                      <div>
                        <span className="text-muted text-3xs uppercase block">Mobile Phone</span>
                        <span className="font-mono text-emerald font-bold">+91 {item.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted text-3xs uppercase block">
                          {isStudent ? 'Preferred Timing' : 'Experience & Degree'}
                        </span>
                        <span className="text-white truncate block">
                          {isStudent ? (item.timingPreference || 'Evening') : `${item.experience || 'Experienced'} • ${item.qualification || ''}`}
                        </span>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="inquiry-notes text-2xs text-secondary bg-slate-950/40 p-2 rounded mb-2 border border-slate-800/80">
                        💬 <em>"{item.notes}"</em>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="inquiry-actions-row flex items-center justify-between pt-2 border-t border-slate-800/60 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={`tel:+91${item.phone}`}
                          className="btn btn-secondary btn-xs flex items-center gap-1"
                        >
                          <Phone size={12} className="text-emerald" />
                          <span>Call</span>
                        </a>

                        <button 
                          type="button" 
                          className="btn btn-secondary btn-xs flex items-center gap-1"
                          onClick={() => handleWhatsApp(item)}
                          style={{ borderColor: 'rgba(34, 197, 94, 0.4)', color: '#4ADE80' }}
                        >
                          <MessageCircle size={12} />
                          <span>WhatsApp</span>
                        </button>

                        {isStudent && onAdmitLead && (
                          <button 
                            type="button" 
                            className="btn btn-primary btn-xs flex items-center gap-1"
                            onClick={() => {
                              onAdmitLead({
                                name: item.name,
                                parentName: item.parentName || '',
                                parentPhone: item.phone,
                                classCode: item.classCode || 'CLASS_10',
                                school: item.schoolName || ''
                              });
                              updateInquiryStatus(item.id, 'ADMITTED');
                              onClose();
                            }}
                          >
                            <UserPlus size={12} />
                            <span>Admit Student</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.status === 'NEW' ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs flex items-center gap-1 text-slate-300"
                            onClick={() => updateInquiryStatus(item.id, 'CONTACTED')}
                            title="Mark as Contacted"
                          >
                            <Check size={12} className="text-emerald" />
                            <span>Mark Contacted</span>
                          </button>
                        ) : (
                          <span className="badge badge-success text-3xs font-semibold">
                            ✓ {item.status}
                          </span>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-xs text-rose"
                          onClick={() => {
                            if (window.confirm(`Delete inquiry for ${item.name}?`)) {
                              deleteInquiry(item.id);
                            }
                          }}
                          title="Delete Lead"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
