import React, { useState } from 'react';
import { 
  IndianRupee, 
  Receipt, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Search, 
  X, 
  CreditCard, 
  Building, 
  Check, 
  MessageSquare, 
  Calendar, 
  Bell, 
  Clock, 
  Send,
  Copy,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { calculateStudentFeeCycle, generateFeeReminderWhatsAppUrl } from '../lib/feeCycle';
import { generateNextId } from '../lib/storage';
import HayagrivaLogo from './HayagrivaLogo';


export default function Fees({ 
  data, 
  onSaveData, 
  feeCollectModalOpen, 
  setFeeCollectModalOpen 
}) {
  const { fees = [], students = [], classes = [], receipts = [] } = data;

  const [viewMode, setViewMode] = useState('cycles'); // 'cycles' (Joining Date Reminders) or 'ledger'
  const [cycleFilter, setCycleFilter] = useState('ALL'); // ALL, OVERDUE, DUE_TODAY, UPCOMING, PAID
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, PARTIAL, PAID
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Selected receipt for printable modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Collect Fee Modal State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [feeNotes, setFeeNotes] = useState('');

  // Financial Stats
  const totalBilled = fees.reduce((sum, f) => sum + Number(f.amountDue), 0);
  const totalCollected = fees.reduce((sum, f) => sum + Number(f.amountPaid), 0);
  const totalOutstanding = fees.reduce((sum, f) => sum + Number(f.balance), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Calculate Fee Cycles based on Joining Date
  const activeStudents = students.filter(s => s.status === 'ACTIVE');
  const studentFeeCycles = activeStudents.map(student => {
    const feeRecord = fees.find(f => f.studentId === student.id && f.monthYear === 'March 2026');
    return calculateStudentFeeCycle(student, feeRecord);
  });

  const dueTodayCycles = studentFeeCycles.filter(c => c.cycleStatus === 'DUE_TODAY');
  const overdueCycles = studentFeeCycles.filter(c => c.cycleStatus === 'OVERDUE');
  const upcomingCycles = studentFeeCycles.filter(c => c.cycleStatus === 'UPCOMING' && c.daysDiff <= 5);

  // Handle student selection in Collect Fee modal
  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    const existingFee = fees.find(f => f.studentId === Number(studentId) && f.monthYear === 'March 2026');
    if (existingFee) {
      setPaymentAmount(existingFee.balance);
    } else {
      const student = students.find(s => s.id === Number(studentId));
      setPaymentAmount(student?.monthlyFee || 1000);
    }
  };

  // Copy SMS / WhatsApp message to clipboard
  const handleCopyMessage = (cycleInfo) => {
    const url = generateFeeReminderWhatsAppUrl(cycleInfo, 'HAYAGRIVA TUTORIALS');
    const msg = decodeURIComponent(url.split('text=')[1] || '');
    navigator.clipboard.writeText(msg);
    setCopiedId(cycleInfo.studentId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Submit Payment Collection
  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!selectedStudentId || !paymentAmount || Number(paymentAmount) <= 0) {
      alert('Please select a student and enter a valid payment amount.');
      return;
    }

    const sId = Number(selectedStudentId);
    const student = students.find(s => s.id === sId);
    const amountNum = Number(paymentAmount);
    const currentMonth = 'March 2026';
    const todayStr = new Date().toISOString().split('T')[0];
    const receiptNumber = `REC-2026-${Math.floor(100 + Math.random() * 900)}`;

    let updatedFees = [...fees];
    const feeIndex = updatedFees.findIndex(f => f.studentId === sId && f.monthYear === currentMonth);

    if (feeIndex >= 0) {
      const currentFee = updatedFees[feeIndex];
      const newPaid = Number(currentFee.amountPaid) + amountNum;
      const newBalance = Math.max(Number(currentFee.amountDue) - newPaid, 0);
      const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

      updatedFees[feeIndex] = {
        ...currentFee,
        amountPaid: newPaid,
        balance: newBalance,
        status: newStatus,
        lastPaymentDate: todayStr,
        receiptNo: receiptNumber,
        paymentMode
      };
    } else {
      const monthlyFee = student?.monthlyFee || amountNum;
      const balance = Math.max(monthlyFee - amountNum, 0);
      updatedFees.push({
        id: generateNextId(fees),
        studentId: sId,
        monthYear: currentMonth,
        amountDue: monthlyFee,
        amountPaid: amountNum,
        balance,
        status: balance === 0 ? 'PAID' : 'PARTIAL',
        lastPaymentDate: todayStr,
        receiptNo: receiptNumber,
        paymentMode
      });
    }

    const newReceipt = {
      id: generateNextId(receipts),
      receiptNo: receiptNumber,
      studentId: sId,
      studentName: student?.name || 'Student',
      classCode: student?.classCode || 'CLASS_10',
      amount: amountNum,
      monthYear: currentMonth,
      date: todayStr,
      mode: paymentMode,
      transactionRef: transactionRef || `${paymentMode}-OFFLINE`,
      notes: feeNotes || 'Monthly tuition fee'
    };


    onSaveData({
      ...data,
      fees: updatedFees,
      receipts: [newReceipt, ...receipts]
    });

    setFeeCollectModalOpen(false);
    setSelectedStudentId('');
    setPaymentAmount('');
    setTransactionRef('');
    setFeeNotes('');
    setActiveReceipt(newReceipt);
  };

  // Filter cycles
  const filteredCycles = studentFeeCycles.filter(item => {
    if (classFilter !== 'ALL' && item.classCode !== classFilter) return false;
    if (cycleFilter !== 'ALL') {
      if (cycleFilter === 'DUE_TODAY' && item.cycleStatus !== 'DUE_TODAY') return false;
      if (cycleFilter === 'OVERDUE' && item.cycleStatus !== 'OVERDUE') return false;
      if (cycleFilter === 'UPCOMING' && (item.cycleStatus !== 'UPCOMING' || item.daysDiff > 5)) return false;
      if (cycleFilter === 'PAID' && item.cycleStatus !== 'PAID') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.studentName.toLowerCase().includes(q);
      const matchParent = item.parentName.toLowerCase().includes(q);
      const matchPhone = item.parentPhone.includes(q);
      return matchName || matchParent || matchPhone;
    }
    return true;
  });

  // Filter general ledger
  const filteredFees = fees.filter(fee => {
    const student = students.find(s => s.id === fee.studentId);
    if (!student) return false;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING' && fee.status !== 'PENDING') return false;
      if (statusFilter === 'PARTIAL' && fee.status !== 'PARTIAL') return false;
      if (statusFilter === 'PAID' && fee.status !== 'PAID') return false;
      if (statusFilter === 'DEFAULTERS' && fee.balance <= 0) return false;
    }
    if (classFilter !== 'ALL' && student.classCode !== classFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = student.name.toLowerCase().includes(q);
      const matchRoll = student.admissionNo.toLowerCase().includes(q);
      return matchName || matchRoll;
    }
    return true;
  });

  return (
    <div className="fees-page">
      {/* Top Header */}
      <div className="fees-header">
        <div>
          <h1 className="page-title">Tuition Fees & Parent Reminders</h1>
          <p className="page-subtitle">
            Fee notification cycles calculated automatically from each student's <strong>joining date</strong>
          </p>
        </div>
        <div className="header-actions-flex">
          <button className="btn btn-success" onClick={() => setFeeCollectModalOpen(true)}>
            <Plus size={16} />
            <span>Collect Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fee-kpi-grid">
        <div className="glass-card fee-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Monthly Billed (March 2026)</span>
            <Building size={18} className="text-primary" />
          </div>
          <div className="kpi-value">₹{totalBilled.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted">Total expected from Class 1–10</div>
        </div>

        <div className="glass-card fee-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total Collected</span>
            <CheckCircle2 size={18} className="text-emerald" />
          </div>
          <div className="kpi-value text-emerald">₹{totalCollected.toLocaleString('en-IN')}</div>
          <div className="text-xs text-emerald font-semibold">{collectionRate}% Recovery Rate</div>
        </div>

        <div className="glass-card fee-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Joining Date Overdue</span>
            <AlertCircle size={18} className="text-rose" />
          </div>
          <div className="kpi-value text-rose">
            {overdueCycles.length} Students
          </div>
          <div className="text-xs text-rose font-semibold">
            ₹{overdueCycles.reduce((sum, c) => sum + c.balance, 0).toLocaleString('en-IN')} pending
          </div>
        </div>

        <div className="glass-card fee-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Due Today (Joining Day)</span>
            <Bell size={18} className="text-amber" />
          </div>
          <div className="kpi-value text-amber">
            {dueTodayCycles.length} Students
          </div>
          <div className="text-xs text-amber font-semibold">
            {dueTodayCycles.length > 0 ? 'Send today\'s reminder' : 'All clear for today'}
          </div>
        </div>
      </div>

      {/* View Mode Toggle Tabs */}
      <div className="view-mode-tabs-wrapper">
        <div className="view-mode-tabs">
          <button 
            className={`view-tab-btn ${viewMode === 'cycles' ? 'active' : ''}`}
            onClick={() => setViewMode('cycles')}
          >
            <Bell size={16} />
            <span>Joining Date Fee Reminders (WhatsApp)</span>
            {(dueTodayCycles.length > 0 || overdueCycles.length > 0) && (
              <span className="tab-alert-badge">{dueTodayCycles.length + overdueCycles.length}</span>
            )}
          </button>
          <button 
            className={`view-tab-btn ${viewMode === 'ledger' ? 'active' : ''}`}
            onClick={() => setViewMode('ledger')}
          >
            <Receipt size={16} />
            <span>Standard Monthly Ledger</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: JOINING DATE FEE CYCLES & NOTIFICATIONS */}
      {viewMode === 'cycles' && (
        <div className="cycles-view-container">
          {/* Cycle Filters Bar */}
          <div className="glass-card fee-filters-card">
            <div className="filters-row">
              <div className="status-pills">
                <button 
                  className={`pill-btn ${cycleFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setCycleFilter('ALL')}
                >
                  All ({studentFeeCycles.length})
                </button>
                <button 
                  className={`pill-btn pill-danger ${cycleFilter === 'OVERDUE' ? 'active' : ''}`}
                  onClick={() => setCycleFilter('OVERDUE')}
                >
                  <AlertTriangle size={13} />
                  <span>Overdue ({overdueCycles.length})</span>
                </button>
                <button 
                  className={`pill-btn pill-warning ${cycleFilter === 'DUE_TODAY' ? 'active' : ''}`}
                  onClick={() => setCycleFilter('DUE_TODAY')}
                >
                  <Bell size={13} />
                  <span>Due Today ({dueTodayCycles.length})</span>
                </button>
                <button 
                  className={`pill-btn ${cycleFilter === 'UPCOMING' ? 'active' : ''}`}
                  onClick={() => setCycleFilter('UPCOMING')}
                >
                  <Clock size={13} />
                  <span>Due in 1-5 Days ({upcomingCycles.length})</span>
                </button>
                <button 
                  className={`pill-btn pill-success ${cycleFilter === 'PAID' ? 'active' : ''}`}
                  onClick={() => setCycleFilter('PAID')}
                >
                  <Check size={13} />
                  <span>Cleared</span>
                </button>
              </div>

              <div className="class-filter-box">
                <select 
                  className="form-select select-class-sm"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="ALL">All Standards (1 to 10)</option>
                  {classes.map(cls => (
                    <option key={cls.code} value={cls.code}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="search-box-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text"
                  placeholder="Search student, parent, or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          {/* Joining Date Notification Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student & Standard</th>
                  <th>Parent Contact</th>
                  <th>Joining Date</th>
                  <th>Monthly Cycle</th>
                  <th>Cycle Due Date</th>
                  <th>Due Balance</th>
                  <th>Cycle Status</th>
                  <th style={{ textAlign: 'center' }}>WhatsApp Alert to Parent</th>
                  <th style={{ textAlign: 'center' }}>Collect</th>
                </tr>
              </thead>
              <tbody>
                {filteredCycles.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No students found for current fee cycle filter.
                    </td>
                  </tr>
                ) : (
                  filteredCycles.map((item) => {
                    const className = classes.find(c => c.code === item.classCode)?.name || item.classCode;
                    const whatsappUrl = generateFeeReminderWhatsAppUrl(item, 'HAYAGRIVA TUTORIALS');

                    return (
                      <tr key={item.studentId}>
                        <td>
                          <div className="font-semibold">{item.studentName}</div>
                          <span className="badge badge-class">{className}</span>
                        </td>
                        <td>
                          <div className="font-semibold text-xs">{item.parentName}</div>
                          <div className="text-xs text-muted font-mono">{item.parentPhone}</div>
                        </td>
                        <td>
                          <div className="text-xs font-mono">{item.joiningDate}</div>
                        </td>
                        <td>
                          <div className="cycle-tag">
                            <Calendar size={12} />
                            <span><strong>{item.cycleDay}th</strong> of every month</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-semibold text-xs">{item.formattedDueDate}</span>
                        </td>
                        <td>
                          {item.balance > 0 ? (
                            <span className="text-rose font-bold">₹{item.balance.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-emerald font-semibold text-xs">Nil (Cleared)</span>
                          )}
                        </td>
                        <td>
                          {item.cycleStatus === 'PAID' && (
                            <span className="badge badge-success">Paid for Cycle</span>
                          )}
                          {item.cycleStatus === 'DUE_TODAY' && (
                            <span className="badge badge-warning pulse-badge">Due Today ({item.cycleDay}th)</span>
                          )}
                          {item.cycleStatus === 'OVERDUE' && (
                            <span className="badge badge-danger">
                              {Math.abs(item.daysDiff)} Day(s) Overdue
                            </span>
                          )}
                          {item.cycleStatus === 'UPCOMING' && (
                            <span className="badge badge-class">
                              In {item.daysDiff} Day(s)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.balance > 0 ? (
                            <div className="action-buttons-flex">
                              <a 
                                href={whatsappUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-sm btn-success whatsapp-btn-icon"
                                title="Send WhatsApp Fee Reminder to Parent"
                              >
                                <MessageSquare size={14} />
                                <span>WhatsApp Parent</span>
                              </a>
                              <button 
                                className="btn-icon"
                                title="Copy SMS / WhatsApp Text"
                                onClick={() => handleCopyMessage(item)}
                              >
                                {copiedId === item.studentId ? (
                                  <Check size={14} className="text-emerald" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted text-xs">No Reminder Needed</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.balance > 0 ? (
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                handleStudentSelect(item.studentId);
                                setFeeCollectModalOpen(true);
                              }}
                            >
                              Collect
                            </button>
                          ) : (
                            <span className="badge badge-success">
                              <Check size={12} />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: STANDARD MONTHLY LEDGER */}
      {viewMode === 'ledger' && (
        <div className="ledger-view-container">
          {/* Filters Bar */}
          <div className="glass-card fee-filters-card">
            <div className="filters-row">
              <div className="status-pills">
                <button 
                  className={`pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All Records ({fees.length})
                </button>
                <button 
                  className={`pill-btn ${statusFilter === 'DEFAULTERS' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('DEFAULTERS')}
                >
                  Pending Dues ({fees.filter(f => f.balance > 0).length})
                </button>
                <button 
                  className={`pill-btn ${statusFilter === 'PARTIAL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PARTIAL')}
                >
                  Partial Paid
                </button>
                <button 
                  className={`pill-btn ${statusFilter === 'PAID' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PAID')}
                >
                  Fully Cleared
                </button>
              </div>

              <div className="class-filter-box">
                <select 
                  className="form-select select-class-sm"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="ALL">All Classes (1 to 10)</option>
                  {classes.map(cls => (
                    <option key={cls.code} value={cls.code}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="search-box-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text"
                  placeholder="Search student or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          {/* Fees Ledger Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Joining Date Cycle</th>
                  <th>Month</th>
                  <th>Amount Due</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No fee records found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee) => {
                    const student = students.find(s => s.id === fee.studentId);
                    const className = classes.find(c => c.code === student?.classCode)?.name || 'Class';
                    const receipt = receipts.find(r => r.receiptNo === fee.receiptNo || (r.studentId === fee.studentId && r.monthYear === fee.monthYear));
                    const cycleDay = student?.admissionDate ? new Date(student.admissionDate).getDate() : 1;

                    return (
                      <tr key={fee.id}>
                        <td>
                          <div className="font-semibold">{student?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted">{student?.admissionNo}</div>
                        </td>
                        <td>
                          <span className="badge badge-class">{className}</span>
                        </td>
                        <td>
                          <div className="cycle-tag">
                            <span>{cycleDay}th of month</span>
                          </div>
                        </td>
                        <td className="text-xs font-semibold">{fee.monthYear}</td>
                        <td className="font-semibold">₹{fee.amountDue}</td>
                        <td className="text-emerald font-semibold">₹{fee.amountPaid}</td>
                        <td>
                          {fee.balance > 0 ? (
                            <span className="text-rose font-bold">₹{fee.balance}</span>
                          ) : (
                            <span className="text-muted text-xs">Nil (Cleared)</span>
                          )}
                        </td>
                        <td>
                          {fee.status === 'PAID' && <span className="badge badge-success">Paid</span>}
                          {fee.status === 'PARTIAL' && <span className="badge badge-warning">Partial</span>}
                          {fee.status === 'PENDING' && <span className="badge badge-danger">Unpaid</span>}
                        </td>
                        <td>
                          {receipt ? (
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => setActiveReceipt(receipt)}
                              title="Print Receipt"
                            >
                              <Printer size={13} />
                              <span>{receipt.receiptNo}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {fee.balance > 0 ? (
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                handleStudentSelect(student?.id);
                                setFeeCollectModalOpen(true);
                              }}
                            >
                              Collect
                            </button>
                          ) : (
                            <span className="badge badge-success">
                              <Check size={12} />
                              <span>Cleared</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      {feeCollectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Record Fee Payment</h2>
              <button className="close-btn" onClick={() => setFeeCollectModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="admission-form">
              <div className="form-group">
                <label className="form-label">Select Student (Class 1 to 10) *</label>
                <select 
                  className="form-select"
                  required
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                >
                  <option value="">Choose student...</option>
                  {students.filter(s => s.status === 'ACTIVE').map(s => {
                    const cls = classes.find(c => c.code === s.classCode)?.name;
                    const cycleDay = s.admissionDate ? new Date(s.admissionDate).getDate() : 1;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({cls}) — Cycle: {cycleDay}th of month
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input 
                    type="number"
                    className="form-input"
                    required
                    placeholder="e.g. 1250"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                    <option value="CASH">Cash at Counter</option>
                    <option value="BANK">Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">UPI Reference / Cheque No / Notes</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. UPI-984712093"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </div>

              <div className="modal-actions-flex">
                <button type="button" className="btn btn-secondary" onClick={() => setFeeCollectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  <Receipt size={16} />
                  <span>Confirm & Generate Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Professional Fee Receipt Modal */}
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
                  Classes 1 to X (State, CBSE & ICSE) • 📞 9848266892 / 9849473251 • ✉️ hayagrivatutorials9@gmail.com
                </div>
                <div className="tuition-maths-tag">
                  ★ SPECIAL FOCUS ON MATHEMATICS: Strong Concepts • Smart Methods • Better Results
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
                <div className="student-line">
                  <span className="meta-label">Student Name:</span>
                  <span className="meta-val font-bold">{activeReceipt.studentName}</span>
                </div>
                <div className="student-line">
                  <span className="meta-label">Class / Standard:</span>
                  <span className="meta-val">
                    {classes.find(c => c.code === activeReceipt.classCode)?.name || activeReceipt.classCode}
                  </span>
                </div>
                <div className="student-line">
                  <span className="meta-label">Billing Period:</span>
                  <span className="meta-val">{activeReceipt.monthYear}</span>
                </div>
                <div className="student-line">
                  <span className="meta-label">Payment Mode:</span>
                  <span className="meta-val font-semibold">{activeReceipt.mode} ({activeReceipt.transactionRef || 'OFFLINE'})</span>
                </div>
              </div>

              <table className="receipt-breakdown-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tuition & Study Material Charges ({activeReceipt.monthYear})</td>
                    <td style={{ textAlign: 'right' }} className="font-bold">
                      ₹{Number(activeReceipt.amount).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="receipt-total-row">
                <span>Total Received:</span>
                <span className="text-lg font-bold">₹{Number(activeReceipt.amount).toLocaleString('en-IN')}.00</span>
              </div>

              <div className="receipt-signatures-grid">
                <div className="signature-box">
                  <div className="sig-line" />
                  <span className="sig-label">Parent / Student Signature</span>
                </div>
                <div className="signature-box">
                  <div className="stamp-box">PAID STAMP</div>
                  <div className="sig-line" />
                  <span className="sig-label">Authorized Signatory</span>
                </div>
              </div>

              <div className="receipt-footer-note">
                * Note: Fees once paid are non-refundable. This is a computer-generated institutional receipt.
              </div>
            </div>

            <div className="receipt-modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>Print Receipt</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fees-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .fees-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .fee-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .fee-kpi-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .text-rose { color: #FB7185; }
        .text-amber { color: #FBBF24; }

        .view-mode-tabs-wrapper {
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 2px;
        }
        .view-mode-tabs {
          display: flex;
          gap: 10px;
        }
        .view-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          background: transparent;
          border: 1px solid transparent;
          border-bottom: none;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .view-tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-subtle);
        }
        .view-tab-btn.active {
          color: white;
          background: var(--bg-card);
          border-color: var(--border-subtle);
          box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
        }
        .tab-alert-badge {
          background: var(--rose-600);
          color: white;
          padding: 1px 7px;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 700;
        }

        .cycle-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: rgba(255,255,255,0.04);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .pulse-badge {
          animation: pulseAnim 2s infinite ease-in-out;
        }
        @keyframes pulseAnim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.96); }
        }

        .pill-danger {
          color: #FB7185 !important;
        }
        .pill-danger.active {
          background: var(--rose-600) !important;
          color: white !important;
        }
        .pill-warning {
          color: #FBBF24 !important;
        }
        .pill-warning.active {
          background: var(--amber-600) !important;
          color: white !important;
        }
        .pill-success {
          color: #34D399 !important;
        }
        .pill-success.active {
          background: var(--emerald-600) !important;
          color: white !important;
        }

        .whatsapp-btn-icon {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          font-size: 0.75rem;
          text-decoration: none;
        }

        /* Professional Receipt Paper Styling */
        .receipt-modal-content {
          max-width: 650px;
          background: #0f172a;
        }
        .receipt-paper {
          background: #ffffff;
          color: #0f172a;
          border-radius: var(--radius-md);
          padding: 28px;
          margin-top: 14px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          font-family: var(--font-body);
        }
        .receipt-banner {
          text-align: center;
        }
        .tuition-logo-title {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #1e1b4b;
        }
        .tuition-motto {
          font-size: 0.725rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #4338CA;
          margin-bottom: 3px;
        }
        .tuition-address {
          font-size: 0.775rem;
          color: #475569;
          font-weight: 600;
        }
        .tuition-contact {
          font-size: 0.725rem;
          color: #64748b;
          margin-top: 2px;
        }
        .tuition-maths-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #b45309;
          margin-top: 4px;
        }
        .receipt-divider-dashed {
          border-bottom: 2px dashed #cbd5e1;
          margin: 16px 0;
        }
        .receipt-meta-grid {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
          margin-bottom: 14px;
        }
        .meta-label {
          color: #64748b;
          margin-right: 6px;
          font-size: 0.8rem;
        }
        .meta-val {
          color: #0f172a;
        }
        .receipt-student-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 0.84rem;
        }
        .receipt-breakdown-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
          margin-bottom: 14px;
        }
        .receipt-breakdown-table th {
          background: #f1f5f9;
          padding: 8px 12px;
          border-bottom: 1px solid #cbd5e1;
          text-align: left;
          color: #334155;
        }
        .receipt-breakdown-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f1f5f9;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 1.05rem;
          color: #047857;
          margin-bottom: 24px;
        }
        .receipt-signatures-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 30px;
          padding: 0 10px;
        }
        .signature-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 180px;
        }
        .sig-line {
          width: 100%;
          border-bottom: 1px solid #94a3b8;
          margin-bottom: 6px;
        }
        .sig-label {
          font-size: 0.725rem;
          color: #64748b;
        }
        .stamp-box {
          border: 2px solid #059669;
          color: #059669;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.675rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          transform: rotate(-5deg);
        }
        .receipt-footer-note {
          font-size: 0.675rem;
          color: #94a3b8;
          text-align: center;
          margin-top: 18px;
        }
        .receipt-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
