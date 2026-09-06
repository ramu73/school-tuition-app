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

// Default accounts
export const DEFAULT_CREDENTIALS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    pin: '1234',
    name: 'Tuition Director',
    role: USER_ROLES.ADMIN,
    title: 'Administrator'
  },
  teacher: {
    username: 'teacher',
    password: 'teacher123',
    pin: '1234',
    name: 'Mr. R. Sharma',
    role: USER_ROLES.TEACHER,
    title: 'Senior Faculty (Maths & Physics)'
  }
};

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

  if (requestedRole === USER_ROLES.ADMIN) {
    if ((cleanUser === 'admin' || cleanUser === 'admin@hayagriva.edu') && 
        (cleanPass === 'admin123' || cleanPass === '1234')) {
      return {
        success: true,
        user: {
          id: 'admin-01',
          username: 'admin',
          name: 'Administrator',
          role: USER_ROLES.ADMIN,
          title: 'Tuition Director',
          email: 'admin@hayagriva.edu'
        }
      };
    }
    return { success: false, message: 'Invalid Admin username or password. (Default: admin / admin123)' };
  }

  if (requestedRole === USER_ROLES.TEACHER) {
    if ((cleanUser === 'teacher' || cleanUser === 'teacher@hayagriva.edu' || cleanUser === 'sharma') && 
        (cleanPass === 'teacher123' || cleanPass === '1234')) {
      return {
        success: true,
        user: {
          id: 'teacher-01',
          username: 'teacher',
          name: 'Mr. R. Sharma',
          role: USER_ROLES.TEACHER,
          title: 'Mathematics & Science Faculty',
          email: 'teacher@hayagriva.edu'
        }
      };
    }
    return { success: false, message: 'Invalid Teacher username or password. (Default: teacher / teacher123)' };
  }

  return { success: false, message: 'Invalid role requested.' };
}

// Authenticate Parent via Mobile Number or Admission Number
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
    message: 'Mobile number or admission number not found in registered tuition students.'
  };
}
