// ==========================================================================
// Authentication & Role-Based Access Control (RBAC)
// Roles: ADMIN | TEACHER | PARENT
// ==========================================================================

const AUTH_SESSION_KEY = 'hayagriva_auth_session_v1';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT'
};

// Default staff accounts (baseline)
export const INITIAL_STAFF_ACCOUNTS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    pin: '1234',
    name: 'Tuition Director',
    role: USER_ROLES.ADMIN,
    title: 'Administrator',
    email: 'admin@hayagriva.edu'
  },
  teacher: {
    username: 'teacher',
    password: 'teacher123',
    pin: '1234',
    name: 'Mr. R. Sharma',
    role: USER_ROLES.TEACHER,
    title: 'Senior Faculty (Maths & Physics)',
    email: 'teacher@hayagriva.edu'
  }
};

const STAFF_ACCOUNTS_KEY = 'hayagriva_staff_accounts_v1';

// Get staff credentials (customized or default)
export function getStaffAccounts() {
  try {
    const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY);
    if (!raw) return INITIAL_STAFF_ACCOUNTS;
    const parsed = JSON.parse(raw);
    return {
      admin: { ...INITIAL_STAFF_ACCOUNTS.admin, ...(parsed.admin || {}) },
      teacher: { ...INITIAL_STAFF_ACCOUNTS.teacher, ...(parsed.teacher || {}) }
    };
  } catch (err) {
    console.error('Failed to parse staff accounts:', err);
    return INITIAL_STAFF_ACCOUNTS;
  }
}

// Save customized staff credentials (Admin can update passwords/usernames)
export function saveStaffAccounts(accounts) {
  try {
    localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new CustomEvent('hayagriva-staff-accounts-changed', { detail: accounts }));
    return { success: true };
  } catch (err) {
    console.error('Failed to save staff accounts:', err);
    return { success: false, error: err.message };
  }
}

// Update single staff account password / info
export function updateStaffAccount(role, updates) {
  const accounts = getStaffAccounts();
  if (role === USER_ROLES.ADMIN) {
    accounts.admin = { ...accounts.admin, ...updates };
  } else if (role === USER_ROLES.TEACHER) {
    accounts.teacher = { ...accounts.teacher, ...updates };
  } else {
    return { success: false, message: 'Invalid role' };
  }
  return saveStaffAccounts(accounts);
}

// Get active session from storage
export function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse auth session:', err);
    return null;
  }
}

// Save active session
export function setAuthSession(session) {
  if (!session) {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } else {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }
  window.dispatchEvent(new CustomEvent('hayagriva-auth-changed', { detail: session }));
}

// Clear session / Logout
export function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('hayagriva-auth-changed', { detail: null }));
}

// Authenticate Admin or Teacher
export function authenticateStaff(usernameOrEmail, password, requestedRole) {
  const cleanUser = (usernameOrEmail || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, message: 'Please enter both username and password.' };
  }

  const accounts = getStaffAccounts();

  if (requestedRole === USER_ROLES.ADMIN) {
    const adminAcc = accounts.admin;
    const isUserMatch = cleanUser === adminAcc.username.toLowerCase() || 
                        (adminAcc.email && cleanUser === adminAcc.email.toLowerCase());
    const isPassMatch = cleanPass === adminAcc.password || (adminAcc.pin && cleanPass === adminAcc.pin);

    if (isUserMatch && isPassMatch) {
      return {
        success: true,
        user: {
          id: 'admin-01',
          username: adminAcc.username,
          name: adminAcc.name || 'Administrator',
          role: USER_ROLES.ADMIN,
          title: adminAcc.title || 'Tuition Director',
          email: adminAcc.email
        }
      };
    }
    return { success: false, message: 'Invalid Admin username or password. Please try again.' };
  }

  if (requestedRole === USER_ROLES.TEACHER) {
    const teacherAcc = accounts.teacher;
    const isUserMatch = cleanUser === teacherAcc.username.toLowerCase() || 
                        (teacherAcc.email && cleanUser === teacherAcc.email.toLowerCase());
    const isPassMatch = cleanPass === teacherAcc.password || (teacherAcc.pin && cleanPass === teacherAcc.pin);

    if (isUserMatch && isPassMatch) {
      return {
        success: true,
        user: {
          id: 'teacher-01',
          username: teacherAcc.username,
          name: teacherAcc.name || 'Faculty Member',
          role: USER_ROLES.TEACHER,
          title: teacherAcc.title || 'Senior Faculty',
          email: teacherAcc.email
        }
      };
    }
    return { success: false, message: 'Invalid Teacher username or password. Please try again.' };
  }

  return { success: false, message: 'Invalid role requested.' };
}

// Authenticate Parent strictly via registered Mobile Number or Admission Number
export function authenticateParent(identifier, tuitionStudents = []) {
  const query = (identifier || '').trim().toLowerCase();
  if (!query) {
    return { success: false, message: 'Please enter your registered mobile number or admission number.' };
  }

  // Clean numbers (e.g. "+91 98765-43210" -> "9876543210")
  const numericQuery = query.replace(/\D/g, '');

  const matched = tuitionStudents.filter(s => {
    const parentPhoneClean = (s.parentPhone || '').replace(/\D/g, '');
    const admNoClean = (s.admissionNo || '').toLowerCase();
    
    if (numericQuery.length >= 7 && parentPhoneClean.includes(numericQuery)) {
      return true;
    }
    if (admNoClean === query || admNoClean.replace(/\D/g, '') === numericQuery) {
      return true;
    }
    return false;
  });

  if (matched.length > 0) {
    const primaryStudent = matched[0];
    return {
      success: true,
      user: {
        id: `parent-${primaryStudent.id}`,
        name: primaryStudent.parentName || 'Parent / Guardian',
        role: USER_ROLES.PARENT,
        parentPhone: primaryStudent.parentPhone,
        studentId: primaryStudent.id,
        studentName: primaryStudent.name,
        allChildren: matched.map(m => ({ id: m.id, name: m.name, classCode: m.classCode }))
      }
    };
  }

  return {
    success: false,
    message: 'Mobile number or admission number not found in registered tuition students. Please contact the tuition office.'
  };
}
