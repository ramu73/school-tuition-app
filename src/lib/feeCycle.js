// ==========================================================================
// Fee Notification & Joining Date Cycle Engine
// Hayagriva Tutorials Financial Calculation Single Source of Truth
// Computes monthly fee due dates based on student admission/joining date
// ==========================================================================

/**
 * Calculates a single student's fee cycle and balance for a given reference date
 */
export function calculateStudentFeeCycle(
  student, 
  feeRecord = null, 
  referenceDate = new Date(), 
  lastPaymentDate = null,
  receiptsAmountForMonth = 0
) {
  const joiningDateStr = (student.admissionDate || student.admission_date || student.joiningDate || '2026-01-01').split('T')[0];
  const [jYear, jMonth, jDay] = joiningDateStr.split('-').map(Number);
  const joiningDate = new Date(jYear, (jMonth || 1) - 1, jDay || 1);
  const cycleDay = jDay || joiningDate.getDate() || 1;

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-indexed
  const currentDay = referenceDate.getDate();

  const today = new Date(currentYear, currentMonth, currentDay);

  // Helper to compute actual cycle date for a given year and month (handling variable days in month)
  const getCycleDate = (y, m) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const actualDay = Math.min(cycleDay, daysInMonth);
    return new Date(y, m, actualDay);
  };

  const cycleThisMonth = getCycleDate(currentYear, currentMonth);
  const cyclePrevMonth = getCycleDate(currentYear, currentMonth - 1);
  const cycleNextMonth = getCycleDate(currentYear, currentMonth + 1);

  const monthlyFee = Number(student.monthlyFee || student.monthly_fee || 0) || (feeRecord ? Number(feeRecord.amountDue || feeRecord.amount_due || 0) : 2000);
  const amountDue = feeRecord ? Number(feeRecord.amountDue || feeRecord.amount_due || monthlyFee) : monthlyFee;
  
  const recordPaid = feeRecord ? Number(feeRecord.amountPaid || feeRecord.amount_paid || 0) : 0;
  const amountPaid = Math.max(recordPaid, Number(receiptsAmountForMonth || 0));
  const balance = Math.max(amountDue - amountPaid, 0);

  const payDateStr = lastPaymentDate || feeRecord?.lastPaymentDate || feeRecord?.last_payment_date || student?.lastPaymentDate || null;
  const payDate = payDateStr ? (() => {
    const [pY, pM, pD] = String(payDateStr).split('T')[0].split('-').map(Number);
    return new Date(pY, (pM || 1) - 1, pD || 1);
  })() : null;

  // Determine if previous cycle was paid:
  const prevCyclePaid = (() => {
    if (joiningDate.getTime() > cyclePrevMonth.getTime()) return true;
    if (payDate && payDate.getTime() >= cyclePrevMonth.getTime()) return true;
    if (feeRecord && Number(feeRecord.balance) === 0 && Number(feeRecord.amountPaid || feeRecord.amount_paid || 0) > 0) return true;
    return false;
  })();

  const isPaid = (balance === 0 && amountPaid > 0);

  let activeDueDate;
  let cycleStatus = 'UPCOMING'; // UPCOMING, DUE_TODAY, DUE, OVERDUE, PAID

  if (isPaid) {
    activeDueDate = cycleNextMonth;
    cycleStatus = 'PAID';
  } else if (today.getTime() < cycleThisMonth.getTime()) {
    // Today is before this month's cycle day (e.g. today is Oct 3, student cycle is Oct 6)
    const daysSincePrev = Math.round((today.getTime() - cyclePrevMonth.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilThis = Math.round((cycleThisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Overdue only if previous month's cycle was missed and unpaid
    if (!prevCyclePaid && daysSincePrev < daysUntilThis) {
      activeDueDate = cyclePrevMonth;
      cycleStatus = 'OVERDUE';
    } else {
      activeDueDate = cycleThisMonth;
      cycleStatus = 'UPCOMING';
    }
  } else if (today.getTime() === cycleThisMonth.getTime()) {
    activeDueDate = cycleThisMonth;
    cycleStatus = 'DUE_TODAY';
  } else {
    // Cycle day in current month has arrived/passed (e.g. today is Oct 3, cycle was Oct 1 or 2)
    activeDueDate = cycleThisMonth;
    cycleStatus = 'DUE'; // Current month due, not overdue
  }

  // Calculate day difference relative to active due date
  const diffTime = activeDueDate.getTime() - today.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const pad = (n) => String(n).padStart(2, '0');
  const dueDateStr = `${activeDueDate.getFullYear()}-${pad(activeDueDate.getMonth() + 1)}-${pad(activeDueDate.getDate())}`;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYearLabel = `${monthNames[activeDueDate.getMonth()]} ${activeDueDate.getFullYear()}`;

  return {
    studentId: Number(student.id),
    studentName: student.name,
    classCode: student.classCode || student.class_code,
    admissionNo: student.admissionNo || student.admission_no,
    parentName: student.parentName || student.parent_name,
    parentPhone: student.parentPhone || student.parent_phone,
    joiningDate: joiningDateStr,
    cycleDay: activeDueDate.getDate(),
    dueDateStr,
    formattedDueDate: activeDueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    monthYearLabel,
    cycleMonth: monthYearLabel,
    amountDue,
    amountPaid,
    balance,
    cycleStatus,
    daysDiff, // negative if overdue/due passed, 0 if today, positive if upcoming
    isPaid,
    lastPaymentDate: payDateStr
  };
}

/**
 * Universal Financial Summary Engine
 * Single Source of Truth for Dashboard, Fees tab, and Student records
 */
export function computeFinancialSummary(
  students = [], 
  fees = [], 
  receipts = [], 
  referenceDate = new Date()
) {
  const activeStudents = (students || []).filter(s => s.status === 'ACTIVE');
  const currentMonth = referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();

  // 1. All-time collected across all receipts and verified fee payments
  const allTimeReceipts = (receipts || []).reduce((sum, r) => sum + (Number(r.amount) || Number(r.amount_paid) || 0), 0);
  const allTimeFees = (fees || []).reduce((sum, f) => sum + (Number(f.amountPaid) || Number(f.amount_paid) || 0), 0);
  const allTimeCollected = Math.max(allTimeReceipts, allTimeFees);

  // 2. Process each active student for current month
  let monthlyBilled = 0;
  let monthlyCollected = 0;

  const studentFeeCycles = activeStudents.map(student => {
    const sId = Number(student.id);
    const monthlyFee = Number(student.monthlyFee || student.monthly_fee || 0);
    monthlyBilled += monthlyFee;

    // Student receipts in current month
    const sReceipts = (receipts || []).filter(r => {
      const rStudentId = Number(r.studentId || r.student_id);
      if (rStudentId !== sId) return false;
      if (r.monthYear === currentMonth || r.month_year === currentMonth) return true;
      const dateStr = r.date || r.payment_date;
      if (dateStr) {
        const d = new Date(dateStr);
        return d.getFullYear() === refYear && d.getMonth() === refMonth;
      }
      return false;
    });

    const receiptsAmountForMonth = sReceipts.reduce((sum, r) => sum + (Number(r.amount) || Number(r.amount_paid) || 0), 0);

    // Student fee record in current month
    const feeRecord = (fees || []).find(f => {
      const fStudentId = Number(f.studentId || f.student_id);
      const fMonth = f.monthYear || f.month_year;
      return fStudentId === sId && fMonth === currentMonth;
    });

    // Last payment date (from all receipts or fee record)
    const allStudentReceipts = (receipts || [])
      .filter(r => Number(r.studentId || r.student_id) === sId && (r.date || r.payment_date))
      .sort((a, b) => new Date(b.date || b.payment_date) - new Date(a.date || a.payment_date));
    const lastPaymentDate = allStudentReceipts[0]?.date || allStudentReceipts[0]?.payment_date || feeRecord?.lastPaymentDate || feeRecord?.last_payment_date || null;

    const cycleInfo = calculateStudentFeeCycle(
      student, 
      feeRecord, 
      referenceDate, 
      lastPaymentDate, 
      receiptsAmountForMonth
    );

    monthlyCollected += cycleInfo.amountPaid;

    return cycleInfo;
  });

  const monthlyPending = Math.max(monthlyBilled - monthlyCollected, 0);
  const collectionRate = monthlyBilled > 0 ? Math.round((monthlyCollected / monthlyBilled) * 100) : 0;

  const dueCycles = studentFeeCycles.filter(c => c.cycleStatus === 'DUE' || c.cycleStatus === 'DUE_TODAY');
  const dueTodayCycles = studentFeeCycles.filter(c => c.cycleStatus === 'DUE_TODAY');
  const overdueCycles = studentFeeCycles.filter(c => c.cycleStatus === 'OVERDUE');
  const upcomingCycles = studentFeeCycles.filter(c => c.cycleStatus === 'UPCOMING');
  const paidCycles = studentFeeCycles.filter(c => c.cycleStatus === 'PAID');
  const dueOrOverdue = studentFeeCycles.filter(c => c.cycleStatus === 'DUE' || c.cycleStatus === 'DUE_TODAY' || c.cycleStatus === 'OVERDUE');
  const defaultersCount = dueOrOverdue.length;

  return {
    currentMonth,
    activeStudents,
    monthlyBilled,
    monthlyCollected,
    monthlyPending,
    collectionRate,
    allTimeCollected,
    studentFeeCycles,
    dueOrOverdue,
    defaultersCount,
    overdueCycles,
    dueCycles,
    dueTodayCycles,
    upcomingCycles,
    paidCycles
  };
}

// Generate pre-filled WhatsApp notification message text
export function generateFeeReminderMessage(cycleInfo, instituteName = 'HAYAGRIVA TUTORIALS') {
  const {
    studentName,
    formattedDueDate,
    cycleStatus
  } = cycleInfo;

  let statusNote = `This is a reminder regarding the tuition fee for ${studentName}.`;
  if (cycleStatus === 'DUE_TODAY') {
    statusNote = `This is a reminder that the tuition fee for ${studentName} is due today.`;
  } else if (cycleStatus === 'UPCOMING') {
    statusNote = `This is a reminder for the upcoming tuition fee for ${studentName}.`;
  } else if (cycleStatus === 'OVERDUE') {
    statusNote = `This is an urgent reminder that the tuition fee for ${studentName} is overdue.`;
  }

  return `Fee Reminder - ${instituteName}

${statusNote}

* Due Date: ${formattedDueDate}
* Payment Mode: Cash / UPI (PhonePe, GPay) - 9493641959

Kindly clear the pending fee at your convenience.

Thank you,
${instituteName}
Contact: +91 98482 66892`;
}

// Generate pre-filled WhatsApp notification message URL for parents
export function generateFeeReminderWhatsAppUrl(cycleInfo, instituteName = 'HAYAGRIVA TUTORIALS') {
  const message = generateFeeReminderMessage(cycleInfo, instituteName);
  const rawPhone = (cycleInfo.parentPhone || '').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
