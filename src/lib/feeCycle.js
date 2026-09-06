// ==========================================================================
// Fee Notification & Joining Date Cycle Engine
// Computes monthly fee due dates based on student admission/joining date
// ==========================================================================

export function calculateStudentFeeCycle(student, feeRecord, referenceDate = new Date()) {
  const joiningDateStr = student.admissionDate || '2026-01-01';
  const joiningDate = new Date(joiningDateStr);
  const cycleDay = joiningDate.getDate(); // e.g. 10th of every month

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-indexed
  const currentDay = referenceDate.getDate();

  // Due date for current month
  // Handles month length variations (e.g. Feb 28/29)
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const actualCycleDay = Math.min(cycleDay, daysInCurrentMonth);
  const dueDateThisMonth = new Date(currentYear, currentMonth, actualCycleDay);
  const dueDateStr = dueDateThisMonth.toISOString().split('T')[0];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYearLabel = `${monthNames[currentMonth]} ${currentYear}`;

  const amountDue = feeRecord ? Number(feeRecord.amountDue) : student.monthlyFee;
  const amountPaid = feeRecord ? Number(feeRecord.amountPaid) : 0;
  const balance = feeRecord ? Number(feeRecord.balance) : student.monthlyFee;
  const isPaid = balance === 0;

  // Compute status relative to reference date
  let cycleStatus = 'UPCOMING'; // UPCOMING, DUE_TODAY, OVERDUE, PAID
  let daysDiff = actualCycleDay - currentDay;

  if (isPaid) {
    cycleStatus = 'PAID';
  } else if (daysDiff === 0) {
    cycleStatus = 'DUE_TODAY';
  } else if (daysDiff < 0) {
    cycleStatus = 'OVERDUE';
  } else {
    cycleStatus = 'UPCOMING';
  }

  return {
    studentId: student.id,
    studentName: student.name,
    classCode: student.classCode,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    joiningDate: joiningDateStr,
    cycleDay: actualCycleDay,
    dueDateStr,
    formattedDueDate: dueDateThisMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    monthYearLabel,
    amountDue,
    amountPaid,
    balance,
    cycleStatus,
    daysDiff, // negative if overdue, 0 if today, positive if upcoming
    isPaid
  };
}

// Generate pre-filled WhatsApp notification message for parents
export function generateFeeReminderWhatsAppUrl(cycleInfo, instituteName = 'HAYAGRIVA TUTORIALS') {
  const {
    studentName,
    parentName,
    parentPhone,
    formattedDueDate,
    amountDue,
    balance,
    cycleDay,
    joiningDate,
    cycleStatus,
    daysDiff
  } = cycleInfo;

  let message = '';

  if (cycleStatus === 'OVERDUE') {
    const overdueDays = Math.abs(daysDiff);
    message = `Dear ${parentName} ji,\n\n🔔 *FEE OVERDUE REMINDER - ${instituteName}*\n\nThis is an urgent reminder that monthly tuition fee for your child *${studentName}* was due on *${formattedDueDate}* (Monthly Cycle: ${cycleDay}th of every month, based on joining date ${joiningDate}) and is now *${overdueDays} day(s) OVERDUE*.\n\nPending Balance: *₹${balance.toLocaleString('en-IN')}*\nPayment Mode: Cash / UPI (PhonePe, GPay)\n\nKindly clear the dues today.\nThank you,\n*${instituteName}*\nContact: +91 98482 66892`;
  } else if (cycleStatus === 'DUE_TODAY') {
    message = `Dear ${parentName} ji,\n\n📢 *FEE DUE TODAY - ${instituteName}*\n\nThis is a friendly reminder that monthly tuition fee for your child *${studentName}* is *DUE TODAY (${formattedDueDate})* based on their joining date (${cycleDay}th of every month).\n\nDue Amount: *₹${balance.toLocaleString('en-IN')}*\nPayment Mode: Cash / UPI (PhonePe, GPay)\n\nKindly remit the fee at your earliest convenience.\nRegards,\n*${instituteName}*\nContact: +91 98482 66892`;
  } else {
    // UPCOMING
    message = `Dear ${parentName} ji,\n\n🗓️ *UPCOMING TUITION FEE INTIMATION - ${instituteName}*\n\nThis is an advance notice that monthly tuition fee for *${studentName}* will be due on *${formattedDueDate}* in ${daysDiff} day(s) (Monthly Cycle: ${cycleDay}th of every month).\n\nMonthly Fee: *₹${balance.toLocaleString('en-IN')}*\nPayment Mode: Cash / UPI\n\nThank you for ensuring timely payments.\n*${instituteName}*\nContact: +91 98482 66892`;
  }

  const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
}
