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
  teachers: [
    {
      id: 'teacher-01',
      username: 'teacher',
      password: 'teacher123',
      pin: '1234',
      name: 'Mr. R. Sharma',
      role: USER_ROLES.TEACHER,
      title: 'Senior Faculty (Maths & Physics)',
      subject: 'Mathematics & Physics',
      phone: '9848266892',
      email: 'teacher@hayagriva.edu',
      assignedBatchIds: [1, 2], // Default assigned batches
      assignedStudentIds: []
    }
  ],
  teacher: {
    username: 'teacher',
    password: 'teacher123',
    pin: '1234',
    name: 'Mr. R. Sharma',
    role: USER_ROLES.TEACHER,
    title: 'Senior Faculty (Maths & Physics)',
    subject: 'Mathematics & Physics',
    email: 'teacher@hayagriva.edu',
    assignedBatchIds: [1, 2],
    assignedStudentIds: []
  }
};

const STAFF_ACCOUNTS_KEY = 'hayagriva_staff_accounts_v1';

// Get staff credentials (customized or default)
export function getStaffAccounts() {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return INITIAL_STAFF_ACCOUNTS;
    }
    const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY);
    if (!raw) return INITIAL_STAFF_ACCOUNTS;
    const parsed = JSON.parse(raw);

    // Ensure teachers array is always populated and has assignedBatchIds and assignedStudentIds
    let teachers = parsed.teachers;
    if (!Array.isArray(teachers) || teachers.length === 0) {
      const fallbackTeacher = parsed.teacher || INITIAL_STAFF_ACCOUNTS.teacher;
      teachers = [{
        id: 'teacher-01',
        username: fallbackTeacher.username || 'teacher',
        password: fallbackTeacher.password || 'teacher123',
        pin: fallbackTeacher.pin || '1234',
        name: fallbackTeacher.name || 'Mr. R. Sharma',
        role: USER_ROLES.TEACHER,
        title: fallbackTeacher.title || 'Senior Faculty (Maths & Physics)',
        subject: fallbackTeacher.subject || 'Mathematics & Physics',
        phone: fallbackTeacher.phone || '9848266892',
        email: fallbackTeacher.email || 'teacher@hayagriva.edu',
        assignedBatchIds: Array.isArray(fallbackTeacher.assignedBatchIds) ? fallbackTeacher.assignedBatchIds : [1, 2],
        assignedStudentIds: Array.isArray(fallbackTeacher.assignedStudentIds) ? fallbackTeacher.assignedStudentIds : []
      }];
    } else {
      teachers = teachers.map((t, idx) => ({
        ...t,
        assignedBatchIds: Array.isArray(t.assignedBatchIds) 
          ? t.assignedBatchIds.map(id => (!isNaN(Number(id)) && String(id).trim() !== '') ? Number(id) : id) 
          : (idx === 0 ? [1, 2] : []),
        assignedStudentIds: Array.isArray(t.assignedStudentIds)
          ? t.assignedStudentIds.map(id => (!isNaN(Number(id)) && String(id).trim() !== '') ? Number(id) : id)
          : []
      }));
    }

    return {
      admin: { ...INITIAL_STAFF_ACCOUNTS.admin, ...(parsed.admin || {}) },
      teacher: teachers[0] || INITIAL_STAFF_ACCOUNTS.teacher,
      teachers
    };
  } catch (err) {
    console.error('Failed to parse staff accounts:', err);
    return INITIAL_STAFF_ACCOUNTS;
  }
}

