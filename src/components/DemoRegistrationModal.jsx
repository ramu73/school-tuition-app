import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Phone, 
  User, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Building2, 
  Send,
  MessageCircle,
  Award
} from 'lucide-react';
import { addInquiry } from '../lib/inquiries';

export default function DemoRegistrationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    classCode: 'CLASS_10',
    schoolName: '',
    subjects: 'Mathematics & Science',
    timingPreference: 'Evening (5:30 PM - 7:30 PM)',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.studentName.trim() || formData.studentName.trim().length < 2) {
      setError('Please enter student name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInquiry({
        type: 'STUDENT_DEMO',
        name: formData.studentName,
        parentName: formData.parentName,
        phone: cleanPhone,
        email: formData.email,
        classCode: formData.classCode,
        schoolName: formData.schoolName,
        subjects: formData.subjects,
        timingPreference: formData.timingPreference,
        notes: formData.notes
      });
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit demo request. Please try again or WhatsApp us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const className = formData.classCode.replace('CLASS_', 'Class ');
    const msg = `Hello Hayagriva Tutorials! I have registered for a Free Demo Class.\n\n*Student:* ${formData.studentName}\n*Standard:* ${className}\n*School:* ${formData.schoolName || 'N/A'}\n*Parent:* ${formData.parentName || 'Parent'}\n*Mobile:* ${formData.phone}\n*Preferred Timing:* ${formData.timingPreference}\n\nPlease confirm our demo session schedule. Thank you!`;
    const url = `https://wa.me/919848266892?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card demo-modal-card" style={{ maxWidth: '580px', width: '94%' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="title-icon-badge bg-emerald-soft">
              <Sparkles size={20} className="text-emerald" />
            </div>
            <div>
              <h2 className="modal-title text-lg font-bold">Enroll Your Child • Free Trial Demo</h2>
              <p className="text-xs text-secondary">Experience our conceptual teaching methodology with zero commitment</p>
            </div>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="demo-success-content p-4 text-center">
            <div className="success-icon-wrap mb-3">
              <CheckCircle2 size={54} className="text-emerald" style={{ margin: '0 auto' }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Child Enrollment Request Received!</h3>
            <p className="text-sm text-secondary mb-4 leading-relaxed">
              Thank you, <strong>{formData.parentName || formData.studentName}</strong>! Our academic coordinator will call you on <strong>+91 {formData.phone}</strong> to confirm your child's 2-day classroom trial.
            </p>

            <div className="demo-highlight-box p-3 rounded-lg mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div className="flex items-center justify-between text-xs text-left mb-1.5">
                <span className="text-muted">Enrolled Standard:</span>
                <span className="font-bold text-white">{formData.classCode.replace('CLASS_', 'Class ')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-left mb-1.5">
                <span className="text-muted">Preferred Timing:</span>
                <span className="font-semibold text-emerald">{formData.timingPreference}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-left">
                <span className="text-muted">Target Subjects:</span>
                <span className="text-white">{formData.subjects}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                type="button" 
                className="btn btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleWhatsAppDirect}
                style={{ background: '#25D366', borderColor: '#22C55E', color: '#FFFFFF', fontWeight: 700 }}
              >
                <MessageCircle size={18} />
                <span>Instant WhatsApp Confirmation</span>
              </button>

              <button 
                type="button" 
                className="btn btn-secondary w-full"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
              >
                Back to Website
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="demo-form p-2">
            {error && (
              <div className="alert-error-banner mb-3 p-2.5 rounded text-xs text-rose" style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                {error}
              </div>
            )}

            <div className="grid-2-cols mb-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <User size={13} className="inline mr-1 text-primary" />
                  Student Full Name <span className="text-rose">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. K. Sai Akhil" 
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <GraduationCap size={13} className="inline mr-1 text-primary" />
                  Standard / Class <span className="text-rose">*</span>
                </label>
                <select 
                  className="form-select"
                  value={formData.classCode}
                  onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                >
                  <option value="CLASS_1">Class 1</option>
                  <option value="CLASS_2">Class 2</option>
                  <option value="CLASS_3">Class 3</option>
                  <option value="CLASS_4">Class 4</option>
                  <option value="CLASS_5">Class 5</option>
                  <option value="CLASS_6">Class 6</option>
                  <option value="CLASS_7">Class 7</option>
                  <option value="CLASS_8">Class 8</option>
                  <option value="CLASS_9">Class 9</option>
                  <option value="CLASS_10">Class 10 (Board Exam Special)</option>
                </select>
              </div>
            </div>

            <div className="grid-2-cols mb-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <Building2 size={13} className="inline mr-1 text-primary" />
                  School Name (Optional)
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. St. Joseph, Narayana, Bhashyam" 
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <User size={13} className="inline mr-1 text-primary" />
                  Parent / Guardian Name
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. K. Venkatesh" 
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2-cols mb-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <Phone size={13} className="inline mr-1 text-emerald" />
                  Parent Mobile / WhatsApp <span className="text-rose">*</span>
                </label>
                <div className="phone-prefix-wrap flex items-center">
                  <span className="phone-prefix text-xs font-mono text-muted pr-1.5">+91</span>
                  <input 
                    type="tel" 
                    className="form-input flex-1" 
                    placeholder="10-digit mobile" 
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <Clock size={13} className="inline mr-1 text-primary" />
                  Preferred Batch Timing
                </label>
                <select 
                  className="form-select"
                  value={formData.timingPreference}
                  onChange={(e) => setFormData({ ...formData, timingPreference: e.target.value })}
                >
                  <option value="Evening (5:00 PM - 7:00 PM)">Evening (5:00 PM - 7:00 PM)</option>
                  <option value="Evening (6:00 PM - 8:00 PM)">Evening (6:00 PM - 8:00 PM)</option>
                  <option value="Morning (6:30 AM - 8:00 AM)">Morning (6:30 AM - 8:00 AM)</option>
                  <option value="Weekend Special">Weekend Special</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label text-xs">
                <BookOpen size={13} className="inline mr-1 text-primary" />
                Target Subjects &amp; Special Focus
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. All Subjects, Maths & Science, Foundation..." 
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              />
            </div>

            <div className="modal-actions-flex flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ minWidth: '150px' }}
              >
                {isSubmitting ? 'Submitting Enrollment...' : 'Enroll Child for Free Trial'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .grid-2-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .grid-2-cols {
            grid-template-columns: 1fr;
          }
        }
        .phone-prefix-wrap {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding-left: 10px;
        }
        .phone-prefix-wrap .form-input {
          border: none;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
