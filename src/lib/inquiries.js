// ==========================================================================
// Inquiries & Leads Management Pipeline
// Supports Real Student Demo Registrations & Faculty Hiring Applications
// LocalStorage reactive persistence + Supabase PostgreSQL real-time sync
// ==========================================================================

import { getSupabaseClient } from './supabase.js';

const INQUIRIES_STORAGE_KEY = 'hayagriva_inquiries_v1';
const DELETED_LEADS_KEY = 'hayagriva_deleted_leads_v1';

// Blacklist of legacy mock/dummy sample IDs to ensure they never appear
const SAMPLE_IDS = new Set(['101', '102', '500101', '500102']);

export function getDeletedLeadIds() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DELETED_LEADS_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function markLeadAsDeleted(id) {
  try {
    const deleted = getDeletedLeadIds();
    const strId = String(id);
    if (!deleted.includes(strId)) {
      deleted.push(strId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DELETED_LEADS_KEY, JSON.stringify(deleted));
      }
    }
  } catch (e) {
    console.warn('Could not mark lead as deleted:', e);
  }
}

export function getStoredInquiries() {
  try {
    const deletedIds = new Set(getDeletedLeadIds().map(String));
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(INQUIRIES_STORAGE_KEY) : null;
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    
    // Purge any legacy sample data or deleted leads
    const cleanList = list.filter(i => {
      const idStr = String(i.id);
      return !SAMPLE_IDS.has(idStr) && !deletedIds.has(idStr);
    });

    // Auto-update localStorage if dirty sample data was present
    if (cleanList.length !== list.length && typeof localStorage !== 'undefined') {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(cleanList));
    }

    return cleanList;
  } catch (e) {
    console.warn('Error reading stored inquiries:', e);
    return [];
  }
}

export function saveStoredInquiries(inquiries) {
  try {
    const deletedIds = new Set(getDeletedLeadIds().map(String));
    const cleanList = (Array.isArray(inquiries) ? inquiries : []).filter(i => {
      const idStr = String(i.id);
      return !SAMPLE_IDS.has(idStr) && !deletedIds.has(idStr);
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(cleanList));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hayagriva-inquiries-updated', { detail: cleanList }));
    }
  } catch (e) {
    console.error('Error saving inquiries:', e);
  }
}

export async function addInquiry(data) {
  const existing = getStoredInquiries();
  // Ensure ID fits within 32-bit signed integer (< 2,147,483,647) for PostgreSQL SERIAL / INTEGER
  const safeId = (data.id && Number(data.id) < 2000000000)
    ? Number(data.id)
    : (500000 + Math.floor(Math.random() * 400000));

  const newInquiry = {
    id: safeId,
    type: data.type || 'STUDENT_DEMO', // 'STUDENT_DEMO' | 'TEACHER_APPLICATION'
    name: data.name?.trim() || 'Prospective User',
    parentName: data.parentName?.trim() || '',
    phone: (data.phone || '').replace(/\D/g, ''),
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

  const updated = [newInquiry, ...existing.filter(i => String(i.id) !== String(newInquiry.id))];
  saveStoredInquiries(updated);

  // Sync to Supabase PostgreSQL in background
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isTeacher = newInquiry.type === 'TEACHER_APPLICATION';
      const metadata = {
        type: newInquiry.type,
        subjects: newInquiry.subjects,
        timingPreference: newInquiry.timingPreference,
        experience: newInquiry.experience,
        qualification: newInquiry.qualification,
        notes: newInquiry.notes,
        status: newInquiry.status,
        createdAt: newInquiry.createdAt
      };

      const studentLeadRow = {
        id: newInquiry.id,
        admission_no: 'LEAD-' + newInquiry.id,
        full_name: newInquiry.name,
        gender: 'Other',
        class_code: newInquiry.classCode || 'CLASS_10',
        school_name: newInquiry.schoolName || '',
        parent_name: newInquiry.parentName || (isTeacher ? 'Direct Faculty Applicant' : 'Parent'),
        parent_phone: newInquiry.phone,
        parent_email: newInquiry.email || null,
        address: JSON.stringify(metadata),
        monthly_fee: 0,
        status: isTeacher ? 'TEACHER_INQUIRY' : 'DEMO_LEAD',
        admission_date: new Date().toISOString().split('T')[0]
      };

      await supabase.from('students').upsert([studentLeadRow], { onConflict: 'id' });
    } catch (err) {
      console.warn('Could not sync lead to Supabase students table:', err);
    }
  }

  return newInquiry;
}

