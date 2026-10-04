import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  CheckCircle2, 
  Phone, 
  User, 
  Mail, 
  GraduationCap, 
  Award, 
  Clock, 
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { addInquiry } from '../lib/inquiries';

export default function TeacherInquiryModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subjects: 'Mathematics & Science',
    classCode: 'CLASS_10',
    experience: '3+ Years',
    qualification: 'M.Sc., B.Ed',
    timingPreference: 'Evening (4:00 PM - 6:00 PM)',
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
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInquiry({
        type: 'TEACHER_APPLICATION',
        name: formData.name,
        phone: cleanPhone,
        email: formData.email,
        subjects: formData.subjects,
        classCode: formData.classCode,
        experience: formData.experience,
        qualification: formData.qualification,
        timingPreference: formData.timingPreference,
        notes: formData.notes
      });
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit application. Please try again or WhatsApp us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppTeacher = () => {
    const msg = `Hello Hayagriva Tutorials Director! I have applied for the Faculty position.\n\n*Name:* ${formData.name}\n*Subjects:* ${formData.subjects}\n*Classes:* ${formData.classCode.replace('CLASS_', 'Class ')}\n*Experience:* ${formData.experience}\n*Qualification:* ${formData.qualification}\n*Mobile:* ${formData.phone}\n\nI would love to discuss faculty opportunities. Thank you!`;
    const url = `https://wa.me/919848266892?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card teacher-modal-card" style={{ maxWidth: '600px', width: '94%' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="title-icon-badge bg-primary-soft">
              <Briefcase size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="modal-title text-lg font-bold">Join Our Faculty Team</h2>
              <p className="text-xs text-secondary">Teach young minds at Hayagriva Tutorials Academy — Classes 1 to 10</p>
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
          <div className="teacher-success-content p-4 text-center">
            <div className="success-icon-wrap mb-3">
              <CheckCircle2 size={54} className="text-primary" style={{ margin: '0 auto' }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Application Submitted Successfully!</h3>
            <p className="text-sm text-secondary mb-4 leading-relaxed">
              Thank you, <strong>{formData.name}</strong>! We have received your teaching profile. Our Academy Director will review your qualifications and contact you on <strong>+91 {formData.phone}</strong> for an interview.
            </p>

            <div className="app-summary-card p-3 rounded-lg mb-4 text-left" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted">Subject Specialization:</span>
                <span className="font-bold text-white">{formData.subjects}</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted">Experience &amp; Degree:</span>
                <span className="font-semibold text-primary">{formData.experience} • {formData.qualification}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Target Standards:</span>
                <span className="text-white">{formData.classCode.replace('CLASS_', 'Class ')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                type="button" 
                className="btn btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleWhatsAppTeacher}
                style={{ background: '#25D366', borderColor: '#22C55E', color: '#FFFFFF', fontWeight: 700 }}
              >
                <MessageCircle size={18} />
                <span>Chat Directly on WhatsApp</span>
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
          <form onSubmit={handleSubmit} className="teacher-form p-2">
            {error && (
              <div className="alert-error-banner mb-3 p-2.5 rounded text-xs text-rose" style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                {error}
              </div>
            )}

            <div className="grid-2-cols mb-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <User size={13} className="inline mr-1 text-primary" />
                  Full Name <span className="text-rose">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Srilatha Reddy" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <Phone size={13} className="inline mr-1 text-emerald" />
                  Contact Mobile <span className="text-rose">*</span>
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
            </div>

            <div className="grid-2-cols mb-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <Mail size={13} className="inline mr-1 text-primary" />
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. srilatha@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <GraduationCap size={13} className="inline mr-1 text-primary" />
                  Highest Qualification
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. M.Sc., B.Ed, B.Tech, M.A" 
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2-cols mb-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <Award size={13} className="inline mr-1 text-primary" />
                  Subject(s) You Teach <span className="text-rose">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Mathematics, Science, English..." 
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  required
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  <Clock size={13} className="inline mr-1 text-primary" />
                  Teaching Experience
                </label>
                <select 
                  className="form-select"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                >
                  <option value="Fresher / Passionate Tutor">Fresher / Passionate Tutor</option>
                  <option value="1 - 2 Years">1 - 2 Years</option>
                  <option value="3 - 5 Years">3 - 5 Years</option>
                  <option value="5+ Years Experienced">5+ Years Experienced</option>
                </select>
              </div>
            </div>

            <div className="grid-2-cols mb-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  Classes / Standards You Can Handle
                </label>
                <select 
                  className="form-select"
                  value={formData.classCode}
                  onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                >
                  <option value="CLASS_10">Classes 9 & 10 (Board Exam Coaching)</option>
                  <option value="CLASS_8">Classes 6 to 8 (Middle School)</option>
                  <option value="CLASS_5">Classes 1 to 5 (Primary Foundation)</option>
                  <option value="ALL">All Classes (Class 1 to 10)</option>
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">
                  Availability / Timings
                </label>
                <select 
                  className="form-select"
                  value={formData.timingPreference}
                  onChange={(e) => setFormData({ ...formData, timingPreference: e.target.value })}
                >
                  <option value="Evening (4:00 PM - 6:00 PM)">Evening (4:00 PM - 6:00 PM)</option>
                  <option value="Evening (6:00 PM - 8:00 PM)">Evening (6:00 PM - 8:00 PM)</option>
                  <option value="Both Evening Slots (4:00 PM - 8:00 PM)">Both Evening Slots (4:00 PM - 8:00 PM)</option>
                  <option value="Flexible Evening Timing">Flexible Evening Timing</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label text-xs">
                Brief Bio / Past Schools or Institutes / Notes
              </label>
              <textarea 
                className="form-input" 
                rows={2}
                placeholder="Mention schools where you taught, teaching philosophy, or any special achievements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
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
