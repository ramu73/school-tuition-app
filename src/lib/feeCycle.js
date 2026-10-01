// ==========================================================================
// Fee Notification & Joining Date Cycle Engine
// Computes monthly fee due dates based on student admission/joining date
// ==========================================================================

export function calculateStudentFeeCycle(student, feeRecord, referenceDate = new Date(), lastPaymentDate = null) {
  const joiningDateStr = (student.admissionDate || '2026-01-01').split('T')[0];
  // Parse date safely without timezone offset issues
  const [jYear, jMonth, jDay] = joiningDateStr.split('-').map(Number);
  const joiningDate = new Date(jYear, (jMonth || 1) - 1, jDay || 1);
  const cycleDay = jDay || joiningDate.getDate() || 1; // e.g. 30th of every month

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

  // Cycle date in the current calendar month
  const cycleThisMonth = getCycleDate(currentYear, currentMonth);
  // Cycle date in the previous calendar month
  const cyclePrevMonth = getCycleDate(currentYear, currentMonth - 1);
  // Cycle date in the next calendar month
  const cycleNextMonth = getCycleDate(currentYear, currentMonth + 1);

  const amountDue = feeRecord ? Number(feeRecord.amountDue) : Number(student.monthlyFee || 0);
  const amountPaid = feeRecord ? Number(feeRecord.amountPaid) : 0;
  const balance = feeRecord ? Number(feeRecord.balance) : Number(student.monthlyFee || 0);

  const payDateStr = lastPaymentDate || feeRecord?.lastPaymentDate || student?.lastPaymentDate || null;
  const payDate = payDateStr ? (() => {
    const [pY, pM, pD] = String(payDateStr).split('T')[0].split('-').map(Number);
    return new Date(pY, (pM || 1) - 1, pD || 1);
  })() : null;

  // Determine if previous cycle was paid:
  const prevCyclePaid = (() => {
    if (joiningDate.getTime() > cyclePrevMonth.getTime()) return true;
    if (payDate && payDate.getTime() >= cyclePrevMonth.getTime()) return true;
    if (feeRecord && Number(feeRecord.balance) === 0 && Number(feeRecord.amountPaid) > 0) return true;
    return false;
  })();

  // Determine if current cycle was paid:
  const thisCyclePaid = (() => {
    if (payDate && payDate.getTime() >= cycleThisMonth.getTime()) return true;
    if (feeRecord && Number(feeRecord.balance) === 0 && Number(feeRecord.amountPaid) > 0) return true;
    return false;
  })();

  let activeDueDate;
  let cycleStatus = 'UPCOMING'; // UPCOMING, DUE_TODAY, OVERDUE, PAID

  // Determine active due date based on joining date cycle
  if (today.getTime() < cycleThisMonth.getTime()) {
    // Today is before this month's cycle day (e.g. today is Oct 1)
    const daysSincePrev = Math.round((today.getTime() - cyclePrevMonth.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilThis = Math.round((cycleThisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // The previous cycle only applies if it concluded recently (closer than this month's upcoming cycle, e.g. B.Yeshwin due yesterday Sept 30)
    if (!prevCyclePaid && daysSincePrev < daysUntilThis) {
      activeDueDate = cyclePrevMonth;
      cycleStatus = 'OVERDUE';
    } else if (thisCyclePaid) {
      activeDueDate = cycleNextMonth;
      cycleStatus = 'PAID';
    } else {
      activeDueDate = cycleThisMonth;
      cycleStatus = 'UPCOMING';
    }
  } else if (today.getTime() === cycleThisMonth.getTime()) {
    // Due today
    if (thisCyclePaid) {
      activeDueDate = cycleNextMonth;
      cycleStatus = 'PAID';
    } else {
      activeDueDate = cycleThisMonth;
      cycleStatus = 'DUE_TODAY';
    }
  } else {
    // Cycle day in current month has passed
    if (thisCyclePaid) {
      activeDueDate = cycleNextMonth;
      cycleStatus = 'PAID';
    } else {
      activeDueDate = cycleThisMonth;
      cycleStatus = 'OVERDUE';
    }
  }

  // Calculate day difference relative to active due date
  const diffTime = activeDueDate.getTime() - today.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const pad = (n) => String(n).padStart(2, '0');
  const dueDateStr = `${activeDueDate.getFullYear()}-${pad(activeDueDate.getMonth() + 1)}-${pad(activeDueDate.getDate())}`;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYearLabel = `${monthNames[activeDueDate.getMonth()]} ${activeDueDate.getFullYear()}`;

  const isPaid = (cycleStatus === 'PAID');

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
    formattedDueDate,
    cycleStatus
  } = cycleInfo;

  let statusNote = `This is a reminder regarding the tuition fee for ${studentName}.`;
  if (cycleStatus === 'DUE_TODAY') {
    statusNote = `This is a reminder that the tuition fee for ${studentName} is due today.`;
  } else if (cycleStatus === 'UPCOMING') {
    statusNote = `This is a reminder for the upcoming tuition fee for ${studentName}.`;
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