export async function updateInquiryStatus(id, newStatus) {
  const strId = String(id);
  const existing = getStoredInquiries();
  const updated = existing.map(item => String(item.id) === strId ? { ...item, status: newStatus } : item);
  saveStoredInquiries(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await supabase.from('students').update({ status: newStatus }).eq('id', numId);
      }
      await supabase.from('students').update({ status: newStatus }).eq('admission_no', 'LEAD-' + strId);
    } catch (err) {
      console.warn('Could not update inquiry status in Supabase:', err);
    }
  }
}

export async function deleteInquiry(id) {
  const strId = String(id);
  // 1. Blacklist ID permanently so it can never be resurrected by background fetches
  markLeadAsDeleted(strId);

  // 2. Remove immediately from local storage
  const existing = getStoredInquiries();
  const updated = existing.filter(item => String(item.id) !== strId);
  saveStoredInquiries(updated);

  // 3. Delete from Supabase PostgreSQL database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await supabase.from('students').delete().eq('id', numId);
      }
      await supabase.from('students').delete().eq('admission_no', 'LEAD-' + strId);
    } catch (err) {
      console.warn('Could not delete inquiry from Supabase:', err);
    }
  }

  return updated;
}

export async function fetchInquiriesFromSupabase() {
  const supabase = getSupabaseClient();
  const localList = getStoredInquiries();
  if (!supabase) return localList;

  const deletedIds = new Set(getDeletedLeadIds().map(String));

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .in('status', ['DEMO_LEAD', 'TEACHER_INQUIRY', 'CONTACTED', 'ADMITTED'])
      .order('id', { ascending: false });

    if (error || !data) {
      return localList;
    }

    // Filter out deleted IDs and legacy sample IDs from Supabase rows
    const activeRows = data.filter(row => !deletedIds.has(String(row.id)) && !SAMPLE_IDS.has(String(row.id)));

    // Clean up any blacklisted rows that still exist in Supabase
    const rowsToClean = data.filter(row => deletedIds.has(String(row.id)) || SAMPLE_IDS.has(String(row.id)));
    if (rowsToClean.length > 0) {
      const idsToClean = rowsToClean.map(r => r.id);
      supabase.from('students').delete().in('id', idsToClean).then(() => {});
    }

    const remoteInquiries = activeRows.map(row => {
      let meta = {};
      try {
        if (row.address && typeof row.address === 'string' && row.address.trim().startsWith('{')) {
          meta = JSON.parse(row.address);
        }
      } catch (e) {
        meta = {};
      }

      const isTeacher = row.status === 'TEACHER_INQUIRY' || meta.type === 'TEACHER_APPLICATION';
      return {
        id: row.id,
        type: isTeacher ? 'TEACHER_APPLICATION' : (meta.type || 'STUDENT_DEMO'),
        name: row.full_name || 'Prospective Lead',
        parentName: (row.parent_name === 'Direct Faculty Applicant' || row.parent_name === 'Parent') ? '' : (row.parent_name || ''),
        phone: (row.parent_phone || '').replace(/\D/g, ''),
        email: row.parent_email || '',
        classCode: row.class_code || 'CLASS_10',
        schoolName: row.school_name || '',
        subjects: meta.subjects || 'All Subjects',
        timingPreference: meta.timingPreference || 'Evening',
        experience: meta.experience || '',
        qualification: meta.qualification || '',
        notes: meta.notes || '',
        status: (row.status === 'CONTACTED' || row.status === 'ADMITTED') ? row.status : (meta.status || 'NEW'),
        createdAt: meta.createdAt || row.created_at || new Date().toISOString()
      };
    });

    // Merge remote inquiries with local inquiries by ID (excluding blacklisted and sample IDs)
    const mergedMap = new Map();
    localList
      .filter(item => !deletedIds.has(String(item.id)) && !SAMPLE_IDS.has(String(item.id)))
      .forEach(item => mergedMap.set(String(item.id), item));
    remoteInquiries
      .filter(item => !deletedIds.has(String(item.id)) && !SAMPLE_IDS.has(String(item.id)))
      .forEach(item => mergedMap.set(String(item.id), item));

    const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    saveStoredInquiries(mergedList);
    return mergedList;
  } catch (err) {
    console.warn('Error fetching inquiries from Supabase:', err);
    return localList;
  }
}
