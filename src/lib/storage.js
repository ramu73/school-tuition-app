// ==========================================================================
// School Tuition Management - Database Storage & Real-Time Engine
// Supports local reactive persistence + direct Supabase sync
// ==========================================================================

const STORAGE_KEY = 'vidyatrack_tuition_data_v1';
const SUPABASE_CONFIG_KEY = 'vidyatrack_supabase_config_v1';

// Pre-seeded Classes 1 to 10
export const INITIAL_CLASSES = [
  { id: 1, code: 'CLASS_1', name: 'Class 1', category: 'Primary', defaultFee: 500, subjects: ['English', 'Mathematics', 'Environmental Studies', 'Telugu / Hindi'] },
  { id: 2, code: 'CLASS_2', name: 'Class 2', category: 'Primary', defaultFee: 550, subjects: ['English', 'Mathematics', 'Environmental Studies', 'Telugu / Hindi'] },
  { id: 3, code: 'CLASS_3', name: 'Class 3', category: 'Primary', defaultFee: 600, subjects: ['English', 'Mathematics', 'Science', 'Social Studies', 'Language II'] },
  { id: 4, code: 'CLASS_4', name: 'Class 4', category: 'Primary', defaultFee: 650, subjects: ['English', 'Mathematics', 'Science', 'Social Studies', 'Language II'] },
  { id: 5, code: 'CLASS_5', name: 'Class 5', category: 'Primary', defaultFee: 700, subjects: ['English', 'Mathematics', 'General Science', 'Social Studies', 'Language II'] },
  { id: 6, code: 'CLASS_6', name: 'Class 6', category: 'Middle', defaultFee: 800, subjects: ['Mathematics', 'General Science', 'Social Studies', 'English', 'Language II'] },
  { id: 7, code: 'CLASS_7', name: 'Class 7', category: 'Middle', defaultFee: 850, subjects: ['Mathematics', 'General Science', 'Social Studies', 'English', 'Language II'] },
  { id: 8, code: 'CLASS_8', name: 'Class 8', category: 'Middle', defaultFee: 900, subjects: ['Mathematics', 'Physical Science', 'Biological Science', 'Social Studies', 'English'] },
  { id: 9, code: 'CLASS_9', name: 'Class 9', category: 'High School', defaultFee: 1100, subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'English'] },
  { id: 10, code: 'CLASS_10', name: 'Class 10', category: 'High School', defaultFee: 1250, subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'English'] }
];

export const INITIAL_BATCHES = [];
export const INITIAL_STUDENTS = [];
export const INITIAL_FEES = [];
export const INITIAL_RECEIPTS = [];
export const INITIAL_EXAMS = [];
export const INITIAL_MARKS = [];
export const INITIAL_ATTENDANCE = [];
export const INITIAL_ANNOUNCEMENTS = [];
export const INITIAL_TUTOR_FEEDBACK = [];
export const INITIAL_HOMEWORK = [];


// Helper: Synthesize parent-friendly feedback note from 3-tap picks
export function generateParentFeedbackMessage({
  strength = 'Concepts',
  improvementArea = 'Accuracy',
  nextStep = 'Practice 5 problems',
  studentName = 'Your child',
  monthlyProgress = 'Improving'
}) {
  const strengthMap = {
    'Concepts': 'understands core concepts very well and grasps classroom explanations quickly',
    'Problem Solving': 'demonstrates sharp problem-solving skills and methodical thinking',
    'Homework': 'is diligent and completes assigned homework consistently on time',
    'Participation': 'actively participates in class discussions and shows enthusiastic interest',
    'Reading': 'reads lesson material attentively and follows textbook topics thoroughly'
  };

  const improvementMap = {
    'Concept Clarity': 'further strengthening foundational clarity in complex topics',
    'Problem Solving': 'structuring step-by-step problem-solving approaches',
    'Accuracy': 'improving calculation accuracy and minimizing avoidable test mistakes',
    'Speed': 'enhancing solving speed and effective time management during tests',
    'Revision': 'maintaining regular weekly revision of covered chapters',
    'Homework': 'bringing more consistency and completeness to daily homework',
    'Participation': 'speaking up more confidently and actively resolving doubts'
  };

  const nextStepMap = {
    'Daily 15-min revision': 'dedicating 15 minutes every day for focused concept revision',
    'Practice 5 problems': 'practicing 5 targeted problems daily',
    'Revise weak topics': 'revisiting weak spots and reviewing chapter summaries',
    'Complete pending work': 'clearing pending exercises systematically before the next session',
    'Read and explain the lesson': 'reading lessons aloud and explaining the main points in their own words',
    'Practice mistakes from previous test': 're-solving test mistakes carefully to avoid repeating them'
  };

  const strText = strengthMap[strength] || 'shows sincere effort in class';
  const impText = improvementMap[improvementArea] || 'focusing on key growth areas';
  const stepText = nextStepMap[nextStep] || 'consistent daily practice';

  let icon = '🌱';
  if (monthlyProgress === 'Excellent') icon = '🚀';
  else if (monthlyProgress === 'Good' || monthlyProgress === 'Improving') icon = '🌟';

  return `${icon} Child Improvement Plan: ${studentName} ${strText}. The primary focus this month is ${impText}. We recommend ${stepText}, which will solidify understanding and bring noticeable improvement.`;
}