// Get unvalidated raw session (internal helper to prevent circular calls)
function getRawAuthSession() {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save customized staff credentials (Admin can update passwords/usernames)
export function saveStaffAccounts(accounts) {
  try {
    if (accounts && accounts.teachers && accounts.teachers.length > 0) {
      accounts.teacher = accounts.teachers[0];
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hayagriva-staff-accounts-changed', { detail: accounts }));
    }

    // Also verify active session: if active teacher was deleted, invalidate session immediately
    const session = getRawAuthSession();
    if (session && session.role === USER_ROLES.TEACHER) {
      const exists = (accounts.teachers || []).some(
        t => t.id === session.id || t.username?.toLowerCase() === session.username?.toLowerCase()
      );
      if (!exists) {
        clearAuthSession();
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to save staff accounts:', err);
    return { success: false, error: err.message };
  }
}

// Get all teacher accounts
export function getTeacherAccounts() {
  const accounts = getStaffAccounts();
  return accounts.teachers || [];
}

// Assign/reassign batches to a specific teacher
export function assignBatchesToTeacher(teacherId, batchIds) {
  const accounts = getStaffAccounts();
  const cleanBatchIds = Array.isArray(batchIds) 
    ? batchIds.map(id => (!isNaN(Number(id)) && String(id).trim() !== '') ? Number(id) : id) 
    : [];
  let updated = false;

  const updatedTeachers = (accounts.teachers || []).map(t => {
    if (t.id === teacherId) {
      updated = true;
      return { ...t, assignedBatchIds: cleanBatchIds };
    }
    return t;
  });

  if (updated) {
    accounts.teachers = updatedTeachers;
    if (accounts.teacher && accounts.teacher.id === teacherId) {
      accounts.teacher = { ...accounts.teacher, assignedBatchIds: cleanBatchIds };
    }
    saveStaffAccounts(accounts);

    // Update active session if this teacher is currently logged in
    const session = getAuthSession();
    if (session && session.user && session.user.id === teacherId) {
      const updatedUser = { ...session.user, assignedBatchIds: cleanBatchIds };
      setAuthSession(updatedUser);
    }
    return { success: true, teachers: updatedTeachers };
  }
  return { success: false, message: 'Teacher not found' };
}

// Assign/reassign specific students by name to a teacher
export function assignStudentsToTeacher(teacherId, studentIds) {
  const accounts = getStaffAccounts();
  const cleanStudentIds = Array.isArray(studentIds) 
    ? studentIds.map(id => (!isNaN(Number(id)) && String(id).trim() !== '') ? Number(id) : String(id)) 
    : [];
  let updated = false;

  const updatedTeachers = (accounts.teachers || []).map(t => {
    if (t.id === teacherId) {
      updated = true;
      return { ...t, assignedStudentIds: cleanStudentIds };
    }
    return t;
  });

  if (updated) {
    accounts.teachers = updatedTeachers;
    if (accounts.teacher && accounts.teacher.id === teacherId) {
      accounts.teacher = { ...accounts.teacher, assignedStudentIds: cleanStudentIds };
    }
    saveStaffAccounts(accounts);

    // Update active session if this teacher is currently logged in
    const session = getAuthSession();
    if (session && session.user && session.user.id === teacherId) {
      const updatedUser = { ...session.user, assignedStudentIds: cleanStudentIds };
      setAuthSession(updatedUser);
    }
    return { success: true, teachers: updatedTeachers };
  }
  return { success: false, message: 'Teacher not found' };
}

// Add a new teacher account
export function addTeacherAccount({ name, subject, username, password, phone, email, assignedBatchIds = [], assignedStudentIds = [] }) {
  const accounts = getStaffAccounts();
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, message: 'Username and password are required' };
  }

  // Check duplicate username against admin and other teachers
  if (cleanUsername === accounts.admin.username.toLowerCase()) {
    return { success: false, message: 'Username is already reserved for Admin' };
  }
  if ((accounts.teachers || []).some(t => t.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: `Teacher with username "${cleanUsername}" already exists` };
  }

  const newTeacher = {
    id: `teacher-${Date.now()}`,
    name: (name || '').trim() || 'Faculty Member',
    subject: (subject || '').trim() || 'General Subjects',
    title: (subject || '').trim() ? `Faculty (${subject.trim()})` : 'Tuition Faculty',
    username: cleanUsername,
    password: cleanPassword,
    phone: phone ? phone.trim() : '',
    email: email ? email.trim() : '',
    role: USER_ROLES.TEACHER,
    assignedBatchIds: Array.isArray(assignedBatchIds) 
      ? assignedBatchIds.map(id => (!isNaN(Number(id)) && String(id).trim() !== '') ? Number(id) : id) 
      : [],
    assignedStudentIds: Array.isArray(assignedStudentIds)
      ? assignedStudentIds.map(id => (!isNaN(Number(id)) && String(id).trim() !== '') ? Number(id) : id)
      : [],
    createdAt: new Date().toISOString()
  };

  accounts.teachers = [...(accounts.teachers || []), newTeacher];
  accounts.teacher = accounts.teachers[0];

  const res = saveStaffAccounts(accounts);
  if (res.success) {
    return { success: true, teacher: newTeacher };
  }
  return res;
}

// Update teacher account
export function updateTeacherAccount(id, updates) {
  const accounts = getStaffAccounts();
  const teachers = accounts.teachers || [];
  const idx = teachers.findIndex(t => t.id === id);
  if (idx === -1) return { success: false, message: 'Teacher account not found' };

  if (updates.username) {
    const cleanUser = updates.username.trim().toLowerCase();
    if (cleanUser === accounts.admin.username.toLowerCase()) {
      return { success: false, message: 'Username cannot match Admin username' };
    }
    const duplicate = teachers.some((t, i) => i !== idx && t.username.toLowerCase() === cleanUser);
    if (duplicate) {
      return { success: false, message: 'Username is already taken by another teacher' };
    }
  }

  teachers[idx] = {
    ...teachers[idx],
    ...updates,
    title: updates.subject ? `Faculty (${updates.subject})` : teachers[idx].title
  };
  accounts.teachers = teachers;
  accounts.teacher = teachers[0];
  return saveStaffAccounts(accounts);
}

// Delete teacher account
export function deleteTeacherAccount(id) {
  const accounts = getStaffAccounts();
  const teachers = accounts.teachers || [];
  if (teachers.length <= 1) {
    return { success: false, message: 'At least one teacher account must remain in the system.' };
  }
  const deletedTeacher = teachers.find(t => t.id === id);
  accounts.teachers = teachers.filter(t => t.id !== id);
  accounts.teacher = accounts.teachers[0];
  const saveRes = saveStaffAccounts(accounts);

  // Invalidate active session if currently logged in as the deleted teacher
  const session = getRawAuthSession();
  if (session && session.role === USER_ROLES.TEACHER) {
    const isDeleted = (session.id && session.id === id) || 
      (deletedTeacher && session.username?.toLowerCase() === deletedTeacher.username?.toLowerCase());
    if (isDeleted) {
      clearAuthSession();
    }
  }

  return saveRes;
}

// Update single staff account password / info
export function updateStaffAccount(role, updates) {
  const accounts = getStaffAccounts();
  if (role === USER_ROLES.ADMIN) {
    accounts.admin = { ...accounts.admin, ...updates };
  } else if (role === USER_ROLES.TEACHER) {
    accounts.teacher = { ...accounts.teacher, ...updates };
    if (accounts.teachers && accounts.teachers.length > 0) {
      accounts.teachers[0] = { ...accounts.teachers[0], ...updates };
    }
  } else {
    return { success: false, message: 'Invalid role' };
  }
  return saveStaffAccounts(accounts);
}

// Get active session from storage with real-time validation against registered staff accounts
export function getAuthSession() {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.role) return null;

    // Validate Teacher role against active registered teachers
    if (session.role === USER_ROLES.TEACHER) {
      const accounts = getStaffAccounts();
      const currentTeacher = (accounts.teachers || []).find(
        t => t.id === session.id || t.username?.toLowerCase() === session.username?.toLowerCase()
      );
      if (!currentTeacher) {
        // Teacher has been deleted by Admin! Invalidate stored session
        localStorage.removeItem(AUTH_SESSION_KEY);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hayagriva-auth-changed', { detail: null }));
        }
        return null;
      }
      // Return fresh, up-to-date teacher credentials & assignments
      return {
        ...session,
        id: currentTeacher.id,
        name: currentTeacher.name,
        username: currentTeacher.username,
        role: USER_ROLES.TEACHER,
        title: currentTeacher.title || session.title,
        subject: currentTeacher.subject || session.subject,
        email: currentTeacher.email || session.email,
        phone: currentTeacher.phone || session.phone,
        assignedBatchIds: Array.isArray(currentTeacher.assignedBatchIds) ? currentTeacher.assignedBatchIds : [],
        assignedStudentIds: Array.isArray(currentTeacher.assignedStudentIds) ? currentTeacher.assignedStudentIds : []
      };
    }

    // Refresh Admin role with latest credentials from accounts
    if (session.role === USER_ROLES.ADMIN) {
      const accounts = getStaffAccounts();
      const adminAcc = accounts.admin;
      return {
        ...session,
        name: adminAcc?.name || session.name,
        title: adminAcc?.title || session.title,
        email: adminAcc?.email || session.email
      };
    }

    return session;
  } catch (err) {
    console.error('Failed to parse auth session:', err);
    return null;
  }
}

