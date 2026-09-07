import React, { useState } from 'react';
import { 
  User, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  Printer, 
  BookOpen, 
  Award, 
  AlertCircle, 
  ShieldCheck, 
  FileText,
  Check,
  X,
  LogOut
} from 'lucide-react';
import HayagrivaLogo from './HayagrivaLogo';

export default function ParentPortal({ currentUser, data, onLogout }) {

  const { students = [], classes = [], batches = [], fees = [], receipts = [], attendance = [], exams = [], marks = [] } = data;

  // Find all children belonging to this parent phone or ID
  const parentPhone = currentUser?.parentPhone;
  const myChildren = students.filter(s => {
    if (currentUser?.studentId && s.id === currentUser.studentId) return true;
    if (parentPhone && s.parentPhone && s.parentPhone.replace(/\D/g, '') === parentPhone.replace(/\D/g, '')) return true;
    return false;
  });

  const [selectedStudentId, setSelectedStudentId] = useState(
    myChildren[0]?.id || currentUser?.studentId || (students[0]?.id || 1)
  );

  const [activeReceipt, setActiveReceipt] = useState(null);

  const currentStudent = students.find(s => s.id === Number(selectedStudentId)) || myChildren[0] || students[0];
  const studentClass = classes.find(c => c.code === currentStudent?.classCode);
  const studentBatch = batches.find(b => b.id === currentStudent?.batchId);

  // Student Fees
  const studentFees = fees.filter(f => f.studentId === currentStudent?.id);
  const currentMonthFee = studentFees.find(f => f.monthYear === 'March 2026') || studentFees[0];
  const studentReceipts = receipts.filter(r => r.studentId === currentStudent?.id);

  // Student Attendance
  const studentAttendance = attendance.filter(a => a.studentId === currentStudent?.id);
  const presentDays = studentAttendance.filter(a => a.status === 'PRESENT').length;
  const totalMarkedDays = studentAttendance.length;
  const attendanceRate = totalMarkedDays > 0 ? Math.round((presentDays / totalMarkedDays) * 100) : 100;

  // Student Exam Marks
  const studentMarks = marks.filter(m => m.studentId === currentStudent?.id).map(m => {
    const exam = exams.find(e => e.id === m.examId);
    return {
      ...m,
      examTitle: exam?.title || 'Class Unit Test',
      subject: exam?.subject || 'General',
      totalMarks: exam?.totalMarks || 50,
      passingMarks: exam?.passingMarks || 18,
      date: exam?.date || 'Recent'
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const tuitionWhatsAppUrl = `https://wa.me/919848266892?text=${encodeURIComponent(
    `Hello Hayagriva Tutorials, I am ${currentUser?.name || currentStudent?.parentName}, parent of ${currentStudent?.name} (${studentClass?.name || 'Class'}). I would like an update regarding my child's studies.`
  )}`;

  return (
    <div className="parent-portal-container">
      {/* Top Banner with Child Selector */}
      <div className="portal-header-card glass-card">
        <div className="portal-header-content">
          <div>
            <div className="parent-greeting">Parent & Guardian Portal</div>
            <h1 className="parent-title">Welcome, {currentUser?.name || currentStudent?.parentName || 'Parent'}</h1>
            <p className="parent-sub">Monitoring academic performance & fee status at Hayagriva Tutorials</p>
          </div>

          <div className="portal-header-actions">
            {onLogout && (
              <button onClick={onLogout} className="btn btn-secondary btn-sm logout-portal-btn">
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>


        {/* If parent has multiple children enrolled */}
        {myChildren.length > 1 && (
          <div className="children-switcher">
            <span className="switcher-label">Select Child:</span>
            <div className="switcher-pills">
              {myChildren.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedStudentId(c.id)}
                  className={`child-pill ${c.id === currentStudent?.id ? 'active' : ''}`}
                >
                  <User size={13} />
                  <span>{c.name} ({classes.find(cls => cls.code === c.classCode)?.name || c.classCode})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Student Profile Overview Card */}
      <div className="student-hero-card glass-card">
        <div className="student-profile-main">
          <div className="student-avatar-box">
            {currentStudent?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="student-name-lg">{currentStudent?.name}</h2>
              <span className="badge badge-class">{studentClass?.name || 'Class 10'}</span>
              <span className="badge badge-success">Active Student</span>
            </div>
            <div className="student-meta-row">
              <span><strong>Admission No:</strong> {currentStudent?.admissionNo}</span>
              <span>•</span>
              <span><strong>Day School:</strong> {currentStudent?.school || 'High School'}</span>
              <span>•</span>
              <span><strong>Admission Date:</strong> {currentStudent?.admissionDate}</span>
            </div>
          </div>
        </div>

        <div className="tuition-batch-info-box">
          <div className="text-xs text-muted mb-1">Assigned Tuition Batch:</div>
          <div className="batch-name-val">{studentBatch?.name || 'Standard Batch'}</div>
          <div className="batch-timing-val">
            <Clock size={13} />
            <span>{studentBatch?.timing || '05:30 PM - 07:30 PM'}</span>
          </div>
          <div className="batch-tutor-val">
            <User size={13} />
            <span>Faculty: {studentBatch?.tutor || 'Mr. R. Sharma (Maths & Physics)'}</span>
          </div>
        </div>
      </div>

      {/* 3 Quick Summary KPI Cards */}
      <div className="portal-kpis-grid">
        {/* Attendance KPI */}
        <div className="glass-card portal-kpi-card">
          <div className="kpi-icon-wrap bg-emerald-subtle">
            <Calendar size={22} className="text-emerald" />
          </div>
          <div>
            <div className="kpi-lbl">Attendance Record</div>
            <div className="kpi-val text-emerald">{attendanceRate}%</div>
            <div className="kpi-note">{presentDays} of {totalMarkedDays || 1} classes attended this month</div>
          </div>
        </div>

        {/* Fee Status KPI */}
        <div className="glass-card portal-kpi-card">
          <div className={`kpi-icon-wrap ${currentMonthFee?.balance > 0 ? 'bg-rose-subtle' : 'bg-emerald-subtle'}`}>
            <IndianRupee size={22} className={currentMonthFee?.balance > 0 ? 'text-rose' : 'text-emerald'} />
          </div>
          <div>
            <div className="kpi-lbl">Monthly Tuition Fee (March 2026)</div>
            {currentMonthFee?.balance > 0 ? (
              <>
                <div className="kpi-val text-rose">₹{currentMonthFee.balance} Due</div>
                <div className="kpi-note">Paid: ₹{currentMonthFee.amountPaid} of ₹{currentMonthFee.amountDue}</div>
              </>
            ) : (
              <>
                <div className="kpi-val text-emerald">₹{currentMonthFee?.amountPaid || currentStudent?.monthlyFee} Cleared</div>
                <div className="kpi-note">Fee fully paid for current cycle</div>
              </>
            )}
          </div>
        </div>

        {/* Support Helpdesk KPI */}
        <div className="glass-card portal-kpi-card contact-kpi">
          <div className="kpi-icon-wrap bg-primary-subtle">
            <MessageSquare size={22} className="text-primary" />
          </div>
          <div>
            <div className="kpi-lbl">Need Academic Help?</div>
            <div className="flex gap-2 mt-2">
              <a 
                href={tuitionWhatsAppUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-success btn-sm whatsapp-portal-btn"
              >
                <MessageSquare size={13} />
                <span>WhatsApp Tutor</span>
              </a>
              <a 
                href="tel:9848266892" 
                className="btn btn-secondary btn-sm"
              >
                <Phone size={13} />
                <span>Call Center</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Grid: Fee Receipts & Test Marks */}
      <div className="portal-details-grid">
        {/* Left Column: Fee Records & Downloadable Receipts */}
        <div className="glass-card portal-section">
          <div className="section-title-row">
            <div className="flex items-center gap-2">
              <IndianRupee size={18} className="text-primary" />
              <h3 className="section-title">Fee Ledger & Payment Receipts</h3>
            </div>
          </div>

          <div className="receipts-list">
            {studentReceipts.length === 0 ? (
              <div className="empty-state-box">
                <FileText size={32} className="text-muted mb-2" />
                <p>No payment receipts generated yet.</p>
              </div>
            ) : (
              studentReceipts.map(rec => (
                <div key={rec.id} className="parent-receipt-item">
                  <div>
                    <div className="receipt-no-title">{rec.receiptNo}</div>
                    <div className="receipt-date-sub">{rec.date} • Paid via {rec.mode}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="receipt-amt font-bold text-emerald">₹{rec.amount}</span>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveReceipt(rec)}
                    >
                      <Printer size={13} />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Weekly Tests & Examination Progress */}
        <div className="glass-card portal-section">
          <div className="section-title-row">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-primary" />
              <h3 className="section-title">Unit Tests & Slip Test Scores</h3>
            </div>
          </div>

          <div className="tests-list">
            {studentMarks.length === 0 ? (
              <div className="empty-state-box">
                <BookOpen size={32} className="text-muted mb-2" />
                <p>No test marks recorded for this student yet.</p>
              </div>
            ) : (
              studentMarks.map((test, idx) => {
                const percentage = Math.round((test.marksObtained / test.totalMarks) * 100);
                const isPassed = test.marksObtained >= test.passingMarks;

                return (
                  <div key={idx} className="parent-test-item">
                    <div className="test-info-col">
                      <div className="test-name-bold">{test.examTitle}</div>
                      <div className="test-meta-text">{test.subject} • {test.date}</div>
                      {test.remarks && <div className="test-remark-pill">Tutor Remark: {test.remarks}</div>}
                    </div>
                    <div className="test-score-col">
                      <div className={`score-badge ${isPassed ? 'score-pass' : 'score-fail'}`}>
                        {test.marksObtained} / {test.totalMarks}
                      </div>
                      <span className="text-xs text-muted font-bold">{percentage}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="modal-overlay receipt-modal-overlay">
          <div className="modal-content receipt-modal-content">
            <div className="modal-header">
              <span className="badge badge-success">Official Fee Receipt</span>
              <button className="close-btn" onClick={() => setActiveReceipt(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="receipt-paper" id="printable-tuition-receipt">
              <div className="receipt-banner">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                  <HayagrivaLogo size={34} showText={false} />
                  <div className="tuition-logo-title">HAYAGRIVA TUTORIALS</div>
                </div>
                <div className="tuition-motto">LEARN • GROW • SUCCEED</div>
                <div className="tuition-address">
                  8-3-825/5/5/2, Yellareddyguda, Srinagar Colony, Hyderabad - 500073
                </div>
                <div className="tuition-contact">
                  Classes 1 to X (State, CBSE & ICSE) • 📞 9848266892 / 9849473251
                </div>
              </div>

              <div className="receipt-divider-dashed" />

              <div className="receipt-meta-grid">
                <div>
                  <span className="meta-label">Receipt No:</span>
                  <span className="meta-val font-mono font-bold">{activeReceipt.receiptNo}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="meta-label">Payment Date:</span>
                  <span className="meta-val">{activeReceipt.date}</span>
                </div>
              </div>

              <div className="receipt-student-box">
                <div>
                  <span className="meta-label">Student Name:</span>
                  <span className="meta-val font-bold">{currentStudent?.name}</span>
                </div>
                <div>
                  <span className="meta-label">Class:</span>
                  <span className="meta-val">{studentClass?.name || currentStudent?.classCode}</span>
                </div>
                <div>
                  <span className="meta-label">Parent / Phone:</span>
                  <span className="meta-val">{currentStudent?.parentName} ({currentStudent?.parentPhone})</span>
                </div>
                <div>
                  <span className="meta-label">Payment Mode:</span>
                  <span className="meta-val">{activeReceipt.mode}</span>
                </div>
              </div>

              <div className="receipt-total-row">
                <span>Total Amount Paid:</span>
                <span className="font-mono">₹{activeReceipt.amount}</span>
              </div>

              <div className="receipt-signatures-grid">
                <div className="stamp-box">HAYAGRIVA PAID</div>
                <div className="signature-box">
                  <div className="sig-line" />
                  <div className="sig-label">Authorized Signatory</div>
                </div>
              </div>
            </div>

            <div className="receipt-modal-actions">
              <button className="btn btn-secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .parent-portal-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .portal-header-card {
          padding: 24px;
        }
        .parent-greeting {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #A5B4FC;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .parent-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
        }
        .parent-sub {
          font-size: 0.84rem;
          color: var(--text-secondary);
        }
        .children-switcher {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .switcher-label {
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .switcher-pills {
          display: flex;
          gap: 8px;
        }
        .child-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
        }
        .child-pill.active {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-500);
        }
        .student-hero-card {
          padding: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .student-profile-main {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .student-avatar-box {
          width: 58px;
          height: 58px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          color: white;
          font-size: 1.6rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
        }
        .student-name-lg {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
        }
        .student-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .tuition-batch-info-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          min-width: 250px;
        }
        .batch-name-val {
          font-weight: 700;
          font-size: 0.9rem;
          color: white;
        }
        .batch-timing-val,
        .batch-tutor-val {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.775rem;
          color: var(--text-secondary);
          margin-top: 3px;
        }
        .portal-kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        .portal-kpi-card {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .kpi-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bg-emerald-subtle { background: rgba(16, 185, 129, 0.12); }
        .bg-rose-subtle { background: rgba(244, 63, 94, 0.12); }
        .bg-primary-subtle { background: rgba(99, 102, 241, 0.12); }
        .kpi-lbl {
          font-size: 0.775rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .kpi-val {
          font-size: 1.4rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 2px 0;
        }
        .kpi-note {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .portal-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 900px) {
          .portal-details-grid { grid-template-columns: 1fr; }
        }
        .portal-section {
          padding: 22px;
        }
        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 14px;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: white;
        }
        .receipts-list,
        .tests-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .parent-receipt-item,
        .parent-test-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
        }
        .receipt-no-title,
        .test-name-bold {
          font-weight: 700;
          font-size: 0.875rem;
          color: white;
        }
        .receipt-date-sub,
        .test-meta-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .test-remark-pill {
          display: inline-block;
          font-size: 0.725rem;
          color: #C7D2FE;
          background: rgba(99, 102, 241, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 4px;
        }
        .score-badge {
          font-size: 1rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
        }
        .score-pass {
          color: #34D399;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .score-fail {
          color: #FB7185;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
        }
        .test-score-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .empty-state-box {
          text-align: center;
          padding: 30px;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Mobile Responsive for Parent Portal */
        @media (max-width: 768px) {
          .portal-header-card {
            padding: 14px 12px;
          }
          .portal-header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .student-selector-box {
            width: 100%;
            min-width: 100%;
          }
          .student-banner-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            padding: 14px 12px;
          }
          .tuition-batch-info-box {
            width: 100%;
            min-width: 100%;
          }
          .portal-kpis-grid {
            grid-template-columns: 1fr !important;
            gap: 10px;
          }
          .portal-details-grid {
            grid-template-columns: 1fr !important;
            gap: 14px;
          }
          .parent-receipt-item,
          .parent-test-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .test-score-col {
            align-items: flex-start;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
