// ==========================================================================
// Fee Notification & Joining Date Cycle Engine
// Computes monthly fee due dates based on student admission/joining date
// ==========================================================================

export function calculateStudentFeeCycle(student, feeRecord, referenceDate = new Date()) {
  const joiningDateStr = student.admissionDate || '2026-01-01';
  // Parse date safely without timezone offset issues
  const [jYear, jMonth, jDay] = joiningDateStr.split('-').map(Number);
  const joiningDate = new Date(jYear, (jMonth || 1) - 1, jDay || 1);
  const cycleDay = jDay || joiningDate.getDate(); // e.g. 30th of every month

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-indexed (e.g. 8 for September)
  const currentDay = referenceDate.getDate(); // e.g. 7

  const today = new Date(currentYear, currentMonth, currentDay);

  // Helper to compute actual cycle date for a given year and month (handling variable days in month)
  const getCycleDate = (y, m) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const actualDay = Math.min(cycleDay, daysInMonth);
    return new Date(y, m, actualDay);
  };

  // Cycle date in the current calendar month
  const cycleThisMonth = getCycleDate(currentYear, currentMonth);
  // Cycle date in the previous calendar month
  const cyclePrevMonth = getCycleDate(currentYear, currentMonth - 1);
  // Cycle date in the next calendar month
  const cycleNextMonth = getCycleDate(currentYear, currentMonth + 1);

  const amountDue = feeRecord ? Number(feeRecord.amountDue) : Number(student.monthlyFee || 0);
  const amountPaid = feeRecord ? Number(feeRecord.amountPaid) : 0;
  const balance = feeRecord ? Number(feeRecord.balance) : Number(student.monthlyFee || 0);
  const isPaid = balance === 0;

  let activeDueDate;
  let cycleStatus = 'UPCOMING'; // UPCOMING, DUE_TODAY, OVERDUE, PAID
  let daysDiff = 0;

  // Determine active due date:
  // If today is before this month's cycle day (e.g. Today is Sept 7, cycle day is 30 -> Sept 30 is in the future):
  // Check if student joined on or before the previous month's cycle day (e.g. June 30 <= Aug 30).
  // If so, the active billing cycle that was due on Aug 30 is pending and calculates from Aug 30 onwards!
  if (today.getTime() < cycleThisMonth.getTime()) {
    if (!isPaid && joiningDate.getTime() <= cyclePrevMonth.getTime()) {
      activeDueDate = cyclePrevMonth;
    } else {
      activeDueDate = cycleThisMonth;
    }
  } else if (today.getTime() === cycleThisMonth.getTime()) {
    activeDueDate = cycleThisMonth;
  } else {
    // Today is after this month's cycle day (e.g. Today is Sept 7, cycle day was Sept 5)
    if (isPaid) {
      activeDueDate = cycleNextMonth;
    } else {
      activeDueDate = cycleThisMonth;
    }
  }

  // Calculate day difference relative to active due date
  // diffTime = activeDueDate - today:
  // positive = upcoming in X days
  // 0 = due today
  // negative = overdue by X days
  const diffTime = activeDueDate.getTime() - today.getTime();
  daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (isPaid) {
    cycleStatus = 'PAID';
  } else if (daysDiff === 0) {
    cycleStatus = 'DUE_TODAY';
  } else if (daysDiff < 0) {
    cycleStatus = 'OVERDUE';
  } else {
    cycleStatus = 'UPCOMING';
  }

  const pad = (n) => String(n).padStart(2, '0');
  const dueDateStr = `${activeDueDate.getFullYear()}-${pad(activeDueDate.getMonth() + 1)}-${pad(activeDueDate.getDate())}`;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYearLabel = `${monthNames[activeDueDate.getMonth()]} ${activeDueDate.getFullYear()}`;

  return {
    studentId: student.id,
    studentName: student.name,
    classCode: student.classCode,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    joiningDate: joiningDateStr,
    cycleDay: activeDueDate.getDate(),
    dueDateStr,
    formattedDueDate: activeDueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    monthYearLabel,
    amountDue,
    amountPaid,
    balance,
    cycleStatus,
    daysDiff, // negative if overdue, 0 if today, positive if upcoming
    isPaid
  };
}

// Generate pre-filled WhatsApp notification message text
export function generateFeeReminderMessage(cycleInfo, instituteName = 'HAYAGRIVA TUTORIALS') {
  const {
    studentName,
    parentName,
    formattedDueDate,
    balance,
    cycleStatus
  } = cycleInfo;

  // Clean parent name: remove any existing "ji" or extra spaces, and don't add "Ji"
  const cleanParentName = parentName ? parentName.replace(/\bji\b/gi, '').trim() : '';
  const greeting = cleanParentName ? `Dear ${cleanParentName},` : 'Dear Parent,';
  const formattedBalance = Number(balance || 0).toLocaleString('en-IN');

  let statusNote = `This is a reminder regarding the tuition fee for *${studentName}*.`;
  if (cycleStatus === 'DUE_TODAY') {
    statusNote = `This is a reminder that the tuition fee for *${studentName}* is due today.`;
  } else if (cycleStatus === 'UPCOMING') {
    statusNote = `This is a reminder for the upcoming tuition fee for *${studentName}*.`;
  }

  return `${greeting}

*Fee Reminder - ${instituteName}*

${statusNote}

• Due Date: *${formattedDueDate}*
• Pending Amount: *₹${formattedBalance}*
• Payment Mode: Cash / UPI (PhonePe, GPay)

Kindly clear the pending fee at your convenience.

Thank you,
*${instituteName}*
Contact: +91 98482 66892`;
}

// Generate pre-filled WhatsApp notification message URL for parents
export function generateFeeReminderWhatsAppUrl(cycleInfo, instituteName = 'HAYAGRIVA TUTORIALS') {
  const message = generateFeeReminderMessage(cycleInfo, instituteName);
  const rawPhone = (cycleInfo.parentPhone || '').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