// Save active session
export function setAuthSession(session) {
  if (typeof localStorage !== 'undefined') {
    if (!session) {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hayagriva-auth-changed', { detail: session }));
  }
}

// Clear session / Logout
export function clearAuthSession() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hayagriva-auth-changed', { detail: null }));
  }
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
    const teachersList = accounts.teachers && accounts.teachers.length > 0 
      ? accounts.teachers 
      : [accounts.teacher];

    const matchedTeacher = teachersList.find(t => {
      const isUserMatch = cleanUser === t.username.toLowerCase() || 
                          (t.email && cleanUser === t.email.toLowerCase());
      const isPassMatch = cleanPass === t.password || (t.pin && cleanPass === t.pin);
      return isUserMatch && isPassMatch;
    });

    if (matchedTeacher) {
      return {
        success: true,
        user: {
          id: matchedTeacher.id || 'teacher-01',
          username: matchedTeacher.username,
          name: matchedTeacher.name || 'Faculty Member',
          role: USER_ROLES.TEACHER,
          title: matchedTeacher.title || (matchedTeacher.subject ? `Faculty (${matchedTeacher.subject})` : 'Senior Faculty'),
          subject: matchedTeacher.subject || '',
          email: matchedTeacher.email || '',
          assignedBatchIds: Array.isArray(matchedTeacher.assignedBatchIds) 
            ? matchedTeacher.assignedBatchIds.map(id => !isNaN(Number(id)) ? Number(id) : id) 
            : [],
          assignedStudentIds: Array.isArray(matchedTeacher.assignedStudentIds)
            ? matchedTeacher.assignedStudentIds.map(id => !isNaN(Number(id)) ? Number(id) : id)
            : []
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
