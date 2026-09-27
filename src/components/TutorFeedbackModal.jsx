import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Award, 
  Target, 
  BookOpen, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { generateParentFeedbackMessage, generateNextId } from '../lib/storage';

export const STRENGTH_OPTIONS = [
  { id: 'Concepts', label: '🌟 Concepts', desc: 'Grasps theory and concepts quickly' },
  { id: 'Problem Solving', label: '🧮 Problem Solving', desc: 'Strong logical & numerical aptitude' },
  { id: 'Homework', label: '📝 Homework', desc: 'Consistent & disciplined assignments' },
  { id: 'Participation', label: '🙋 Participation', desc: 'Active & enthusiastic in discussions' },
  { id: 'Reading', label: '📚 Reading', desc: 'Attentive reader and textbook comprehension' }
];

export const IMPROVEMENT_OPTIONS = [
  { id: 'Concept Clarity', label: '🧠 Concept Clarity', desc: 'Needs fundamental clarification' },
  { id: 'Problem Solving', label: '🧮 Problem Solving', desc: 'Needs step-by-step guidance' },
  { id: 'Accuracy', label: '🎯 Accuracy', desc: 'Needs to minimize avoidable slips' },
  { id: 'Speed', label: '⏱️ Speed', desc: 'Needs faster test completion pace' },
  { id: 'Revision', label: '🔄 Revision', desc: 'Needs frequent recall of past chapters' },
  { id: 'Homework', label: '📝 Homework', desc: 'Needs more consistent homework submission' },
  { id: 'Participation', label: '🙋 Participation', desc: 'Needs encouragement to ask questions' }
];

export const NEXT_STEP_OPTIONS = [
  { id: 'Daily 15-min revision', label: '📖 Daily 15-min revision', desc: 'Quick daily recall routine' },
  { id: 'Practice 5 problems', label: '🧮 Practice 5 problems', desc: 'Daily practice of 5 exercises' },
  { id: 'Revise weak topics', label: '🔄 Revise weak topics', desc: 'Focused chapter recap' },
  { id: 'Complete pending work', label: '📝 Complete pending work', desc: 'Catch up on notes & notebook' },
  { id: 'Read and explain the lesson', label: '📚 Read and explain the lesson', desc: 'Verbal recap to verify grasp' },
  { id: 'Practice mistakes from previous test', label: '🎯 Practice mistakes from previous test', desc: 'Correct and re-solve errors' }
];

export const RUBRICS = {
  academics: ['🌟 Excellent', '👍 Good', '📈 Improving', '🎯 Needs Support'],
  understanding: ['🌟 Clear', '👍 Good', '🔄 Needs Revision', '📖 Needs Practice'],
  homework: ['✅ Completed', '👍 Mostly Completed', '⚠️ Sometimes Pending', '❗ Frequently Pending'],
  participation: ['🌟 Very Active', '👍 Active', '🙂 Sometimes', '💬 Needs Encouragement'],
  regularity: ['🌟 Very Regular', '👍 Regular', '⚠️ Occasionally Absent', '❗ Frequently Absent'],
  progress: ['🚀 Excellent', '📈 Good', '➡️ Steady', '🎯 Needs Attention'],
  focusAreas: ['🧮 Concept Clarity', '📝 Homework', '🔢 Problem Solving', '📖 Revision', '🙋 Participation', '⏰ Regularity']
};

