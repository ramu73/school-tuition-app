// ==========================================================================
// Inquiries & Leads Management Pipeline
// Supports New Student Demo Registrations & Faculty Hiring Applications
// LocalStorage caching with PostgreSQL / Supabase sync and real-time alerts
// ==========================================================================

import { getSupabaseClient } from './supabase.js';

const INQUIRIES_STORAGE_KEY = 'hayagriva_inquiries_v1';

// Initial sample inquiries if none exist
const DEFAULT_INQUIRIES = [
  {
    id: 101,
    type: 'STUDENT_DEMO',
    name: 'K. Sai Akhil',
    parentName: 'K. Venkatesh',
    phone: '9848123456',
    email: '',
    classCode: 'CLASS_10',
    schoolName: 'St. Joseph High School',
    subjects: 'Mathematics & Science',
    timingPreference: 'Evening (5:30 PM - 7:30 PM)',
    notes: 'Interested in Class 10 Board Exam batch.',
    status: 'NEW',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 102,
    type: 'TEACHER_APPLICATION',
    name: 'B. Srilatha',
    parentName: '',
    phone: '9876543210',
    email: 'srilatha.maths@gmail.com',
    classCode: 'CLASS_8',
    schoolName: '',
    subjects: 'Mathematics & Physical Science',
    timingPreference: 'Evening',
    experience: '4 Years at Narayana High School',
    qualification: 'M.Sc. B.Ed (Mathematics)',
    notes: 'Enquiry for high school mathematics faculty position.',
    status: 'NEW',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  }
];

export function getStoredInquiries() {
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(DEFAULT_INQUIRIES));
      return DEFAULT_INQUIRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_INQUIRIES;
  } catch (e) {
    console.warn('Error reading stored inquiries:', e);
    return DEFAULT_INQUIRIES;
  }
}

export function saveStoredInquiries(inquiries) {
  try {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
    window.dispatchEvent(new CustomEvent('hayagriva-inquiries-updated', { detail: inquiries }));
  } catch (e) {
    console.error('Error saving inquiries:', e);
  }
}

export async function addInquiry(data) {
  const existing = getStoredInquiries();
  const newInquiry = {
    id: Date.now(),
    type: data.type || 'STUDENT_DEMO', // 'STUDENT_DEMO' | 'TEACHER_APPLICATION'
    name: data.name?.trim() || 'Prospective User',
    parentName: data.parentName?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    classCode: data.classCode || 'CLASS_10',
    schoolName: data.schoolName?.trim() || '',
    subjects: data.subjects?.trim() || 'All Subjects',
    timingPreference: data.timingPreference || 'Evening',
    experience: data.experience?.trim() || '',
    qualification: data.qualification?.trim() || '',
    notes: data.notes?.trim() || '',
    status: 'NEW',
    createdAt: new Date().toISOString()
  };

  const updated = [newInquiry, ...existing];
  saveStoredInquiries(updated);

  // Sync to Supabase if inquiries table exists
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        id: newInquiry.id,
        inquiry_type: newInquiry.type,
        name: newInquiry.name,
        parent_name: newInquiry.parentName || null,
        phone: newInquiry.phone,
        email: newInquiry.email || null,
        class_code: newInquiry.classCode || null,
        school_name: newInquiry.schoolName || null,
        subjects: newInquiry.subjects || null,
        timing_preference: newInquiry.timingPreference || null,
        experience: newInquiry.experience || null,
        qualification: newInquiry.qualification || null,
        notes: newInquiry.notes || null,
        status: 'NEW',
        created_at: newInquiry.createdAt
      };
      await supabase.from('inquiries').upsert([payload], { onConflict: 'id' });
    } catch (err) {
      // Table may not exist yet, local state will still work
    }
  }

  return newInquiry;
}

export async function updateInquiryStatus(id, newStatus) {
  const existing = getStoredInquiries();
  const updated = existing.map(item => item.id === id ? { ...item, status: newStatus } : item);
  saveStoredInquiries(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('inquiries').update({ status: newStatus }).eq('id', id);
    } catch (err) {
      // Ignore if table not created
    }
  }
}

export async function deleteInquiry(id) {
  const existing = getStoredInquiries();
  const updated = existing.filter(item => item.id !== id);
  saveStoredInquiries(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('inquiries').delete().eq('id', id);
    } catch (err) {
      // Ignore if table not created
    }
  }
}

export async function fetchInquiriesFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;
    const mapped = data.map(row => ({
      id: row.id,
      type: row.inquiry_type || 'STUDENT_DEMO',
      name: row.name,
      parentName: row.parent_name || '',
      phone: row.phone,
      email: row.email || '',
      classCode: row.class_code || 'CLASS_10',
      schoolName: row.school_name || '',
      subjects: row.subjects || '',
      timingPreference: row.timing_preference || '',
      experience: row.experience || '',
      qualification: row.qualification || '',
      notes: row.notes || '',
      status: row.status || 'NEW',
      createdAt: row.created_at
    }));
    saveStoredInquiries(mapped);
    return mapped;
  } catch (err) {
    return null;
  }
}
