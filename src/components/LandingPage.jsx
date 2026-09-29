import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Users, 
  Clock, 
  Phone, 
  MessageCircle, 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  CheckSquare, 
  TrendingUp, 
  MapPin, 
  Mail, 
  Briefcase, 
  ChevronRight,
  UserCheck,
  Zap,
  LogIn
} from 'lucide-react';
import HayagrivaLogo from './HayagrivaLogo';

export default function LandingPage({ 
  onOpenLogin, 
  onOpenParentLogin,
  onOpenDemo, 
  onOpenTeacher,
  onOpenTeacherInquiry,
  classes = [],
  batches = []
}) {
  const [selectedStandardTab, setSelectedStandardTab] = useState('ALL');

  const handleOpenParentLogin = () => {
    if (onOpenParentLogin) {
      onOpenParentLogin();
    } else if (onOpenLogin) {
      onOpenLogin('PARENT');
    }
  };

  const handleOpenDemo = () => {
    if (onOpenDemo) onOpenDemo();
  };

  const handleOpenTeacher = () => {
    if (onOpenTeacherInquiry) {
      onOpenTeacherInquiry();
    } else if (onOpenTeacher) {
      onOpenTeacher();
    }
  };

  return (
    <div className="landing-page-root">
      {/* ============================================================== */}
      {/* 1. PUBLIC NAVIGATION BAR */}
      {/* ============================================================== */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          <div className="flex items-center gap-3">
            <HayagrivaLogo size={44} showGlow={true} />
            <div>
              <div className="brand-title flex items-center gap-2">
                <span className="font-extrabold text-white text-base md:text-lg tracking-tight">HAYAGRIVA TUTORIALS</span>
                <span className="badge badge-primary text-3xs font-mono">Classes 1 - X</span>
              </div>
              <p className="brand-subtitle text-3xs text-secondary hidden sm:block">
                State Board &amp; CBSE Tuition Academy • Conceptual Coaching
              </p>
            </div>
          </div>

          <nav className="landing-nav-links hidden md:flex items-center gap-6 text-xs font-semibold text-secondary">
            <a href="#about" className="nav-item">Why Hayagriva</a>
            <a href="#strategy" className="nav-item">One Day One Subject</a>
            <a href="#classes" className="nav-item">Classes 1 - 10</a>
            <a href="#features" className="nav-item">Methodology</a>
            <a href="#careers" className="nav-item">Faculty Careers</a>
            <a href="#contact" className="nav-item">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={handleOpenParentLogin}
              title="Parent / Student Portal Login"
            >
              <LogIn size={14} className="text-primary" />
              <span>Portal Login</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5 cta-glow-btn"
              onClick={handleOpenDemo}
            >
              <Sparkles size={14} />
              <span>Book Free Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION */}
      {/* ============================================================== */}
      <section className="landing-hero-section">
        <div className="hero-glow-sphere sphere-1" />
        <div className="hero-glow-sphere sphere-2" />

        <div className="hero-content-wrap">
          <div className="hero-badge inline-flex items-center gap-2 mb-4">
            <span className="pulsing-badge-dot" />
            <span className="text-xs font-bold text-amber-300">
              Admissions Open for Academic Year 2026 – 2027
            </span>
          </div>

          <h1 className="hero-main-title">
            Empowering Young Minds with <br />
            <span className="text-gradient-primary">Conceptual Mastery</span> &amp; Academic Excellence
          </h1>

          <p className="hero-lead-text">
            Specialized coaching for <strong>Classes 1 to 10 (State / SSC &amp; CBSE)</strong> with our proven <strong>"One Day, One Subject" focused strategy</strong>, weekly slip tests, personalized child improvement plans, and <strong>weekly WhatsApp reports</strong> for parents.
          </p>

          <div className="hero-actions-row flex items-center justify-center flex-wrap gap-3 mb-8">
            <button
              type="button"
              className="btn btn-primary btn-lg flex items-center gap-2 hero-primary-cta"
              onClick={handleOpenDemo}
            >
              <Sparkles size={18} />
              <span>Book a Free 2-Day Trial Demo</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-lg flex items-center gap-2"
              onClick={handleOpenParentLogin}
            >
              <UserCheck size={18} className="text-emerald" />
              <span>Enrolled Parent Login</span>
            </button>
          </div>

          {/* Key Academy Highlights Strip */}
          <div className="hero-features-strip">
            <div className="hero-feature-badge">
              <MessageCircle size={16} className="text-emerald" />
              <span>Weekly WhatsApp Reports</span>
            </div>
            <a href="#strategy" className="hero-feature-badge highlight-strategy" style={{ textDecoration: 'none' }}>
              <Sparkles size={16} className="text-amber-400" />
              <span>One Day, One Subject Strategy</span>
            </a>
            <div className="hero-feature-badge">
              <CheckCircle2 size={16} className="text-primary" />
              <span>Classes 1 to 10 (State &amp; CBSE)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. "ALREADY A MEMBER?" QUICK ACCESS BANNER */}
      {/* ============================================================== */}
      <section className="member-quick-access-section" id="portal-access">
        <div className="member-banner-card glass-card">
          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap justify-between">
            <div className="flex items-center gap-3.5">
              <div className="member-icon-badge">
                <GraduationCap size={24} className="text-emerald" />
              </div>
              <div>
                <span className="badge badge-success text-3xs font-bold uppercase mb-1">
                  Enrolled Students &amp; Families
                </span>
                <h3 className="text-base md:text-lg font-bold text-white mb-0.5">
                  Already a Member of Hayagriva Tutorials?
                </h3>
                <p className="text-xs text-secondary">
                  Access your child's live attendance calendar, weekly slip test scorecards, fee receipts, and homework tasks.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
              <button
                type="button"
                className="btn btn-primary flex-1 md:flex-initial flex items-center justify-center gap-2"
                onClick={handleOpenParentLogin}
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', borderColor: '#10B981', padding: '10px 24px' }}
              >
                <UserCheck size={16} />
                <span>Parent / Student Login</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. "ONE DAY, ONE SUBJECT" MASTERY STRATEGY SHOWCASE */}
      {/* ============================================================== */}
      <section className="landing-section strategy-section" id="strategy">
        <div className="section-header-center text-center mb-10">
          <span className="section-pill-tag bg-amber-soft text-amber">
            <Sparkles size={13} className="inline mr-1 text-amber-400" />
            Signature Academic Framework
          </span>
          <h2 className="section-heading-lg">
            The <span className="text-gradient-gold">"One Day, One Subject"</span> Strategy
          </h2>
          <p className="section-sub-text">
            Why teach 4 subjects in 2 hours superficially when your child can master 1 subject deeply every evening?
          </p>
        </div>

        {/* Comparison: Generic Tuitions vs Hayagriva Focused Way */}
        <div className="strategy-comparison-grid mb-10">
          <div className="comparison-card traditional-way">
            <div className="comparison-header">
              <span className="comp-tag comp-tag-danger">Generic Tuitions</span>
              <h3 className="comp-title">The Fragmented Approach</h3>
            </div>
            <ul className="comp-list">
              <li>
                <span className="comp-cross">✕</span>
                <div><strong>Scattered 25-Min Periods:</strong> Tutors rush through 4 subjects in 2 hours, leaving concepts half-explained.</div>
              </li>
              <li>
                <span className="comp-cross">✕</span>
                <div><strong>Cognitive Fatigue:</strong> Brain continuously switches between Maths, Science, Social &amp; English, preventing deep focus.</div>
              </li>
              <li>
                <span className="comp-cross">✕</span>
                <div><strong>Homework Overload:</strong> Multiple homework tasks given on the same evening lead to bedtime stress and copying.</div>
              </li>
              <li>
                <span className="comp-cross">✕</span>
                <div><strong>Superficial Learning:</strong> Doubts are left unaddressed because time runs out before problem sets are completed.</div>
              </li>
            </ul>
          </div>

          <div className="comparison-card hayagriva-way">
            <div className="strategy-badge-float">⭐ High-Retention Model</div>
            <div className="comparison-header">
              <span className="comp-tag comp-tag-success">Hayagriva Tutorials</span>
              <h3 className="comp-title">The "One Day, One Subject" Rule</h3>
            </div>
            <ul className="comp-list">
              <li>
                <span className="comp-check">✓</span>
                <div><strong>1.5 to 2 Hours Deep Immersion:</strong> Dedicated single-subject focus ensures concepts, derivations, and textbook exercises are fully completed.</div>
              </li>
              <li>
                <span className="comp-check">✓</span>
                <div><strong>100% Concept Retention:</strong> Students delve into root principles without distraction, retaining chapters long into board exams.</div>
              </li>
              <li>
                <span className="comp-check">✓</span>
                <div><strong>Single-Subject Evening Routine:</strong> Only that day's subject is assigned for a focused 25-minute practice session — zero backlog.</div>
              </li>
              <li>
                <span className="comp-check">✓</span>
                <div><strong>Saturday Slip Test Validation:</strong> Every Saturday tests the week's covered topics, followed by instant scorecards for parents.</div>
              </li>
            </ul>
          </div>
        </div>

        {/* Weekly Subject Rotation Timetable Matrix */}
        <div className="weekly-schedule-card glass-card">
          <div className="schedule-card-header flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <span className="badge badge-primary text-3xs font-mono uppercase mb-1">Weekly Academic Timetable</span>
              <h4 className="text-base md:text-lg font-bold text-white">How the Weekly Rotation Works (Classes 1 to 10)</h4>
            </div>
            <div className="text-xs text-muted flex items-center gap-2">
              <Clock size={14} className="text-amber" />
              <span>Evening Sessions: 5:00 PM – 8:30 PM | Morning: 6:00 AM – 8:30 AM</span>
            </div>
          </div>

          <div className="schedule-days-grid">
            <div className="schedule-day-box day-mon">
              <div className="day-name">MONDAY</div>
              <div className="subject-icon">📐</div>
              <div className="subject-name">Mathematics</div>
              <p className="subject-desc">Concept building, formula proofs, speed arithmetic &amp; textbook problem sets</p>
            </div>

            <div className="schedule-day-box day-tue">
              <div className="day-name">TUESDAY</div>
              <div className="subject-icon">⚡</div>
              <div className="subject-name">Physical Science</div>
              <p className="subject-desc">Physics laws, numericals, Chemistry chemical equations &amp; conceptual reasoning</p>
            </div>

            <div className="schedule-day-box day-wed">
              <div className="day-name">WEDNESDAY</div>
              <div className="subject-icon">🔬</div>
              <div className="subject-name">Biological Science</div>
              <p className="subject-desc">Botany &amp; Zoology, life processes, organ diagrams &amp; technical terminology</p>
            </div>

            <div className="schedule-day-box day-thu">
              <div className="day-name">THURSDAY</div>
              <div className="subject-icon">🌍</div>
              <div className="subject-name">Social Studies</div>
              <p className="subject-desc">History timelines, Geography map pointing, Civics, Economics &amp; point-wise answers</p>
            </div>

            <div className="schedule-day-box day-fri">
              <div className="day-name">FRIDAY</div>
              <div className="subject-icon">📖</div>
              <div className="subject-name">Languages &amp; Grammar</div>
              <p className="subject-desc">English grammar rules, comprehension, handwriting &amp; Second Language (Telugu/Hindi)</p>
            </div>

            <div className="schedule-day-box day-sat highlight-test">
              <div className="day-name text-amber-400">SATURDAY</div>
              <div className="subject-icon">📝</div>
              <div className="subject-name text-amber-300">Weekly Slip Test</div>
              <p className="subject-desc">Evaluation of the week's covered topics with instant percentage &amp; WhatsApp reports</p>
            </div>

            <div className="schedule-day-box day-sun highlight-doubt">
              <div className="day-name text-emerald-400">SUNDAY</div>
              <div className="subject-icon">🎯</div>
              <div className="subject-name text-emerald-300">Doubt Clarification</div>
              <p className="subject-desc">1-on-1 tutoring for slow learners, revision of weak topics &amp; board exam prep</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. ACADEMY METHODOLOGY & PILLARS */}
      {/* ============================================================== */}
      <section className="landing-section" id="about">
        <div className="section-header-center text-center mb-8">
          <span className="section-pill-tag">Why Hayagriva Tutorials</span>
          <h2 className="section-heading-lg">A Proven 4-Pillar Educational Methodology</h2>
          <p className="section-sub-text">
            We don't just teach the syllabus — we build strong conceptual foundations, eliminate exam fear, and keep parents closely informed.
          </p>
        </div>

        <div className="pillars-grid">
          {/* Pillar 1 */}
          <div className="pillar-feature-card glass-card">
            <div className="feature-icon-box bg-emerald-soft">
              <Calendar size={22} className="text-emerald" />
            </div>
            <h3 className="feature-title">Daily Attendance &amp; Regularity Calendar</h3>
            <p className="feature-desc">
              Every day's roll call is tracked digitally. Parents can review a full monthly calendar with highlighted absence days and tutor remarks.
            </p>
            <div className="feature-tag text-emerald">✓ Zero Truancy Guarantee</div>
          </div>

          {/* Pillar 2 */}
          <div className="pillar-feature-card glass-card">
            <div className="feature-icon-box bg-primary-soft">
              <Award size={22} className="text-primary" />
            </div>
            <h3 className="feature-title">Weekly Slip Tests &amp; Scorecards</h3>
            <p className="feature-desc">
              Regular testing solidifies exam confidence. Scorecards are generated with detailed percentages, grades, and shared directly on WhatsApp.
            </p>
            <div className="feature-tag text-primary">✓ Weekly WhatsApp Reports</div>
          </div>

          {/* Pillar 3 */}
          <div className="pillar-feature-card glass-card">
            <div className="feature-icon-box bg-amber-soft">
              <TrendingUp size={22} className="text-amber" />
            </div>
            <h3 className="feature-title">Child Improvement Plans</h3>
            <p className="feature-desc">
              Personalized 3-pillar monthly evaluations identifying the child's active strength, focus improvement area, and daily 5-problem home routine.
            </p>
            <div className="feature-tag text-amber">✓ Tailored to Every Student</div>
          </div>

          {/* Pillar 4 */}
          <div className="pillar-feature-card glass-card">
            <div className="feature-icon-box bg-sky-soft">
              <CheckSquare size={22} className="text-sky" />
            </div>
            <h3 className="feature-title">Daily Homework &amp; Topic Retainers</h3>
            <p className="feature-desc">
              Classroom topics and homework tasks are logged daily. 25 minutes of structured evening homework prevents backlog and exam cramming.
            </p>
            <div className="feature-tag text-sky">✓ Structured Evening Practice</div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CLASSES & CURRICULUM OFFERED */}
      {/* ============================================================== */}
      <section className="landing-section" id="classes">
        <div className="section-header-center text-center mb-8">
          <span className="section-pill-tag">Comprehensive Programs</span>
          <h2 className="section-heading-lg">Coaching for Classes 1 to 10</h2>
          <p className="section-sub-text">
            Specialized curriculum designed for State Board (SSC) and CBSE syllabi with dedicated morning and evening timings.
          </p>
        </div>

        <div className="classes-showcase-grid">
          {/* Primary */}
          <div className="class-tier-card glass-card">
            <div className="tier-header">
              <span className="tier-badge">Foundation Wing</span>
              <h3 className="tier-title">Classes 1 to 5</h3>
              <p className="tier-sub">Building fundamental habits &amp; arithmetic speed</p>
            </div>
            <ul className="tier-benefits-list">
              <li><CheckCircle2 size={14} className="text-emerald" /> Core Mathematics &amp; Speed Tables</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> General Science &amp; Environmental Studies</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> English Grammar, Reading &amp; Handwriting</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> Hindi &amp; Telugu Language Support</li>
            </ul>
            <button 
              type="button" 
              className="btn btn-secondary w-full text-xs mt-4"
              onClick={handleOpenDemo}
            >
              Book Class 1-5 Demo
            </button>
          </div>

          {/* Middle */}
          <div className="class-tier-card glass-card">
            <div className="tier-header">
              <span className="tier-badge bg-primary-soft text-primary">Middle Wing</span>
              <h3 className="tier-title">Classes 6 to 8</h3>
              <p className="tier-sub">Conceptual clarity across Science &amp; Advanced Maths</p>
            </div>
            <ul className="tier-benefits-list">
              <li><CheckCircle2 size={14} className="text-emerald" /> Physics, Chemistry &amp; Biology Basics</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> Pre-Algebra, Geometry &amp; Word Problems</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> Social Studies &amp; Conceptual Geography</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> Weekly Chapter Slip Tests</li>
            </ul>
            <button 
              type="button" 
              className="btn btn-secondary w-full text-xs mt-4"
              onClick={handleOpenDemo}
            >
              Book Class 6-8 Demo
            </button>
          </div>

          {/* High School Board */}
          <div className="class-tier-card glass-card tier-highlight-featured">
            <div className="featured-flag">🌟 Most Popular</div>
            <div className="tier-header">
              <span className="tier-badge bg-amber-soft text-amber">Board Exam Special</span>
              <h3 className="tier-title">Classes 9 &amp; 10 (SSC / CBSE)</h3>
              <p className="tier-sub">Intensive board preparation &amp; 10/10 GPA target</p>
            </div>
            <ul className="tier-benefits-list">
              <li><CheckCircle2 size={14} className="text-emerald" /> Complete Board Syllabus Mastery</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> Chapter-wise Problem Solving &amp; Derivations</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> 10+ Pre-Final Mock Exams &amp; Model Papers</li>
              <li><CheckCircle2 size={14} className="text-emerald" /> Time-Management &amp; Presentation Coaching</li>
            </ul>
            <button 
              type="button" 
              className="btn btn-primary w-full text-xs mt-4"
              onClick={handleOpenDemo}
            >
              Book Class 9-10 Demo
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. "JOIN OUR FACULTY TEAM" TEACHER CAREERS SECTION */}
      {/* ============================================================== */}
      <section className="landing-section careers-section" id="careers">
        <div className="careers-banner-card glass-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="title-icon-badge bg-primary-soft">
                  <Briefcase size={18} className="text-primary" />
                </div>
                <span className="badge badge-primary text-xs font-bold uppercase">
                  Faculty Recruitment 2026
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                Passionate About Teaching? <br />
                <span className="text-gradient-primary">Join the Hayagriva Faculty Team</span>
              </h2>

              <p className="text-sm text-secondary leading-relaxed mb-6">
                We are actively looking for dedicated, energetic tutors for <strong>Classes 1 to 10</strong> across Mathematics, Physical Science, Biological Science, Social Studies, and Languages. Enjoy a professional, respectful teaching culture with competitive remuneration.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  className="btn btn-primary btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
                  onClick={handleOpenTeacher}
                >
                  <Briefcase size={16} />
                  <span>Submit Teacher Application</span>
                  <ArrowRight size={14} />
                </button>

                <a
                  href="https://wa.me/919848266892?text=Hello%20Director,%20I%20am%20interested%20in%20joining%20Hayagriva%20Tutorials%20as%20Faculty."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-md flex items-center justify-center gap-2 w-full sm:w-auto text-emerald"
                >
                  <MessageCircle size={16} />
                  <span>Direct WhatsApp Enquiry</span>
                </a>
              </div>
            </div>

            <div className="careers-perks-box p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Star size={16} className="text-amber" />
                Why Tutors Love Working With Us:
              </h4>

              <div className="space-y-3 text-xs text-secondary">
                <div className="flex items-start gap-2.5">
                  <div className="perk-check">✓</div>
                  <div>
                    <strong className="text-white">Structured Batch Management:</strong> Small, disciplined batches of max 25 students.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="perk-check">✓</div>
                  <div>
                    <strong className="text-white">Digital Tools Provided:</strong> Automated attendance, slip-test mark recording, and instant scorecards.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="perk-check">✓</div>
                  <div>
                    <strong className="text-white">Flexible Timing Options:</strong> Dedicated morning or evening batch schedules to suit your routine.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="perk-check">✓</div>
                  <div>
                    <strong className="text-white">Timely Remuneration:</strong> Transparent, prompt compensation with academic performance incentives.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. CONTACT & LOCATION */}
      {/* ============================================================== */}
      <section className="landing-section" id="contact">
        <div className="contact-summary-card glass-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="contact-col">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} className="text-rose" />
                <h4 className="font-bold text-white text-sm">Academy Location</h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                HAYAGRIVA TUTORIALS ACADEMY<br />
                Near Main Road, Tuition Center Hub<br />
                Classes 1 to 10 Coaching Center
              </p>
            </div>

            <div className="contact-col">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={18} className="text-emerald" />
                <h4 className="font-bold text-white text-sm">Contact &amp; Admissions</h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Helpline: <strong className="text-white font-mono">+91 9848266892</strong><br />
                WhatsApp: <a href="https://wa.me/919848266892" target="_blank" rel="noreferrer" className="text-emerald font-semibold">+91 9848266892</a><br />
                Academic Coordinator Available Daily
              </p>
            </div>

            <div className="contact-col">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-amber" />
                <h4 className="font-bold text-white text-sm">Academy Operating Hours</h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Morning Batches: <strong>6:00 AM – 8:30 AM</strong><br />
                Evening Batches: <strong>5:00 PM – 8:30 PM</strong><br />
                Sunday: Special Mock Exams &amp; Doubt Sessions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. FOOTER */}
      {/* ============================================================== */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-t border-slate-800">
            <div className="flex items-center gap-2.5">
              <HayagrivaLogo size={28} />
              <span className="text-xs text-muted">
                &copy; {new Date().getFullYear()} HAYAGRIVA TUTORIALS. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-secondary">
              <button 
                type="button"
                className="hover:text-white transition-colors"
                onClick={handleOpenParentLogin}
              >
                Parent Portal
              </button>
              <button 
                type="button"
                className="hover:text-white transition-colors"
                onClick={handleOpenDemo}
              >
                Free Demo
              </button>
              <button 
                type="button"
                className="hover:text-white transition-colors"
                onClick={handleOpenTeacher}
              >
                Faculty Careers
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* COMPONENT STYLES */}
      {/* ============================================================== */}
      <style>{`
        .landing-page-root {
          min-height: 100vh;
          width: 100%;
          background: #0B0F19;
          color: #F8FAFC;
          overflow-x: hidden;
          font-family: var(--font-body);
        }

        /* Navbar */
        .landing-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 0;
        }
        .landing-nav-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-item:hover {
          color: #FFFFFF;
        }
        .cta-glow-btn {
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
          box-shadow: 0 0 16px rgba(79, 70, 229, 0.4);
          font-weight: 700;
        }

        /* Hero */
        .landing-hero-section {
          position: relative;
          padding: 70px 20px 50px 20px;
          text-align: center;
          max-width: 1100px;
          margin: 0 auto;
          overflow: hidden;
        }
        .hero-glow-sphere {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .sphere-1 {
          width: 320px;
          height: 320px;
          background: rgba(99, 102, 241, 0.15);
          top: -40px;
          left: 10%;
        }
        .sphere-2 {
          width: 300px;
          height: 300px;
          background: rgba(16, 185, 129, 0.12);
          bottom: 20px;
          right: 10%;
        }
        .hero-content-wrap {
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 6px 14px;
          border-radius: 9999px;
        }
        .pulsing-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 8px #F59E0B;
          animation: pulse 1.5s infinite;
        }
        .hero-main-title {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          line-height: 1.18;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 18px;
          letter-spacing: -0.025em;
        }
        @media (min-width: 768px) {
          .hero-main-title { font-size: 3.4rem; }
        }
        .text-gradient-primary {
          background: linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #34D399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-lead-text {
          font-size: 1.05rem;
          color: #94A3B8;
          max-width: 760px;
          margin: 0 auto 30px auto;
          line-height: 1.6;
        }
        .hero-primary-cta {
          font-weight: 800;
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.5);
          padding: 12px 24px;
        }

        /* Hero Highlights Strip */
        .hero-features-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          max-width: 820px;
          margin: 0 auto;
        }
        .hero-feature-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          color: #E2E8F0;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          transition: all 0.2s ease;
        }
        .hero-feature-badge:hover {
          border-color: rgba(16, 185, 129, 0.4);
          transform: translateY(-2px);
          background: rgba(17, 24, 39, 0.85);
        }
        .highlight-strategy {
          border-color: rgba(245, 158, 11, 0.4) !important;
          background: rgba(245, 158, 11, 0.12) !important;
          color: #FDE68A !important;
        }
        .highlight-strategy:hover {
          border-color: rgba(245, 158, 11, 0.8) !important;
          background: rgba(245, 158, 11, 0.22) !important;
        }

        /* Strategy Section */
        .strategy-comparison-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          max-width: 1140px;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .strategy-comparison-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .comparison-card {
          border-radius: var(--radius-lg);
          padding: 24px;
          position: relative;
        }
        .traditional-way {
          background: rgba(30, 41, 59, 0.45);
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .hayagriva-way {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%);
          border: 1.5px solid rgba(16, 185, 129, 0.4);
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.12);
        }
        .strategy-badge-float {
          position: absolute;
          top: -12px;
          right: 20px;
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
          color: white;
          font-size: 0.725rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .comp-tag {
          display: inline-block;
          font-size: 0.68rem;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .comp-tag-danger {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .comp-tag-success {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .comp-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
        }
        .comp-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-size: 0.8125rem;
          color: #94A3B8;
        }
        .comp-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.5;
        }
        .comp-cross {
          color: #EF4444;
          font-weight: 800;
          flex-shrink: 0;
        }
        .comp-check {
          color: #10B981;
          font-weight: 800;
          flex-shrink: 0;
        }
        .text-gradient-gold {
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #34D399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Schedule days */
        .weekly-schedule-card {
          padding: 24px;
        }
        .schedule-days-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .schedule-days-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .schedule-days-grid {
            grid-template-columns: repeat(7, 1fr);
          }
        }
        .schedule-day-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          padding: 14px 10px;
          text-align: center;
          transition: all 0.2s ease;
        }
        .schedule-day-box:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.35);
        }
        .day-name {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #94A3B8;
          margin-bottom: 6px;
        }
        .subject-icon {
          font-size: 1.4rem;
          margin-bottom: 6px;
        }
        .subject-name {
          font-size: 0.825rem;
          font-weight: 700;
          color: white;
          margin-bottom: 6px;
        }
        .subject-desc {
          font-size: 0.68rem;
          color: #64748B;
          line-height: 1.35;
        }
        .highlight-test {
          border-color: rgba(245, 158, 11, 0.35);
          background: rgba(245, 158, 11, 0.06);
        }
        .highlight-doubt {
          border-color: rgba(16, 185, 129, 0.35);
          background: rgba(16, 185, 129, 0.06);
        }

        /* Member Banner */
        .member-quick-access-section {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 20px 40px 20px;
        }
        .member-banner-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%);
          border: 1.5px solid rgba(16, 185, 129, 0.35);
          border-radius: var(--radius-lg);
          padding: 22px 26px;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.1);
        }
        .member-icon-badge {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        /* General Sections */
        .landing-section {
          max-width: 1140px;
          margin: 0 auto;
          padding: 50px 20px;
        }
        .section-pill-tag {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-400);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: rgba(99, 102, 241, 0.15);
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 8px;
        }
        .section-heading-lg {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 10px;
        }
        .section-sub-text {
          font-size: 0.95rem;
          color: var(--text-secondary);
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Pillars Grid */
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
        }
        @media (min-width: 640px) {
          .pillars-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .pillars-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .pillar-feature-card {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: rgba(17, 24, 39, 0.7);
        }
        .feature-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .feature-title {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 8px;
        }
        .feature-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin-bottom: 16px;
          flex: 1;
        }
        .feature-tag {
          font-size: 0.72rem;
          font-weight: 700;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }

        /* Class Showcase */
        .classes-showcase-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
        }
        @media (min-width: 768px) {
          .classes-showcase-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .class-tier-card {
          padding: 26px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          background: rgba(17, 24, 39, 0.7);
        }
        .tier-highlight-featured {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.15);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(17, 24, 39, 0.9) 100%);
        }
        .featured-flag {
          position: absolute;
          top: -12px;
          right: 20px;
          background: var(--amber-500);
          color: #000;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 9999px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
        }
        .tier-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          display: inline-block;
          margin-bottom: 8px;
        }
        .tier-title {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 4px;
        }
        .tier-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .tier-benefits-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.8125rem;
          color: #CBD5E1;
        }
        .tier-benefits-list li {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Careers Section */
        .careers-banner-card {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%);
          border: 1.5px solid rgba(99, 102, 241, 0.35);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: 0 0 35px rgba(79, 70, 229, 0.12);
        }
        .perk-check {
          color: #34D399;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* Contact & Footer */
        .contact-summary-card {
          background: rgba(17, 24, 39, 0.6);
          border-radius: var(--radius-lg);
          padding: 28px;
        }
        .landing-footer {
          background: #070A12;
        }
        .landing-footer-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 20px;
        }
      `}</style>
    </div>
  );
}