export default function TutorFeedbackModal({
  student,
  existingFeedback,
  studentMarks = [],
  attendanceRate = 92,
  classes = [],
  currentUser,
  onSaveFeedback,
  onClose
}) {
  if (!student) return null;

  const isTeacher = currentUser?.role === 'TEACHER';
  const currentMonthYear = 'March 2026';
  const studentClass = classes.find(c => c.code === student.classCode);
  const classSubjects = studentClass?.subjects || ['Mathematics', 'Science', 'English'];

  // Latest test score percentage for goal auto-recommendation
  const latestMark = studentMarks.length > 0 ? studentMarks[studentMarks.length - 1] : null;
  const latestPct = latestMark && latestMark.totalMarks > 0 
    ? Math.round((latestMark.marksObtained / latestMark.totalMarks) * 100)
    : 75;

  // 1️⃣ 3-Tap Selections
  const [strength, setStrength] = useState(existingFeedback?.strength || 'Concepts');
  const [improvementArea, setImprovementArea] = useState(existingFeedback?.improvementArea || 'Accuracy');
  const [nextStep, setNextStep] = useState(existingFeedback?.nextStep || 'Practice 5 problems');

  // 2️⃣ Quick Rubric Ratings
  const [academicPerformance, setAcademicPerformance] = useState(existingFeedback?.academicPerformance || 'Good');
  const [conceptUnderstanding, setConceptUnderstanding] = useState(existingFeedback?.conceptUnderstanding || 'Good');
  const [homeworkStatus, setHomeworkStatus] = useState(existingFeedback?.homeworkStatus || 'Mostly Completed');
  const [classParticipation, setClassParticipation] = useState(existingFeedback?.classParticipation || 'Active');
  const [regularity, setRegularity] = useState(existingFeedback?.regularity || 'Regular');
  const [monthlyProgress, setMonthlyProgress] = useState(existingFeedback?.monthlyProgress || 'Improving');
  const [focusArea, setFocusArea] = useState(existingFeedback?.focusArea || 'Revision');

  // 3️⃣ Synthesized Parent Message
  const [customMessage, setCustomMessage] = useState(existingFeedback?.autoMessage || '');
  const [isManualEdit, setIsManualEdit] = useState(Boolean(existingFeedback?.autoMessage));
  const [tutorRemark, setTutorRemark] = useState(existingFeedback?.tutorRemark || '');

  // 4️⃣ Target Goal ("Next Month Goal")
  const defaultGoalSubject = latestMark?.subject || classSubjects[0] || 'Mathematics';
  const [goalSubject, setGoalSubject] = useState(existingFeedback?.goal?.subject || defaultGoalSubject);
  const [goalCurrentScore, setGoalCurrentScore] = useState(existingFeedback?.goal?.currentScore || latestPct);
  const [goalTargetScore, setGoalTargetScore] = useState(existingFeedback?.goal?.targetScore || Math.min(latestPct + 8, 98));
  const [goalMetric, setGoalMetric] = useState(existingFeedback?.goal?.metric || 'accuracy');

  // Accordion for extended rubric
  const [showExtendedRubric, setShowExtendedRubric] = useState(false);

  // Auto-generate message when 3-tap picks change (if not manually overridden)
  useEffect(() => {
    if (!isManualEdit) {
      const generated = generateParentFeedbackMessage({
        strength,
        improvementArea,
        nextStep,
        studentName: student.name,
        monthlyProgress
      });
      setCustomMessage(generated);
    }
  }, [strength, improvementArea, nextStep, student.name, monthlyProgress, isManualEdit]);

  const handleSave = () => {
    const feedbackObj = {
      id: existingFeedback?.id || generateNextId(),
      studentId: student.id,
      monthYear: currentMonthYear,
      date: new Date().toISOString().split('T')[0],
      strength,
      improvementArea,
      nextStep,
      academicPerformance,
      conceptUnderstanding,
      homeworkStatus,
      classParticipation,
      regularity,
      monthlyProgress,
      focusArea,
      autoMessage: customMessage,
      tutorRemark: tutorRemark.trim(),
      goal: {
        subject: goalSubject,
        currentScore: Number(goalCurrentScore),
        targetScore: Number(goalTargetScore),
        metric: goalMetric,
        description: `Improve ${goalSubject} ${goalMetric} from ${goalCurrentScore}% → ${goalTargetScore}%`,
        status: existingFeedback?.goal?.status || 'IN_PROGRESS',
        achievedScore: existingFeedback?.goal?.achievedScore || null
      },
      createdBy: currentUser?.name ? `${currentUser.name} (${currentUser.role || 'Faculty'})` : 'Hayagriva Faculty',
      createdAt: existingFeedback?.createdAt || new Date().toISOString()
    };

    onSaveFeedback(feedbackObj);
    onClose();
  };

  const handleWhatsAppSend = () => {
    if (isTeacher) return;
    const cleanPhone = (student.parentPhone || '').replace(/\D/g, '');
    const goalText = `🎯 *This Month's Goal:* Improve ${goalSubject} from ${goalCurrentScore}% → ${goalTargetScore}%`;

    const message = 
`🌟 *HAYAGRIVA TUTORIALS* 🌟
👩‍🏫 *Monthly Tutor Feedback & Improvement Plan*

👤 *Student:* ${student.name} (${studentClass?.name || 'Class 10'})
📅 *Month:* ${currentMonthYear}

⭐ *What child is doing well (Strength):* ${strength}
🎯 *Improvement Focus:* ${improvementArea}
🚀 *Recommended Action (Next Step):* ${nextStep}

${customMessage}

${goalText}

${tutorRemark ? `💬 *Tutor Remark:* "${tutorRemark}"\n` : ''}
— Hayagriva Tutorials, Classes 1 to 10 Tuition Academy
📞 Helpdesk: 9848266892`;

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content feedback-modal-content glass-card" style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Modal Header with Student Summary */}
        <div className="modal-header pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="avatar-circle" style={{ width: '44px', height: '44px', fontSize: '1.2rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="modal-title text-base font-bold text-white mb-0">{student.name}</h2>
                <span className="badge badge-class text-3xs">{studentClass?.name || student.classCode}</span>
              </div>
              <div className="text-xs text-muted">
                Roll No: <span className="font-mono text-white">{student.admissionNo}</span> • Attendance: <strong className="text-emerald">{attendanceRate}%</strong> • Latest Test: <strong className="text-primary">{latestPct}%</strong>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="feedback-body mt-4">
          
          {/* Section Banner */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-0">
                <Sparkles size={16} className="text-amber" />
                <span>3-Tap Child Improvement System</span>
              </h3>
              <p className="text-3xs text-muted mb-0">Tap 3 quick items below — System auto-crafts encouraging parent message</p>
            </div>
            <span className="badge badge-primary text-3xs font-mono">{currentMonthYear}</span>
          </div>

          {/* 1️⃣ Strength Selector */}
          <div className="selection-card mb-3 p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>1️⃣ Strength — What is the child doing well?</span>
              </span>
              <span className="text-3xs text-muted">Select 1</span>
            </div>
            <div className="chips-flex">
              {STRENGTH_OPTIONS.map(opt => {
                const active = strength === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStrength(opt.id)}
                    className={`tutor-chip ${active ? 'chip-active-emerald' : ''}`}
                    title={opt.desc}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2️⃣ Improvement Area Selector */}
          <div className="selection-card mb-3 p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber flex items-center gap-1.5">
                <Brain size={14} />
                <span>2️⃣ Improvement Area — What needs attention?</span>
              </span>
              <span className="text-3xs text-muted">Select 1</span>
            </div>
            <div className="chips-flex">
              {IMPROVEMENT_OPTIONS.map(opt => {
                const active = improvementArea === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setImprovementArea(opt.id)}
                    className={`tutor-chip ${active ? 'chip-active-amber' : ''}`}
                    title={opt.desc}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3️⃣ Next Step Selector */}
          <div className="selection-card mb-4 p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky flex items-center gap-1.5">
                <ArrowRight size={14} />
                <span>3️⃣ Next Step — What should the child do?</span>
              </span>
              <span className="text-3xs text-muted">Select 1</span>
            </div>
            <div className="chips-flex">
              {NEXT_STEP_OPTIONS.map(opt => {
                const active = nextStep === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNextStep(opt.id)}
                    className={`tutor-chip ${active ? 'chip-active-sky' : ''}`}
                    title={opt.desc}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🤖 Automatic Parent Message Preview */}
          <div className="auto-message-card mb-4 p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-primary" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  🤖 Auto-Generated Parent Message
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsManualEdit(!isManualEdit)}
                className="text-3xs text-indigo-300 hover:text-white underline"
              >
                {isManualEdit ? 'Auto-Generate' : 'Custom Edit'}
              </button>
            </div>

            {isManualEdit ? (
              <textarea
                className="form-input text-xs"
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Parent-friendly feedback message..."
              />
            ) : (
              <p className="text-xs text-indigo-100 leading-relaxed mb-0 font-medium">
                {customMessage}
              </p>
            )}

            <div className="mt-2.5 pt-2 border-t border-indigo-900/40">
              <input 
                type="text"
                className="form-input text-xs"
                style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
                placeholder="Add optional tutor remark (e.g. 'Very attentive in Maths class!')"
                value={tutorRemark}
                onChange={(e) => setTutorRemark(e.target.value)}
              />
            </div>
          </div>

          {/* ⭐ Next Month Goal Tracker */}
          <div className="goal-setting-card mb-4 p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber flex items-center gap-1.5">
                <Target size={15} />
                <span>🎯 This Month's Goal (Auto-compared after next test)</span>
              </span>
              <span className="text-3xs text-muted">Assess → Track → Compare</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div>
                <label className="text-3xs text-muted mb-1 block">Target Subject</label>
                <select 
                  className="form-select form-select-sm text-xs"
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                >
                  {classSubjects.map((sub, i) => (
                    <option key={i} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-3xs text-muted mb-1 block">Current Score %</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  className="form-input form-input-sm text-xs"
                  value={goalCurrentScore}
                  onChange={(e) => setGoalCurrentScore(e.target.value)}
                />
              </div>

              <div>
                <label className="text-3xs text-muted mb-1 block">Target Score %</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  className="form-input form-input-sm text-xs text-emerald font-bold"
                  value={goalTargetScore}
                  onChange={(e) => setGoalTargetScore(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-2 text-xs font-semibold text-amber flex items-center gap-1.5 bg-amber-950/30 p-2 rounded border border-amber-800/30">
              <TrendingUp size={14} />
              <span>Goal: Improve {goalSubject} from {goalCurrentScore}% → {goalTargetScore}%</span>
            </div>
          </div>

          {/* Extended Quick-Rubrics (Collapsible) */}
          <div className="rubric-toggle-card mb-4">
            <button
              type="button"
              className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-secondary hover:text-white"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}
              onClick={() => setShowExtendedRubric(!showExtendedRubric)}
            >
              <div className="flex items-center gap-2">
                <Award size={14} className="text-primary" />
                <span>Extended Academic Rubrics (Optional)</span>
              </div>
              {showExtendedRubric ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showExtendedRubric && (
              <div className="extended-rubrics-grid mt-2 p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)' }}>
                {/* Academic Performance */}
                <div className="mb-2">
                  <span className="text-3xs text-muted block mb-1">📚 Academic Performance:</span>
                  <div className="chips-flex">
                    {RUBRICS.academics.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAcademicPerformance(val.replace(/^[^\w]+/, '').trim())}
                        className={`mini-chip ${academicPerformance.toLowerCase().includes(val.toLowerCase().slice(2).trim()) ? 'active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Concept Understanding */}
                <div className="mb-2">
                  <span className="text-3xs text-muted block mb-1">🧠 Concept Understanding:</span>
                  <div className="chips-flex">
                    {RUBRICS.understanding.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setConceptUnderstanding(val.replace(/^[^\w]+/, '').trim())}
                        className={`mini-chip ${conceptUnderstanding.toLowerCase().includes(val.toLowerCase().slice(2).trim()) ? 'active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Homework Completion */}
                <div className="mb-2">
                  <span className="text-3xs text-muted block mb-1">📝 Homework Consistency:</span>
                  <div className="chips-flex">
                    {RUBRICS.homework.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setHomeworkStatus(val.replace(/^[^\w]+/, '').trim())}
                        className={`mini-chip ${homeworkStatus.toLowerCase().includes(val.toLowerCase().slice(2).trim()) ? 'active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class Participation */}
                <div className="mb-2">
                  <span className="text-3xs text-muted block mb-1">🙋 Class Participation:</span>
                  <div className="chips-flex">
                    {RUBRICS.participation.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setClassParticipation(val.replace(/^[^\w]+/, '').trim())}
                        className={`mini-chip ${classParticipation.toLowerCase().includes(val.toLowerCase().slice(2).trim()) ? 'active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Regularity */}
                <div className="mb-2">
                  <span className="text-3xs text-muted block mb-1">⏰ Attendance Regularity:</span>
                  <div className="chips-flex">
                    {RUBRICS.regularity.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRegularity(val.replace(/^[^\w]+/, '').trim())}
                        className={`mini-chip ${regularity.toLowerCase().includes(val.toLowerCase().slice(2).trim()) ? 'active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly Progress */}
                <div className="mb-2">
                  <span className="text-3xs text-muted block mb-1">📈 Monthly Progress Rate:</span>
                  <div className="chips-flex">
                    {RUBRICS.progress.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMonthlyProgress(val.replace(/^[^\w]+/, '').trim())}
                        className={`mini-chip ${monthlyProgress.toLowerCase().includes(val.toLowerCase().slice(2).trim()) ? 'active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Area (Select only 1) */}
                <div>
                  <span className="text-3xs text-muted block mb-1">🎯 Single Key Focus Area:</span>
                  <div className="chips-flex">
                    {RUBRICS.focusAreas.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFocusArea(val.replace(/^[^\w]+/, '').trim())}
                        className={`mini-chip ${focusArea.toLowerCase().includes(val.toLowerCase().slice(2).trim()) ? 'active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Actions */}
        <div className="modal-actions-flex pt-3" style={{ borderTop: '1px solid var(--border-subtle)', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          {!isTeacher ? (
            <button 
              type="button"
              className="btn btn-success"
              onClick={handleWhatsAppSend}
              style={{ background: '#10B981', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageSquare size={14} />
              <span>Send to Parent WhatsApp</span>
            </button>
          ) : (
            <div className="text-xs text-muted flex items-center gap-1.5" style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
              <span>🔒 Feedback will be published to Student & Parent Portal</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save & Publish Plan
            </button>
          </div>
        </div>

      </div>

      <style>{`
        .feedback-modal-content {
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .chips-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tutor-chip {
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tutor-chip:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .chip-active-emerald {
          background: rgba(16, 185, 129, 0.2) !important;
          border-color: #10B981 !important;
          color: #34D399 !important;
          font-weight: 700;
        }
        .chip-active-amber {
          background: rgba(245, 158, 11, 0.2) !important;
          border-color: #F59E0B !important;
          color: #FBBF24 !important;
          font-weight: 700;
        }
        .chip-active-sky {
          background: rgba(14, 165, 233, 0.2) !important;
          border-color: #0EA5E9 !important;
          color: #38BDF8 !important;
          font-weight: 700;
        }
        .mini-chip {
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          cursor: pointer;
        }
        .mini-chip:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }
        .mini-chip.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: #818CF8;
          color: white;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