// Helper: Check goal achievement status against test marks
export function calculateStudentGoalProgress(goal, marks = [], exams = []) {
  if (!goal || !goal.targetScore) return null;

  const matchingMarks = (marks || []).filter(m => {
    const exam = (exams || []).find(e => e.id === m.examId);
    const markSubject = (m.subject || exam?.subject || '').toLowerCase().trim();
    const goalSubject = (goal.subject || '').toLowerCase().trim();
    return markSubject.includes(goalSubject) || goalSubject.includes(markSubject);
  });

  if (matchingMarks.length === 0) {
    return {
      ...goal,
      currentProgress: goal.currentScore || 0,
      achieved: false,
      status: 'IN_PROGRESS',
      latestExamMarks: null
    };
  }

  const latestMark = matchingMarks[matchingMarks.length - 1];
  const exam = (exams || []).find(e => e.id === latestMark.examId);
  const totalMarks = exam?.totalMarks || 50;
  const percentage = Math.round((Number(latestMark.marksObtained) / totalMarks) * 100);

  const achieved = percentage >= goal.targetScore;
  return {
    ...goal,
    currentProgress: percentage,
    achieved,
    status: achieved ? 'ACHIEVED' : 'IN_PROGRESS',
    latestExamMarks: `${latestMark.marksObtained}/${totalMarks} (${percentage}%)`
  };
}

// Initialize Storage
export function getStoredData() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);

      // Clean out any legacy static mock/demo records so they never pollute production
      if (Array.isArray(parsed.students)) {
        parsed.students = parsed.students.filter(s => 
          !s.admissionNo?.startsWith('ADM-10') && 
          s.name !== 'Aarav Kumar' && 
          s.name !== 'Sneha Patel' &&
          s.name !== 'Rohan Varma' &&
          s.name !== 'Pooja Reddy' &&
          s.name !== 'Karthik Rao'
        );
      }
      if (Array.isArray(parsed.batches)) {
        parsed.batches = parsed.batches.filter(b => 
          b.name !== 'Class 10 - Morning Focus' && 
          b.name !== 'Class 10 - Evening Prime' &&
          b.name !== 'Class 9 - Evening Batch' &&
          b.name !== 'Class 8 - Foundation Batch' &&
          b.name !== 'Class 5 to 7 - Junior Champs' &&
          b.name !== 'Class 1 to 4 - Primary Care'
        );
      }
      if (Array.isArray(parsed.exams)) {
        parsed.exams = parsed.exams.filter(e => 
          !e.title?.includes('Linear Equations') &&
          !e.title?.includes('Slip Test') &&
          !e.title?.includes('Fundamentals Quiz')
        );
      }

      if (!parsed.batches || !Array.isArray(parsed.batches)) parsed.batches = [];
      if (!parsed.students || !Array.isArray(parsed.students)) parsed.students = [];
      if (!parsed.fees || !Array.isArray(parsed.fees)) parsed.fees = [];
      if (!parsed.receipts || !Array.isArray(parsed.receipts)) parsed.receipts = [];
      if (!parsed.exams || !Array.isArray(parsed.exams)) parsed.exams = [];
      if (!parsed.marks || !Array.isArray(parsed.marks)) parsed.marks = [];
      if (!parsed.attendance || !Array.isArray(parsed.attendance)) parsed.attendance = [];
      if (!parsed.announcements || !Array.isArray(parsed.announcements)) parsed.announcements = [];
      if (!parsed.tutorFeedback || !Array.isArray(parsed.tutorFeedback)) parsed.tutorFeedback = [];
      if (!parsed.homework || !Array.isArray(parsed.homework)) parsed.homework = [];

      if (Array.isArray(parsed.classes)) {
        let changed = false;
        parsed.classes = parsed.classes.map(c => {
          if (c.code === 'CLASS_10' && (c.name?.includes('SSC') || c.name?.includes('CBSE'))) {
            changed = true;
            return { ...c, name: 'Class 10' };
          }
          if (c.name && c.name.includes('(SSC/CBSE)')) {
            changed = true;
            return { ...c, name: c.name.replace(/\s*\(SSC\/CBSE\)/gi, '').trim() };
          }
          return c;
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse local storage', e);
    }
  }
  const defaultData = getEmptyTuitionData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
}


export function saveStoredData(data) {
  if (data && Array.isArray(data.classes)) {
    data.classes = data.classes.map(c => {
      if (c.code === 'CLASS_10' && (c.name?.includes('SSC') || c.name?.includes('CBSE'))) {
        return { ...c, name: 'Class 10' };
      }
      if (c.name && c.name.includes('(SSC/CBSE)')) {
        return { ...c, name: c.name.replace(/\s*\(SSC\/CBSE\)/gi, '').trim() };
      }
      return c;
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Dispatch reactive event so all components update in real time
  window.dispatchEvent(new CustomEvent('tuition-db-updated', { detail: data }));
}

// Supabase Connection Credentials Storage
export function getSupabaseConfig() {
  const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch (e) {
      // fallback to env variables
    }
  }
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://zqavoaqgbmcdgpseaern.supabase.co';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXZvYXFnYm1jZGdwc2VhZXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTAwNzEsImV4cCI6MjEwNDI4NjA3MX0.aEux3R59N_3fjCndysdrQa7CaG4Cn996bPX92JJJhb4';
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, isConnected: true };
  }
  return { url: '', anonKey: '', isConnected: false };
}

export function saveSupabaseConfig(config) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('tuition-supabase-config-changed', { detail: config }));
}

// Generate clean positive integer IDs (< 2 billion) for PostgreSQL SERIAL compatibility
export function generateNextId(items = []) {
  if (!items || items.length === 0) return 1;
  const max = items.reduce((m, item) => {
    const num = Number(item?.id);
    return !isNaN(num) && num < 2000000000 ? Math.max(m, num) : m;
  }, 0);
  return max + 1;
}

// Clean blank slate template (0 students, standard classes)
export function getEmptyTuitionData() {
  return {
    classes: INITIAL_CLASSES,
    batches: [],
    students: [],
    fees: [],
    receipts: [],
    exams: [],
    marks: [],
    attendance: [],
    announcements: [],
    tutorFeedback: [],
    homework: []
  };
}

