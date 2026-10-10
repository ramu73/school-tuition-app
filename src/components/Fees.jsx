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
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  calculateStudentFeeCycle, 
  generateFeeReminderWhatsAppUrl, 
  generateFeeReminderMessage,
  computeFinancialSummary
} from '../lib/feeCycle';
import { generateNextId } from '../lib/storage';
import { logger } from '../lib/logger';
import { deletePaymentReceiptFromSupabase } from '../lib/supabase';
import HayagrivaLogo from './HayagrivaLogo';


export default function Fees({ 
  data, 
  onSaveData, 
  feeCollectModalOpen, 
  setFeeCollectModalOpen,
  currentUser
}) {
  const { fees = [], students = [], classes = [], receipts = [] } = data;

  const [viewMode, setViewMode] = useState('cycles'); // 'cycles', 'ledger', or 'receipts'
  const [cycleFilter, setCycleFilter] = useState('ALL'); // ALL, OVERDUE, DUE_TODAY, UPCOMING, PAID
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DEFAULTERS, PARTIAL, PAID
  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState('CURRENT'); // 'CURRENT' or 'ALL'
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Selected receipt for printable modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Undo Payment Confirmation Modal State
  const [undoModalData, setUndoModalData] = useState(null);

  // Collect Fee Modal State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [feeNotes, setFeeNotes] = useState('');
  const [feeErrors, setFeeErrors] = useState({});

  // Compute Universal Financial Summary (Single Source of Truth)
  const financialSummary = computeFinancialSummary(students, fees, receipts);
  const {
    currentMonth,
    activeStudents,
    monthlyBilled: totalBilled,
    monthlyCollected,
    monthlyPending: totalOutstanding,
    collectionRate,
    studentFeeCycles,
    dueOrOverdue,
    defaultersCount,
    overdueCycles,
    dueCycles,
    dueTodayCycles,
    upcomingCycles,
    paidCycles
  } = financialSummary;

  // Handle student selection in Collect Fee modal
  const handleStudentSelect = (studentId) => {
    const sId = Number(studentId);
    setSelectedStudentId(sId);
    const cycle = studentFeeCycles.find(c => c.studentId === sId);
    if (cycle && cycle.balance > 0) {
      setPaymentAmount(cycle.balance);
    } else {
      const student = students.find(s => s.id === sId);
      setPaymentAmount(student?.monthlyFee || 2000);
    }
  };

  // Copy SMS / WhatsApp message to clipboard
  const handleCopyMessage = (cycleInfo) => {
    const msg = generateFeeReminderMessage(cycleInfo, 'HAYAGRIVA TUTORIALS');
    navigator.clipboard.writeText(msg);
    setCopiedId(cycleInfo.studentId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Submit Payment Collection
  const handleProcessPayment = (e) => {
    e.preventDefault();
    const errors = {};

    if (!selectedStudentId) {
      errors.selectedStudentId = 'Please select a student from the dropdown list.';
    }
    const amtNum = Number(paymentAmount);
    if (!paymentAmount || isNaN(amtNum) || amtNum <= 0) {
      errors.paymentAmount = 'Please enter a valid payment amount greater than ₹0.';
    } else if (amtNum > 100000) {
      errors.paymentAmount = 'Amount exceeds maximum single transaction limit (₹100,000).';
    }

    if (Object.keys(errors).length > 0) {
      setFeeErrors(errors);
      logger.warn(logger.CATEGORIES.VALIDATION, 'Fee payment validation failed', { errors, studentId: selectedStudentId });
      return;
    }

    const sId = Number(selectedStudentId);
    const student = students.find(s => s.id === sId);
    const amountNum = Number(paymentAmount);
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

    logger.action(currentUser, 'RECORD_FEE_PAYMENT', `Collected ₹${amountNum} fee for student "${newReceipt.studentName}" via ${paymentMode}`, {
      studentId: sId,
      receiptNo: receiptNumber,
      amount: amountNum,
      mode: paymentMode
    });

    setFeeCollectModalOpen(false);
    setSelectedStudentId('');
    setPaymentAmount('');
    setTransactionRef('');
    setFeeNotes('');
    setFeeErrors({});
    setActiveReceipt(newReceipt);
  };

  // Handle request to undo a payment for a student
  const handleRequestUndoForStudent = (studentId, monthYear) => {
    const sId = Number(studentId);
    const student = students.find(s => s.id === sId);

    // Find matching receipt for this student in this month or latest receipt
    const studentReceipt = (receipts || []).find(r => 
      Number(r.studentId) === sId && (r.monthYear === monthYear || !monthYear)
    ) || (receipts || []).find(r => Number(r.studentId) === sId);

    const feeRecord = (fees || []).find(f => f.studentId === sId && (f.monthYear === monthYear || !monthYear));

    if (studentReceipt) {
      setUndoModalData(studentReceipt);
    } else if (feeRecord && Number(feeRecord.amountPaid) > 0) {
      // Synthesize receipt data from feeRecord if receipt object is missing
      setUndoModalData({
        id: feeRecord.id,
        receiptNo: feeRecord.receiptNo || `REC-PREV-${sId}`,
        studentId: sId,
        studentName: student?.name || 'Student',
        classCode: student?.classCode || 'CLASS_10',
        amount: Number(feeRecord.amountPaid),
        monthYear: feeRecord.monthYear || currentMonth,
        date: feeRecord.lastPaymentDate || new Date().toISOString().split('T')[0],
        mode: feeRecord.paymentMode || 'OFFLINE',
        isSynthesized: true
      });
    }
  };

  // Confirm and execute the undo payment operation
  const handleConfirmUndoPayment = async (receiptToUndo) => {
    if (!receiptToUndo) return;

    const sId = Number(receiptToUndo.studentId);
    const amountNum = Number(receiptToUndo.amount);
    const mYear = receiptToUndo.monthYear || currentMonth;

    // 1. Remove receipt from receipts array
    const updatedReceipts = (receipts || []).filter(r => 
      r.receiptNo !== receiptToUndo.receiptNo && r.id !== receiptToUndo.id
    );

    // 2. Update fee record
    let updatedFees = [...fees];
    const feeIndex = updatedFees.findIndex(f => 
      f.studentId === sId && (f.monthYear === mYear || f.receiptNo === receiptToUndo.receiptNo)
    );

    if (feeIndex >= 0) {
      const currentFee = updatedFees[feeIndex];
      const newPaid = Math.max(0, Number(currentFee.amountPaid) - amountNum);
      const newBalance = Math.max(0, Number(currentFee.amountDue) - newPaid);
      const newStatus = newPaid === 0 ? 'PENDING' : (newBalance === 0 ? 'PAID' : 'PARTIAL');

      // Check remaining receipts for this student
      const remainingStudentReceipts = updatedReceipts.filter(r => Number(r.studentId) === sId);
      const latestReceipt = remainingStudentReceipts[0];

      updatedFees[feeIndex] = {
        ...currentFee,
        amountPaid: newPaid,
        balance: newBalance,
        status: newStatus,
        lastPaymentDate: latestReceipt?.date || null,
        receiptNo: latestReceipt?.receiptNo || null
      };
    }

    // 3. Immediately save updated data
    onSaveData({
      ...data,
      fees: updatedFees,
      receipts: updatedReceipts
    });

    // 4. Also delete from Supabase in background if receiptNo exists
    if (receiptToUndo.receiptNo && !receiptToUndo.isSynthesized) {
      deletePaymentReceiptFromSupabase(receiptToUndo.receiptNo).catch(() => {});
    }

    // 5. Audit logger
    logger.action(
      currentUser,
      'UNDO_FEE_PAYMENT',
      `Undid mistaken payment of ₹${amountNum} (Receipt: ${receiptToUndo.receiptNo}) for student "${receiptToUndo.studentName}"`,
      {
        studentId: sId,
        receiptNo: receiptToUndo.receiptNo,
        amount: amountNum
      }
    );

    // 6. Close modals
    setUndoModalData(null);
    if (activeReceipt && (activeReceipt.receiptNo === receiptToUndo.receiptNo || activeReceipt.id === receiptToUndo.id)) {
      setActiveReceipt(null);
    }
  };

  // Filter cycles
  const filteredCycles = studentFeeCycles.filter(item => {
    if (classFilter !== 'ALL' && item.classCode !== classFilter) return false;
    if (cycleFilter !== 'ALL') {
      if ((cycleFilter === 'DUE' || cycleFilter === 'DUE_TODAY') && (item.cycleStatus !== 'DUE_TODAY' && item.cycleStatus !== 'DUE')) return false;
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

  // Construct Ledger Items (Current Month dynamic ledger vs Historical raw records)
  const currentMonthLedgerItems = activeStudents.map(student => {
    const sId = Number(student.id);
    const cycle = studentFeeCycles.find(c => c.studentId === sId);
    const feeRecord = fees.find(f => f.studentId === sId && f.monthYear === currentMonth);
    const studentReceipt = (receipts || []).find(r => {
      if (Number(r.studentId) !== sId) return false;
      if (r.monthYear === currentMonth) return true;
      if (r.date) {
        const d = new Date(r.date);
        return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
      }
      return false;
    });

    const amountDue = cycle?.amountDue || Number(student.monthlyFee || 2000);
    const amountPaid = cycle?.amountPaid || 0;
    const balance = cycle?.balance !== undefined ? cycle.balance : amountDue;
    const status = balance === 0 && amountPaid > 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'PENDING');

    return {
      id: feeRecord?.id || `cur-${sId}`,
      studentId: sId,
      student,
      monthYear: currentMonth,
      amountDue,
      amountPaid,
      balance,
      status,
      receipt: studentReceipt,
      receiptNo: studentReceipt?.receiptNo || feeRecord?.receiptNo || null,
      cycleDay: cycle?.cycleDay || 1,
      cycleStatus: cycle?.cycleStatus || 'DUE'
    };
  });

  const rawHistoricalLedgerItems = fees.map(f => {
    const student = students.find(s => s.id === f.studentId);
    const receipt = receipts.find(r => r.receiptNo === f.receiptNo || (r.studentId === f.studentId && r.monthYear === f.monthYear));
    const cycleDay = student?.admissionDate ? new Date(student.admissionDate).getDate() : 1;
    return {
      id: f.id,
      studentId: f.studentId,
      student,
      monthYear: f.monthYear,
      amountDue: Number(f.amountDue),
      amountPaid: Number(f.amountPaid),
      balance: Number(f.balance),
      status: f.status,
      receipt,
      receiptNo: receipt?.receiptNo || f.receiptNo || null,
      cycleDay,
      cycleStatus: f.status === 'PAID' ? 'PAID' : 'DUE'
    };
  });

  const activeLedgerItems = selectedLedgerMonth === 'CURRENT' ? currentMonthLedgerItems : rawHistoricalLedgerItems;

  // Filter general ledger
  const filteredFees = activeLedgerItems.filter(item => {
    if (!item.student) return false;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING' && item.status !== 'PENDING') return false;
      if (statusFilter === 'PARTIAL' && item.status !== 'PARTIAL') return false;
      if (statusFilter === 'PAID' && item.status !== 'PAID') return false;
      if (statusFilter === 'DEFAULTERS' && item.balance <= 0) return false;
    }
    if (classFilter !== 'ALL' && item.student.classCode !== classFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.student.name || '').toLowerCase().includes(q);
      const matchRoll = (item.student.admissionNo || '').toLowerCase().includes(q);
      return matchName || matchRoll;
    }
    return true;
  });

  // Filter payment receipts
  const filteredReceipts = (receipts || []).filter(r => {
    if (classFilter !== 'ALL' && r.classCode !== classFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.studentName || '').toLowerCase().includes(q);
      const matchRec = (r.receiptNo || '').toLowerCase().includes(q);
      const matchRef = (r.transactionRef || '').toLowerCase().includes(q);
      return matchName || matchRec || matchRef;
    }
    return true;
  });

  return (
    <div className="fees-page">
      {/* Top Header */}
      <div className="fees-header">
        <div>
          <h1 className="page-title">Tuition Fees &amp; Parent Reminders</h1>
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

      {/* KPI Cards: Single Source of Truth */}
      <div className="fee-kpi-grid">
        <div className="glass-card fee-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Monthly Billed ({currentMonth})</span>
            <Building size={18} className="text-primary" />
          </div>
          <div className="kpi-value">₹{totalBilled.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted">Total expected from Class 1–10</div>
        </div>

        <div className="glass-card fee-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Fees Collected ({currentMonth})</span>
            <CheckCircle2 size={18} className="text-emerald" />
          </div>
          <div className="kpi-value text-emerald">₹{monthlyCollected.toLocaleString('en-IN')}</div>
          <div className="text-xs text-emerald font-semibold">{collectionRate}% Recovery Rate • {paidCycles.length} Cleared</div>
        </div>

        <div className="glass-card fee-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Pending Dues ({currentMonth})</span>
            <AlertCircle size={18} className="text-rose" />
          </div>
          <div className="kpi-value text-rose">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-rose font-semibold">
            {defaultersCount} Students Due (₹{dueOrOverdue.reduce((sum, c) => sum + c.balance, 0).toLocaleString('en-IN')})
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
            {(dueCycles.length > 0 || overdueCycles.length > 0) && (
              <span className="tab-alert-badge">{dueCycles.length + overdueCycles.length}</span>
            )}
          </button>
          <button 
            className={`view-tab-btn ${viewMode === 'ledger' ? 'active' : ''}`}
            onClick={() => setViewMode('ledger')}
          >
            <Receipt size={16} />
            <span>Standard Monthly Ledger</span>
          </button>
          <button 
            className={`view-tab-btn ${viewMode === 'receipts' ? 'active' : ''}`}
            onClick={() => setViewMode('receipts')}
          >
            <RotateCcw size={16} />
            <span>Receipts &amp; Payment History ({receipts.length})</span>
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
                  className={`pill-btn pill-warning ${cycleFilter === 'DUE' ? 'active' : ''}`}
                  onClick={() => setCycleFilter('DUE')}
                >
                  <Bell size={13} />
                  <span>Due ({dueCycles.length})</span>
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
                    const rawClassName = classes.find(c => c.code === item.classCode)?.name || item.classCode;
                    const className = (rawClassName || '').replace(/\s*\(SSC\/CBSE\)/gi, '').trim();
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
                          {item.cycleStatus === 'DUE' && (
                            <span className="badge badge-warning">Due ({item.cycleDay}th)</span>
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
                          <div className="action-buttons-flex" style={{ justifyContent: 'center' }}>
                            {item.balance > 0 && (
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  handleStudentSelect(item.studentId);
                                  setFeeCollectModalOpen(true);
                                }}
                              >
                                Collect
                              </button>
                            )}
                            {item.balance <= 0 && (
                              <span className="badge badge-success">
                                <Check size={12} />
                                <span>Paid</span>
                              </span>
                            )}
                            {Number(item.amountPaid) > 0 && (
                              <button 
                                className="undo-action-btn"
                                title="Undo Mistaken Payment"
                                onClick={() => handleRequestUndoForStudent(item.studentId, item.cycleMonth)}
                              >
                                <RotateCcw size={12} />
                                <span>Undo</span>
                              </button>
                            )}
                          </div>
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
                  All ({activeLedgerItems.length})
                </button>
                <button 
                  className={`pill-btn ${statusFilter === 'DEFAULTERS' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('DEFAULTERS')}
                >
                  Pending Dues ({activeLedgerItems.filter(f => f.balance > 0).length})
                </button>
                <button 
                  className={`pill-btn ${statusFilter === 'PARTIAL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PARTIAL')}
                >
                  Partial Paid ({activeLedgerItems.filter(f => f.status === 'PARTIAL').length})
                </button>
                <button 
                  className={`pill-btn ${statusFilter === 'PAID' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PAID')}
                >
                  Fully Cleared ({activeLedgerItems.filter(f => f.status === 'PAID').length})
                </button>
              </div>

              <div className="class-filter-box" style={{ display: 'flex', gap: '8px' }}>
                <select 
                  className="form-select select-class-sm"
                  value={selectedLedgerMonth}
                  onChange={(e) => setSelectedLedgerMonth(e.target.value)}
                  title="Choose Billing Period"
                >
                  <option value="CURRENT">Current Cycle ({currentMonth})</option>
                  <option value="ALL">All Database Records ({fees.length})</option>
                </select>

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
                    const student = fee.student || students.find(s => s.id === fee.studentId);
                    const rawClassName = classes.find(c => c.code === student?.classCode)?.name || student?.classCode || 'Class';
                    const className = (rawClassName || '').replace(/\s*\(SSC\/CBSE\)/gi, '').trim();
                    const receipt = fee.receipt || receipts.find(r => r.receiptNo === fee.receiptNo || (r.studentId === fee.studentId && r.monthYear === fee.monthYear));
                    const cycleDay = fee.cycleDay || (student?.admissionDate ? new Date(student.admissionDate).getDate() : 1);

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
                          <div className="action-buttons-flex" style={{ justifyContent: 'center' }}>
                            {fee.balance > 0 && (
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  handleStudentSelect(student?.id);
                                  setFeeCollectModalOpen(true);
                                }}
                              >
                                Collect
                              </button>
                            )}
                            {fee.balance <= 0 && (
                              <span className="badge badge-success">
                                <Check size={12} />
                                <span>Cleared</span>
                              </span>
                            )}
                            {Number(fee.amountPaid) > 0 && (
                              <button 
                                className="undo-action-btn"
                                title="Undo Mistaken Payment"
                                onClick={() => handleRequestUndoForStudent(student?.id, fee.monthYear)}
                              >
                                <RotateCcw size={12} />
                                <span>Undo</span>
                              </button>
                            )}
                          </div>
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

      {/* VIEW 3: PAYMENT RECEIPTS & TRANSACTION HISTORY */}
      {viewMode === 'receipts' && (
        <div className="receipts-view-container">
          <div className="glass-card fee-filters-card">
            <div className="filters-row">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">
                  Total Issued Receipts: <strong className="text-primary">{filteredReceipts.length}</strong>
                </span>
                <span className="text-xs text-muted">
                  (Total Collected: ₹{filteredReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString('en-IN')})
                </span>
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
                  placeholder="Search receipt #, student, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Student &amp; Standard</th>
                  <th>Payment Date</th>
                  <th>Billing Month</th>
                  <th>Amount Paid</th>
                  <th>Payment Mode &amp; Ref</th>
                  <th style={{ textAlign: 'center' }}>Print Receipt</th>
                  <th style={{ textAlign: 'center' }}>Undo / Revert</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No payment receipts found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((rec) => {
                    const rawClassName = classes.find(c => c.code === rec.classCode)?.name || rec.classCode || 'Class';
                    const className = (rawClassName || '').replace(/\s*\(SSC\/CBSE\)/gi, '').trim();

                    return (
                      <tr key={rec.id || rec.receiptNo}>
                        <td>
                          <span className="font-mono font-bold text-primary">{rec.receiptNo}</span>
                        </td>
                        <td>
                          <div className="font-semibold">{rec.studentName}</div>
                          <span className="badge badge-class">{className}</span>
                        </td>
                        <td className="font-mono text-xs">{rec.date}</td>
                        <td className="text-xs font-semibold">{rec.monthYear}</td>
                        <td className="text-emerald font-bold">
                          ₹{Number(rec.amount).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span className="badge badge-surface">{rec.mode}</span>
                          {rec.transactionRef && (
                            <div className="text-xs text-muted font-mono mt-0.5">{rec.transactionRef}</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setActiveReceipt(rec)}
                            title="View and Print Official Institutional Receipt"
                          >
                            <Printer size={13} />
                            <span>Print</span>
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="undo-action-btn"
                            onClick={() => setUndoModalData(rec)}
                            title="Undo this payment and reverse fee status"
                          >
                            <RotateCcw size={13} />
                            <span>Undo Payment</span>
                          </button>
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
              {Object.keys(feeErrors).length > 0 && (
                <div className="form-error-banner" style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ Please fix the highlighted fields to record fee payment.
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Select Student (Class 1 to 10) *</label>
                <select 
                  className={`form-select ${feeErrors.selectedStudentId ? 'input-error' : ''}`}
                  value={selectedStudentId}
                  onChange={(e) => {
                    handleStudentSelect(e.target.value);
                    if (feeErrors.selectedStudentId) setFeeErrors(prev => ({ ...prev, selectedStudentId: null }));
                  }}
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
                {feeErrors.selectedStudentId && (
                  <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {feeErrors.selectedStudentId}
                  </span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input 
                    type="number"
                    className={`form-input ${feeErrors.paymentAmount ? 'input-error' : ''}`}
                    placeholder="e.g. 1250"
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value);
                      if (feeErrors.paymentAmount) setFeeErrors(prev => ({ ...prev, paymentAmount: null }));
                    }}
                  />
                  {feeErrors.paymentAmount && (
                    <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {feeErrors.paymentAmount}
                    </span>
                  )}
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
                <button type="button" className="btn btn-secondary" onClick={() => { setFeeCollectModalOpen(false); setFeeErrors({}); }}>
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
                  <div className="tuition-logo-title">
                    <span className="brand-name-hayagriva">HAYAGRIVA</span>
                    <span className="brand-name-tutorials"> TUTORIALS</span>
                  </div>
                </div>
                <div className="tuition-motto brand-tagline-motto">LEARN • GROW • SUCCEED</div>
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
              <button 
                type="button"
                className="btn-undo-receipt"
                onClick={() => setUndoModalData(activeReceipt)}
                title="Undo this payment and reverse fee status"
              >
                <RotateCcw size={16} />
                <span>Undo Payment</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Payment Confirmation Modal */}
      {undoModalData && (
        <div className="modal-overlay">
          <div className="modal-content undo-confirm-modal">
            <div className="modal-header">
              <div className="flex items-center gap-2 text-rose">
                <AlertTriangle size={20} />
                <h2 className="modal-title text-rose">Undo Fee Payment Confirmation</h2>
              </div>
              <button className="close-btn" onClick={() => setUndoModalData(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="undo-modal-body">
              <div className="undo-alert-box">
                <p>
                  Are you sure you want to <strong>undo and revert</strong> this fee payment?
                </p>
                <p className="text-xs text-muted mt-1">
                  This action will remove the payment receipt, restore the student's due balance, mark their fee status back to <strong>Pending / Due</strong>, and adjust monthly collection totals.
                </p>
              </div>

              <div className="undo-details-card">
                <div className="undo-detail-row">
                  <span className="undo-detail-label">Student Name:</span>
                  <span className="undo-detail-value font-bold">{undoModalData.studentName}</span>
                </div>
                <div className="undo-detail-row">
                  <span className="undo-detail-label">Receipt Number:</span>
                  <span className="undo-detail-value font-mono">{undoModalData.receiptNo}</span>
                </div>
                <div className="undo-detail-row">
                  <span className="undo-detail-label">Amount Paid:</span>
                  <span className="undo-detail-value font-bold text-rose">₹{Number(undoModalData.amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="undo-detail-row">
                  <span className="undo-detail-label">Payment Date:</span>
                  <span className="undo-detail-value font-mono">{undoModalData.date}</span>
                </div>
                <div className="undo-detail-row">
                  <span className="undo-detail-label">Payment Mode:</span>
                  <span className="undo-detail-value">{undoModalData.mode}</span>
                </div>
                {undoModalData.monthYear && (
                  <div className="undo-detail-row">
                    <span className="undo-detail-label">Billing Cycle:</span>
                    <span className="undo-detail-value">{undoModalData.monthYear}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer flex justify-between gap-3">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setUndoModalData(null)}
              >
                Cancel / Keep Payment
              </button>
              <button 
                type="button" 
                className="btn btn-danger flex items-center gap-2"
                onClick={() => handleConfirmUndoPayment(undoModalData)}
              >
                <RotateCcw size={16} />
                <span>Yes, Undo Payment</span>
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
        .fee-filters-card {
          padding: 14px 18px;
          margin-bottom: 20px;
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }
        .filters-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .status-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .pill-btn:hover {
          color: var(--text-primary);
          border-color: var(--primary-500);
          background: rgba(99, 102, 241, 0.12);
        }
        .pill-btn.active {
          background: var(--primary-600);
          border-color: var(--primary-500);
          color: white;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
        }
        .pill-danger {
          color: #FB7185;
          border-color: rgba(244, 63, 94, 0.3);
        }
        .pill-danger:hover {
          background: rgba(244, 63, 94, 0.12);
          border-color: #FB7185;
        }
        .pill-danger.active {
          background: var(--rose-600) !important;
          border-color: var(--rose-500) !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(225, 29, 72, 0.4);
        }
        .pill-warning {
          color: #FBBF24;
          border-color: rgba(245, 158, 11, 0.3);
        }
        .pill-warning:hover {
          background: rgba(245, 158, 11, 0.12);
          border-color: #FBBF24;
        }
        .pill-warning.active {
          background: var(--amber-600) !important;
          border-color: var(--amber-500) !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
        }
        .pill-success {
          color: #34D399;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .pill-success:hover {
          background: rgba(16, 185, 129, 0.12);
          border-color: #34D399;
        }
        .pill-success.active {
          background: var(--emerald-600) !important;
          border-color: var(--emerald-500) !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
        }
        .class-filter-box {
          flex-shrink: 0;
        }
        .select-class-sm {
          width: auto;
          min-width: 190px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 7px 12px;
          color: var(--text-primary);
          font-size: 0.8125rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }
        .select-class-sm:focus {
          border-color: var(--primary-500);
        }
        .search-box-wrapper {
          flex: 1;
          min-width: 220px;
          max-width: 320px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 7px 12px 7px 36px;
          color: var(--text-primary);
          font-size: 0.8125rem;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.2s ease;
        }
        .search-input:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
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
          color: #052B76;
        }
        .tuition-motto {
          font-size: 0.725rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #052B76;
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

        .undo-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #FB7185;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .undo-action-btn:hover {
          background: rgba(244, 63, 94, 0.22);
          border-color: #FB7185;
          color: #FFF;
          box-shadow: 0 2px 6px rgba(244, 63, 94, 0.2);
        }

        .btn-undo-receipt {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: #FB7185;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-undo-receipt:hover {
          background: #E11D48;
          color: white;
          border-color: #BE123C;
          box-shadow: 0 2px 8px rgba(225, 29, 72, 0.35);
        }

        .undo-confirm-modal {
          max-width: 480px;
        }
        .undo-modal-body {
          padding: 16px 0;
        }
        .undo-alert-box {
          background: rgba(244, 63, 94, 0.1);
          border-left: 4px solid #F43F5E;
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-bottom: 16px;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .undo-details-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .undo-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
        }
        .undo-detail-label {
          color: var(--text-secondary);
        }
        .undo-detail-value {
          color: var(--text-primary);
        }

        /* Mobile Responsive Layout for Fees */
        @media (max-width: 768px) {
          .fees-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .fees-header .btn {
            width: 100%;
          }
          .fee-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .fee-kpi-card {
            padding: 14px 12px;
          }
          .fee-kpi-card .kpi-value {
            font-size: 1.35rem;
          }
          .view-mode-tabs-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .view-mode-tabs {
            min-width: max-content;
          }
          .view-tab-btn {
            padding: 8px 12px;
            font-size: 0.775rem;
          }
          .fee-filters-card {
            padding: 12px 10px;
          }
          .filters-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .status-pills {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
          }
          .pill-btn {
            padding: 5px 10px;
            font-size: 0.75rem;
            flex-shrink: 0;
          }
          .class-filter-box {
            width: 100%;
          }
          .select-class-sm {
            width: 100%;
            min-width: 100%;
          }
          .search-box-wrapper {
            width: 100%;
            min-width: 100%;
            max-width: 100%;
          }
          .action-buttons-flex {
            flex-direction: row;
            gap: 4px;
          }
          .whatsapp-btn-icon {
            padding: 4px 8px;
            font-size: 0.7rem;
          }
        }

        @media (max-width: 420px) {
          .fee-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
