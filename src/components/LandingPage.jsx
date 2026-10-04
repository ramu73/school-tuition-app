import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  UserCheck,
  Zap,
  LogIn,
  Menu,
  X,
  Video,
  Target,
  Check
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. HERO SLIDING WINDOW STATE
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const heroSlideTimerRef = useRef(null);

  // 2. "WHY CHOOSE US" SLIDING SHOWCASE STATE
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  const heroSlides = [
    {
      id: 'math',
      image: '/showcase/math-coaching.jpg',
      category: 'SIGNATURE FOCUS',
      title: 'Special Focus on Mathematics',
      subtitle: 'Strong Concepts • Smart Methods • Better Results',
      description: 'Building deep foundational arithmetic, Pre-Algebra, Geometry proofs, and formula mastery with step-by-step guidance.',
      badgeText: '⭐ 98.4% Top Grades',
      badgeColor: 'amber',
      metricNumber: '10/10',
      metricLabel: 'GPA Target',
      pillIcon: '📐',
      pillLabel: 'Maths'
    },
    {
      id: 'oneday',
      image: '/showcase/individual-attention.jpg',
      category: 'REVOLUTIONARY FRAMEWORK',
      title: 'The "One Day, One Subject" Rule',
      subtitle: '1.5 to 2 Hours Deep Immersion Every Evening',
      description: 'Zero cognitive fatigue. 100% concept retention: Mon (English), Tue (General Science), Wed (Telugu), Thu (Social), Fri (Mathematics) & Sat (Weekly Test).',
      badgeText: '🎯 100% Retention',
      badgeColor: 'emerald',
      metricNumber: '25 Max',
      metricLabel: 'Per Batch',
      pillIcon: '🎯',
      pillLabel: 'One Day'
    },
    {
      id: 'science',
      image: '/showcase/science-concept.jpg',
      category: 'CONCEPTUAL CLARITY',
      title: 'Concept-Based Science Learning',
      subtitle: 'Physics, Chemistry & Biology Brought to Life',
      description: 'Visual demonstrations, ray optics experiments, chemical reaction proofs, and anatomical models eliminate rote memorization.',
      badgeText: '🔬 Real Experiential',
      badgeColor: 'sky',
      metricNumber: '100%',
      metricLabel: 'Syllabus Clarity',
      pillIcon: '🔬',
      pillLabel: 'Science'
    },
    {
      id: 'tests',
      image: '/showcase/exam-success.jpg',
      category: 'WEEKLY ACCOUNTABILITY',
      title: 'Weekly Tests & WhatsApp Scorecards',
      subtitle: 'Track Your Child\'s Progress Every Single Week',
      description: 'Saturday slip tests benchmark syllabus retention. Detailed percentage scorecards and improvement remarks sent directly to parents.',
      badgeText: '📱 Instant WhatsApp',
      badgeColor: 'primary',
      metricNumber: '52+',
      metricLabel: 'Weekly Tests',
      pillIcon: '🏆',
      pillLabel: 'Tests'
    }
  ];

  // Auto-slide hero window every 5.5 seconds (pauses on hover)
  useEffect(() => {
    if (!isHeroPaused) {
      heroSlideTimerRef.current = setInterval(() => {
        setCurrentHeroSlide(prev => (prev + 1) % heroSlides.length);
      }, 5500);
    }
    return () => {
      if (heroSlideTimerRef.current) clearInterval(heroSlideTimerRef.current);
    };
  }, [isHeroPaused, heroSlides.length]);

  const handleNextHeroSlide = () => {
    setCurrentHeroSlide((currentHeroSlide + 1) % heroSlides.length);
  };

  const handlePrevHeroSlide = () => {
    setCurrentHeroSlide((currentHeroSlide - 1 + heroSlides.length) % heroSlides.length);
  };

  // Feature Showcase Tabs (Why Choose Us)
  const featureShowcaseTabs = [
    {
      id: 'faculty',
      title: 'Experienced & Dedicated Faculty',
      tag: 'Qualified Mentors',
      image: '/showcase/individual-attention.jpg',
      heading: 'Passionate Teachers Who Care For Every Single Child',
      desc: 'Our faculty members are subject specialists who don\'t just teach formulas — they ignite genuine curiosity, remove subject fear, and guide students with patience and warmth.',
      benefits: [
        'Dedicated subject experts for Classes 1 to 10 (SSC & CBSE)',
        'Friendly, respectful, and zero-fear classroom environment',
        'Personalized 1-on-1 mentoring & continuous doubt clarification',
        'Continuous teacher-parent communication regarding growth'
      ],
      quote: '"We don\'t just teach the syllabus — we build lifelong academic confidence."',
      highlightStat: '10+ Yrs',
      highlightLabel: 'Average Faculty Experience'
    },
    {
      id: 'attention',
      title: 'Individual Attention & Small Batches',
      tag: 'Personal Mentoring',
      image: '/showcase/math-coaching.jpg',
      heading: 'Understanding Each Child\'s Unique Learning Pace',
      desc: 'No student gets left behind in large, chaotic rooms. We strictly cap class size at max 25 students, ensuring every child receives direct attention from the tutor.',
      benefits: [
        'Strict batch limit of max 25 students for personalized care',
        'Active monitoring of every student\'s classroom notebook',
        'Personalized Child Improvement Plans generated monthly',
        'Identifies strengths and resolves specific weak areas early'
      ],
      quote: '"Every child is unique. When taught at their pace, excellence is inevitable."',
      highlightStat: '1 : 20',
      highlightLabel: 'Teacher-Student Ratio'
    },
    {
      id: 'tests',
      title: 'Regular Tests & Live Evaluation',
      tag: 'Weekly Progress',
      image: '/showcase/exam-success.jpg',
      heading: 'Saturday Slip Tests & Instant Parent WhatsApp Reports',
      desc: 'Periodic testing removes exam phobia. Every Saturday, students take a structured slip test on the week\'s topics. Parents receive detailed scorecards right on WhatsApp.',
      benefits: [
        'Weekly Saturday Slip Tests testing real conceptual mastery',
        'Detailed percentage scorecards with grades and teacher remarks',
        'Automated WhatsApp reports sent directly to parents',
        '10+ Pre-Final Mock Board Exams for Classes 9 & 10'
      ],
      quote: '"Consistent testing builds calm confidence when real board exams arrive."',
      highlightStat: '100%',
      highlightLabel: 'Transparent Reporting'
    },
    {
      id: 'cctv',
      title: 'Safe & Secure Environment (CCTV)',
      tag: 'Safety & Discipline',
      image: '/showcase/science-concept.jpg',
      heading: 'Disciplined, 100% Monitored, Distraction-Free Study Space',
      desc: 'Parents deserve complete peace of mind. Our academy is fully monitored with high-resolution CCTV cameras, maintaining strict safety, discipline, and focused study habits.',
      benefits: [
        'Full CCTV camera surveillance across all classrooms and lobby',
        'Safe, well-lit, centrally located campus in Srinagar Colony',
        'Digital attendance tracking with absence alerts to parents',
        'Dedicated morning (6-8:30 AM) and evening (5-8:30 PM) sessions'
      ],
      quote: '"A disciplined, safe environment is the true bedrock of academic growth."',
      highlightStat: '24/7',
      highlightLabel: 'CCTV Security Coverage'
    }
  ];

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
          <div className="landing-brand-wrap">
            <HayagrivaLogo size={36} showGlow={true} />
            <div className="landing-brand-text">
              <div className="brand-title-row">
                <span className="brand-main-name">HAYAGRIVA</span>
                <span className="brand-classes-badge">Classes 1–X</span>
              </div>
              <p className="brand-sub-desc">
                State Board &amp; CBSE • Conceptual Tuition Academy
              </p>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#showcase" className="nav-item">Academy Showcase</a>
            <a href="#strategy" className="nav-item highlight-nav">One Day One Subject</a>
            <a href="#we-offer" className="nav-item">We Offer</a>
            <a href="#why-choose" className="nav-item">Why Choose Us</a>
            <a href="#classes" className="nav-item">Classes 1 - 10</a>
            <a href="#contact" className="nav-item">Contact &amp; Location</a>
          </nav>

          <div className="landing-nav-actions">
            {/* The Dedicated Single Place for Parental Login */}
            <button
              type="button"
              className="nav-action-parental-login"
              onClick={handleOpenParentLogin}
              title="Parental Login"
            >
              <UserCheck size={14} className="text-emerald" />
              <span className="nav-btn-text-full">Parental Login</span>
              <span className="nav-btn-text-short">Login</span>
            </button>

            {/* The Dedicated Top Call-to-Action for Enroll Your Child */}
            <button
              type="button"
              className="nav-action-demo-btn cta-glow-btn"
              onClick={handleOpenDemo}
              title="Enroll Your Child"
            >
              <Sparkles size={13} />
              <span className="nav-btn-text-full">Enroll Your Child</span>
              <span className="nav-btn-text-short">Enroll</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <a 
              href="#showcase" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Academy Showcase</span>
              <ChevronRight size={14} className="text-muted" />
            </a>
            <a 
              href="#strategy" 
              className="mobile-nav-link strategy-highlight"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <Zap size={16} className="text-amber" />
                <span>One Day, One Subject Timetable</span>
              </span>
              <span className="badge badge-warning text-3xs">Daily Focus</span>
            </a>
            <a 
              href="#we-offer" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>5 Core Offerings</span>
              <ChevronRight size={14} className="text-muted" />
            </a>
            <a 
              href="#why-choose" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Why Choose Us</span>
              <ChevronRight size={14} className="text-muted" />
            </a>
            <a 
              href="#classes" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Classes 1 to 10 Curriculum</span>
              <ChevronRight size={14} className="text-muted" />
            </a>
            <a 
              href="#contact" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Contact &amp; Location</span>
              <ChevronRight size={14} className="text-muted" />
            </a>

            <div className="mobile-drawer-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center justify-center gap-1.5"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenParentLogin();
                }}
              >
                <UserCheck size={14} className="text-emerald" />
                <span>Parental Login</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center justify-center gap-1.5 cta-glow-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenDemo();
                }}
              >
                <Sparkles size={14} />
                <span>Enroll Your Child</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 2. GRAND HERO SECTION WITH MOBILE-FIRST SLIDING SHOWCASE */}
      {/* ============================================================== */}
      <section className="grand-hero-section" id="showcase">
        <div className="hero-glow-sphere sphere-1" />
        <div className="hero-glow-sphere sphere-2" />

        <div className="grand-hero-container">
          {/* Hero Header & Value Proposition */}
          <div className="hero-lead-col">
            <div className="hero-badge inline-flex items-center gap-2 mb-3">
              <span className="pulsing-badge-dot" />
              <span className="text-xs font-bold text-amber-300">
                Admissions Open 2026–2027 • Hyderabad
              </span>
            </div>

            <h1 className="hero-headline">
              Building Strong <br />
              <span className="text-gradient-gold">Foundations</span> for <br />
              <span className="text-gradient-primary">Brighter Futures</span>
            </h1>

            {/* Desktop-only description & CTAs (Shown on desktop alongside slider) */}
            <div className="hero-desktop-content-block">
              <p className="hero-description">
                Specialized coaching for <strong>Classes 1 to 10 (State / SSC &amp; CBSE)</strong> with special focus on <strong>Mathematics</strong>, our signature <strong>"One Day, One Subject"</strong> deep immersion framework, and <strong>weekly WhatsApp reports</strong>.
              </p>

              <div className="hero-actions-cluster flex items-center flex-wrap gap-3 mb-6">
                <a
                  href="#classes"
                  className="btn btn-primary btn-lg flex items-center gap-2.5 hero-primary-cta cta-glow-btn"
                >
                  <BookOpen size={18} />
                  <span>Explore Classes 1 to 10</span>
                  <ArrowRight size={16} />
                </a>

                <a
                  href="https://wa.me/919848266892?text=Hello%20Hayagriva%20Tutorials,%20I%20would%20like%20to%20inquire%20about%20admissions%20for%20my%20child."
                  target="_blank"
                  rel="noreferrer"
                  className="quick-call-link flex items-center gap-2 text-emerald font-semibold"
                  title="Direct WhatsApp Chat"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp Inquiry: 9848266892</span>
                </a>
              </div>

              {/* Desktop Trust Badges */}
              <div className="hero-trust-badges">
                <div className="trust-badge-item">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Classes 1 to 10 (SSC &amp; CBSE)</span>
                </div>
                <div className="trust-badge-item">
                  <Video size={16} className="text-sky" />
                  <span>CCTV Monitored Facility</span>
                </div>
                <div className="trust-badge-item">
                  <Award size={16} className="text-amber" />
                  <span>Saturday Weekly Tests</span>
                </div>
                <a 
                  href="#strategy" 
                  className="trust-badge-item" 
                  style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#FCD34D', textDecoration: 'none' }}
                  title="View Weekly Subject Rotation"
                >
                  <Calendar size={15} className="text-amber" />
                  <span>Mon (Eng) • Tue (Sci) • Wed (Tel) • Thu (Soc) • Fri (Math) • Sat (Test)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Hero Sliding Window Showcase */}
          <div 
            className="hero-slider-window-col"
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
          >
            <div className="slide-window-frame glass-card">
              {/* Slider Image Container */}
              <div className="slide-media-wrap">
                {heroSlides.map((slide, index) => (
                  <div 
                    key={slide.id}
                    className={`slide-item ${index === currentHeroSlide ? 'active-slide' : ''}`}
                    style={{
                      opacity: index === currentHeroSlide ? 1 : 0,
                      transform: index === currentHeroSlide ? 'scale(1)' : 'scale(1.04)',
                      transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="slide-image" 
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="slide-overlay-gradient" />
                  </div>
                ))}

                {/* Floating Top Badge */}
                <div className="slide-floating-top-badge">
                  <span className={`pill-badge badge-${heroSlides[currentHeroSlide].badgeColor}`}>
                    {heroSlides[currentHeroSlide].badgeText}
                  </span>
                </div>


                {/* Slider Nav Arrows */}
                <button 
                  type="button"
                  className="slide-nav-arrow arrow-prev"
                  onClick={handlePrevHeroSlide}
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  type="button"
                  className="slide-nav-arrow arrow-next"
                  onClick={handleNextHeroSlide}
                  aria-label="Next Slide"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Slide Caption Box Overlaid */}
                <div className="slide-caption-glass-box">
                  <span className="caption-category">
                    {heroSlides[currentHeroSlide].category}
                  </span>
                  <h3 className="caption-title">
                    {heroSlides[currentHeroSlide].title}
                  </h3>
                  <div className="caption-subtitle">
                    {heroSlides[currentHeroSlide].subtitle}
                  </div>
                  <p className="caption-desc">
                    {heroSlides[currentHeroSlide].description}
                  </p>
                </div>
              </div>

              {/* Slider Bottom Tabs / Selector Bar */}
              <div className="slide-selector-tabs-bar">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`slide-tab-pill ${index === currentHeroSlide ? 'active' : ''}`}
                    onClick={() => setCurrentHeroSlide(index)}
                  >
                    <span className="tab-pill-icon">{slide.pillIcon}</span>
                    <span className="tab-pill-text">{slide.pillLabel}</span>
                    {index === currentHeroSlide && (
                      <span className="active-pill-glow" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile-Only Description & CTAs Block (Appears directly below the slider on mobile) */}
          <div className="hero-mobile-content-block">
            <p className="hero-description mobile-hero-desc">
              Specialized coaching for <strong>Classes 1 to 10 (State / SSC &amp; CBSE)</strong> with special focus on <strong>Mathematics</strong>, our signature <strong>"One Day, One Subject"</strong> framework, and <strong>weekly WhatsApp reports</strong>.
            </p>


            <div className="mobile-hero-cta-cluster flex flex-col gap-2.5 mb-3">
              <a
                href="#classes"
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 cta-glow-btn font-bold text-sm"
              >
                <BookOpen size={16} />
                <span>Explore Classes 1 to 10</span>
                <ArrowRight size={15} />
              </a>

              <a
                href="https://wa.me/919848266892?text=Hello%20Hayagriva%20Tutorials,%20I%20would%20like%20to%20inquire%20about%20admissions%20for%20my%20child."
                target="_blank"
                rel="noreferrer"
                className="mobile-whatsapp-banner flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} className="text-emerald" />
                <span>Direct WhatsApp: <strong>9848266892</strong></span>
              </a>
            </div>

            <div className="mobile-trust-chips-row">
              <div className="mobile-chip">✓ Classes 1–10</div>
              <div className="mobile-chip">📹 CCTV Monitored</div>
              <div className="mobile-chip">🏆 Saturday Weekly Tests</div>
              <a href="#strategy" className="mobile-chip" style={{ color: '#FCD34D', textDecoration: 'none' }}>
                📅 Mon–Sat Subject Rotation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. "ONE DAY, ONE SUBJECT" WEEKLY TIMETABLE MATRIX */}
      {/* ============================================================== */}
      <section className="weekly-timetable-section" id="strategy">
        <div className="section-container">
          <div className="section-header-center text-center mb-8">
            <span className="section-pill-tag bg-amber-soft text-amber">
              <Zap size={13} className="inline mr-1 text-amber-400" />
              Signature Academic Framework
            </span>
            <h2 className="section-heading-lg">
              The <span className="text-gradient-gold">"One Day, One Subject"</span> Weekly Rotation
            </h2>
            <p className="section-sub-text">
              Why rush through 4 subjects in 2 hours superficially when your child can master 1 subject deeply every evening?
            </p>
          </div>

          <div className="timetable-master-card glass-card">
            <div className="timetable-header flex items-center justify-between flex-wrap gap-3 mb-5">
              <div>
                <span className="badge badge-primary text-3xs font-mono uppercase mb-1">Standard Timetable (Classes 1 to 10)</span>
                <h4 className="text-base md:text-lg font-bold text-white">Focused Subject Rotation Strategy</h4>
              </div>
              <div className="timetable-timings-pill flex items-center gap-2">
                <Clock size={14} className="text-amber" />
                <span>Morning: 6:00–8:30 AM | Evening: 5:00–8:30 PM</span>
              </div>
            </div>

            <div className="timetable-days-grid">
              <div className="schedule-day-box day-mon">
                <div className="day-name">MONDAY</div>
                <div className="subject-icon">📚</div>
                <div className="subject-name">English</div>
                <p className="subject-desc">Grammar rules, prose &amp; poetry comprehension, vocabulary building &amp; error-free writing</p>
              </div>

              <div className="schedule-day-box day-tue">
                <div className="day-name">TUESDAY</div>
                <div className="subject-icon">🔬</div>
                <div className="subject-name">General Science</div>
                <p className="subject-desc">Physics principles, Chemistry reactions &amp; Biology life processes with visual concept clarity</p>
              </div>

              <div className="schedule-day-box day-wed">
                <div className="day-name">WEDNESDAY</div>
                <div className="subject-icon">✍️</div>
                <div className="subject-name">Telugu</div>
                <p className="subject-desc">Telugu Vyakaranam (grammar), sandhulu, samasalu, poem recitation &amp; neat presentation</p>
              </div>

              <div className="schedule-day-box day-thu">
                <div className="day-name">THURSDAY</div>
                <div className="subject-icon">🌍</div>
                <div className="subject-name">Social Studies</div>
                <p className="subject-desc">History timelines, Geography map pointing, Civics, Economics &amp; structured point-wise answers</p>
              </div>

              <div className="schedule-day-box day-fri">
                <div className="day-name">FRIDAY</div>
                <div className="subject-icon">📐</div>
                <div className="subject-name">Mathematics</div>
                <p className="subject-desc">Foundational arithmetic, Pre-Algebra, Geometry theorems, formula mastery &amp; problem sets</p>
              </div>

              <div className="schedule-day-box day-sat highlight-test">
                <div className="day-name text-amber-400">SATURDAY</div>
                <div className="subject-icon">📝</div>
                <div className="subject-name text-amber-300">Weekly Test</div>
                <p className="subject-desc">Comprehensive weekly slip test evaluating Monday–Friday topics with instant WhatsApp report</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. "WE OFFER" 5 CORE PILLARS (DIRECT FROM OFFICIAL BROCHURE) */}
      {/* ============================================================== */}
      <section className="we-offer-master-section" id="we-offer">
        <div className="section-container">
          <div className="section-header-center text-center mb-8">
            <span className="section-pill-tag">
              <Sparkles size={13} className="inline mr-1 text-amber-400" />
              Official Academy Pillars
            </span>
            <h2 className="section-heading-lg">
              What We Offer at <span className="text-gradient-gold">Hayagriva Tutorials</span>
            </h2>
            <p className="section-sub-text">
              The 5 educational hallmarks printed on our official brochure, designed for holistic student excellence.
            </p>
          </div>

          <div className="we-offer-5-grid">
            {/* Offer 1 */}
            <div className="offer-card glass-card">
              <div className="offer-icon-wrapper bg-indigo-soft">
                <BookOpen size={24} className="text-primary" />
              </div>
              <div className="offer-order-pill">PILLAR 1</div>
              <h3 className="offer-title">ONE DAY, ONE SUBJECT</h3>
              <p className="offer-text">
                Dedicate 1.5 to 2 hours every evening to single-subject deep study. No multitasking rush. Concepts and derivations are fully understood and remembered.
              </p>
              <div className="offer-footer-note text-indigo-300">
                <Check size={14} className="inline mr-1 text-emerald" /> 100% Concept Retention
              </div>
            </div>

            {/* Offer 2 */}
            <div className="offer-card glass-card">
              <div className="offer-icon-wrapper bg-emerald-soft">
                <Award size={24} className="text-emerald" />
              </div>
              <div className="offer-order-pill">PILLAR 2</div>
              <h3 className="offer-title">WEEKLY TESTS</h3>
              <p className="offer-text">
                Every Saturday tests the chapters completed during the week. Eliminates exam phobia and sends parents instant percentage scorecards on WhatsApp.
              </p>
              <div className="offer-footer-note text-emerald-300">
                <Check size={14} className="inline mr-1 text-emerald" /> Weekly WhatsApp Scorecards
              </div>
            </div>

            {/* Offer 3 */}
            <div className="offer-card glass-card">
              <div className="offer-icon-wrapper bg-amber-soft">
                <Users size={24} className="text-amber" />
              </div>
              <div className="offer-order-pill">PILLAR 3</div>
              <h3 className="offer-title">HOMEWORK SUPPORT</h3>
              <p className="offer-text">
                Tutor-guided 25-minute evening homework routine clears exercise doubts immediately, preventing backlog, late-night stress, and copy-pasting.
              </p>
              <div className="offer-footer-note text-amber-300">
                <Check size={14} className="inline mr-1 text-emerald" /> Zero Bedtime Panic
              </div>
            </div>

            {/* Offer 4 */}
            <div className="offer-card glass-card">
              <div className="offer-icon-wrapper bg-rose-soft">
                <Video size={24} className="text-rose" />
              </div>
              <div className="offer-order-pill">PILLAR 4</div>
              <h3 className="offer-title">CCTV CAMERA FACILITY</h3>
              <p className="offer-text">
                24/7 high-resolution CCTV camera surveillance across all classrooms and lobby. Ensures a 100% safe, disciplined, and focused learning environment.
              </p>
              <div className="offer-footer-note text-rose-300">
                <Check size={14} className="inline mr-1 text-emerald" /> 100% Monitored &amp; Safe
              </div>
            </div>

            {/* Offer 5 */}
            <div className="offer-card glass-card">
              <div className="offer-icon-wrapper bg-sky-soft">
                <Target size={24} className="text-sky" />
              </div>
              <div className="offer-order-pill">PILLAR 5</div>
              <h3 className="offer-title">CONCEPT-BASED LEARNING</h3>
              <p className="offer-text">
                Special emphasis on understanding root principles and practical applications over memorizing textbook answers. Ideal for long-term board exam GPA.
              </p>
              <div className="offer-footer-note text-sky-300">
                <Check size={14} className="inline mr-1 text-emerald" /> Better Exam Results
              </div>
            </div>
          </div>

          {/* Brochure Tagline Strip */}
          <div className="brochure-quote-banner glass-card mt-6">
            <div className="quote-content flex items-center justify-between flex-wrap gap-4">
              <div className="quote-text-wrap flex items-center gap-3">
                <span className="quote-mark">“</span>
                <div>
                  <h4 className="quote-heading">Good Education Today, Better Tomorrow</h4>
                  <p className="quote-sub">Building Strong Foundations for Brighter Futures — Hayagriva Tutorials, Hyderabad</p>
                </div>
              </div>
              <div className="quote-accreditation-badge flex items-center gap-2.5">
                <span className="badge badge-warning text-xs font-bold py-1.5 px-3">
                  ★ Admissions Open 2026–2027
                </span>
                <span className="text-xs text-secondary font-medium hidden sm:inline">
                  Limited to 25 Students / Batch
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. "WHY CHOOSE US?" INTERACTIVE SLIDING SHOWCASE WINDOW */}
      {/* ============================================================== */}
      <section className="why-choose-showcase-section" id="why-choose">
        <div className="section-container">
          <div className="section-header-center text-center mb-8">
            <span className="section-pill-tag">
              <ShieldCheck size={13} className="inline mr-1 text-emerald-400" />
              Why Choose Hayagriva Tutorials?
            </span>
            <h2 className="section-heading-lg">
              Excellence Engineered for <span className="text-gradient-primary">Every Student</span>
            </h2>
            <p className="section-sub-text">
              Click through our feature tabs to explore our faculty, personalized mentoring, and safety standards.
            </p>
          </div>

          {/* Interactive Feature Tabs (Scrollable on mobile) */}
          <div className="feature-nav-tabs">
            {featureShowcaseTabs.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                className={`feature-tab-btn ${activeFeatureTab === idx ? 'active' : ''}`}
                onClick={() => setActiveFeatureTab(idx)}
              >
                <span className="tab-number">0{idx + 1}</span>
                <span className="tab-title">{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Interactive Sliding Showcase Card */}
          <div className="feature-showcase-window glass-card">
            <div className="feature-window-grid">
              {/* Visual Media with ambient glow */}
              <div className="feature-visual-wrap">
                <div className="feature-image-container">
                  <img 
                    src={featureShowcaseTabs[activeFeatureTab].image} 
                    alt={featureShowcaseTabs[activeFeatureTab].title}
                    className="feature-img"
                  />
                  <div className="feature-image-overlay" />
                  
                  {/* Floating Stat Badge */}
                  <div className="feature-floating-stat glass-card">
                    <div className="stat-large">{featureShowcaseTabs[activeFeatureTab].highlightStat}</div>
                    <div className="stat-desc">{featureShowcaseTabs[activeFeatureTab].highlightLabel}</div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="feature-content-wrap">
                <span className="feature-tag-badge">
                  {featureShowcaseTabs[activeFeatureTab].tag}
                </span>

                <h3 className="feature-window-heading">
                  {featureShowcaseTabs[activeFeatureTab].heading}
                </h3>

                <p className="feature-window-desc">
                  {featureShowcaseTabs[activeFeatureTab].desc}
                </p>

                <div className="feature-benefits-checklist">
                  {featureShowcaseTabs[activeFeatureTab].benefits.map((benefit, i) => (
                    <div key={i} className="benefit-item">
                      <div className="benefit-check-circle">✓</div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="feature-quote-box">
                  <p className="quote-italic">{featureShowcaseTabs[activeFeatureTab].quote}</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ============================================================== */}
      {/* 6. CLASSES 1 TO 10 CURRICULUM WINGS */}
      {/* ============================================================== */}
      <section className="classes-wings-section" id="classes">
        <div className="section-container">
          <div className="section-header-center text-center mb-8">
            <span className="section-pill-tag">Comprehensive Programs</span>
            <h2 className="section-heading-lg">Coaching for Classes 1 to 10</h2>
            <p className="section-sub-text">
              Structured curriculum designed for State Board (SSC) and CBSE syllabi with morning and evening batch options.
            </p>
          </div>

          <div className="classes-tiers-grid">
            {/* Primary Wing */}
            <div className="class-tier-card glass-card">
              <div className="tier-header">
                <span className="tier-badge">Foundation Wing</span>
                <h3 className="tier-title">Classes 1 to 5</h3>
                <p className="tier-sub">Building fundamental habits &amp; arithmetic speed</p>
              </div>
              <ul className="tier-benefits-list">
                <li><CheckCircle2 size={15} className="text-emerald" /> Core Mathematics &amp; Speed Tables</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> General Science &amp; Environmental Studies</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> English Grammar, Reading &amp; Handwriting</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> Hindi &amp; Telugu Language Foundations</li>
              </ul>
              <div className="tier-tag-pill mt-4">
                <CheckCircle2 size={13} className="text-emerald" />
                <span>State Board &amp; CBSE Aligned</span>
              </div>
            </div>

            {/* Middle Wing */}
            <div className="class-tier-card glass-card">
              <div className="tier-header">
                <span className="tier-badge bg-primary-soft text-primary">Middle Wing</span>
                <h3 className="tier-title">Classes 6 to 8</h3>
                <p className="tier-sub">Conceptual clarity across Science &amp; Advanced Maths</p>
              </div>
              <ul className="tier-benefits-list">
                <li><CheckCircle2 size={15} className="text-emerald" /> Physics, Chemistry &amp; Biology Basics</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> Pre-Algebra, Geometry &amp; Word Problems</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> Social Studies &amp; Conceptual Geography</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> Saturday Chapter Slip Tests</li>
              </ul>
              <div className="tier-tag-pill mt-4">
                <CheckCircle2 size={13} className="text-emerald" />
                <span>Concept Immersion &amp; Weekly Tests</span>
              </div>
            </div>

            {/* High School Board */}
            <div className="class-tier-card glass-card tier-highlight-featured">
              <div className="featured-flag">🌟 10/10 GPA Target</div>
              <div className="tier-header">
                <span className="tier-badge bg-amber-soft text-amber">Board Special</span>
                <h3 className="tier-title">Classes 9 &amp; 10 (SSC / CBSE)</h3>
                <p className="tier-sub">Intensive board preparation &amp; mock test series</p>
              </div>
              <ul className="tier-benefits-list">
                <li><CheckCircle2 size={15} className="text-emerald" /> Complete Board Syllabus Deep Mastery</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> Chapter-wise Numericals &amp; Derivations</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> 10+ Pre-Final Mock Exams &amp; Model Papers</li>
                <li><CheckCircle2 size={15} className="text-emerald" /> Time-Management &amp; Answer Presentation</li>
              </ul>
              <div className="tier-tag-pill mt-4 tier-tag-highlight">
                <CheckCircle2 size={13} className="text-emerald" />
                <span>Intensive Board Prep &amp; Pre-Final Mocks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. PARENT TESTIMONIALS & REAL HYDERABAD RESULTS */}
      {/* ============================================================== */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header-center text-center mb-8">
            <span className="section-pill-tag">
              <Star size={13} className="inline mr-1 text-amber-400 fill-amber-400" />
              Parent Reviews
            </span>
            <h2 className="section-heading-lg">
              Loved by Hyderabad <span className="text-gradient-gold">Parents &amp; Students</span>
            </h2>
            <p className="section-sub-text">
              Real feedback from families in Srinagar Colony and Yellareddyguda whose children study with us.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card glass-card">
              <div className="stars-row flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="text-amber fill-amber" />
                ))}
              </div>
              <p className="testimonial-text">
                "The 'One Day One Subject' rule worked wonders for my son. Earlier he was stressed balancing 4 subjects every evening. Now his Mathematics marks improved from 65% to 92%."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">VK</div>
                <div>
                  <div className="author-name">V. Krishna Murthy</div>
                  <div className="author-meta">Parent of Class 8 Student • Srinagar Colony</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass-card">
              <div className="stars-row flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="text-amber fill-amber" />
                ))}
              </div>
              <p className="testimonial-text">
                "Receiving Saturday test scorecards on WhatsApp is such a relief. We know exactly where our daughter needs improvement instead of waiting for the school report card."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">SL</div>
                <div>
                  <div className="author-name">S. Lakshmi Devi</div>
                  <div className="author-meta">Parent of Class 10 Student • Yellareddyguda</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass-card">
              <div className="stars-row flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="text-amber fill-amber" />
                ))}
              </div>
              <p className="testimonial-text">
                "Small batches and CCTV monitoring gave us total confidence. The tutors explain science concepts with practical diagrams rather than just asking them to memorize."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">PR</div>
                <div>
                  <div className="author-name">P. Ramesh Reddy</div>
                  <div className="author-meta">Parent of Class 7 Student • Ameerpet / Srinagar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. PART TIME JOB SECTION */}
      {/* ============================================================== */}
      <section className="careers-section" id="faculty-careers">
        <div className="section-container">
          <div className="careers-banner-card glass-card">
            <div className="careers-grid">
              <div>
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="title-icon-badge bg-primary-soft">
                    <Briefcase size={18} className="text-primary" />
                  </div>
                  <span className="badge badge-primary text-xs font-bold uppercase">
                    Faculty Opportunities 2026–2027
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                  Teach with Us • <br />
                  <span className="text-gradient-primary">Faculty Mentorship Openings</span>
                </h2>

                <p className="text-sm text-secondary leading-relaxed mb-6">
                  We welcome passionate educators for <strong>part-time morning (6:00–8:30 AM) and evening (5:00–8:30 PM) teaching slots</strong> for Classes 1 to 10 across Mathematics, Science, Social Studies, and Languages. Enjoy disciplined batches, max 25 students, and prompt remuneration.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-md flex items-center justify-center gap-2 w-full sm:w-auto cta-glow-btn"
                    onClick={handleOpenTeacher}
                  >
                    <Briefcase size={16} />
                    <span>Apply for Teaching Position</span>
                    <ArrowRight size={14} />
                  </button>

                  <a
                    href="https://wa.me/919848266892?text=Hello%20Director,%20I%20am%20interested%20in%20a%20faculty%20teaching%20position%20at%20Hayagriva%20Tutorials."
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-md flex items-center justify-center gap-2 w-full sm:w-auto text-emerald"
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp Inquiry</span>
                  </a>
                </div>
              </div>

              <div className="careers-perks-box glass-card p-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Star size={16} className="text-amber" />
                  Why Tutors Love Teaching at Hayagriva:
                </h4>

                <div className="space-y-2.5 text-xs text-secondary">
                  <div className="flex items-start gap-2">
                    <div className="perk-check">✓</div>
                    <div>
                      <strong className="text-white">Strict Batch Limit:</strong> Max 25 students per class.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="perk-check">✓</div>
                    <div>
                      <strong className="text-white">Automated Portal:</strong> Digital roll-call &amp; test grading.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="perk-check">✓</div>
                    <div>
                      <strong className="text-white">Flexible Schedules:</strong> Morning or evening batch slots.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="perk-check">✓</div>
                    <div>
                      <strong className="text-white">Prompt Remuneration:</strong> Transparent compensation.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. CONTACT & ACADEMY LOCATION */}
      {/* ============================================================== */}
      <section className="contact-master-section" id="contact">
        <div className="section-container">
          <div className="contact-summary-card glass-card">
            <div className="contact-grid">
              <div className="contact-col">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={20} className="text-rose" />
                  <h4 className="font-bold text-white text-sm">Academy Location</h4>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  <strong>HAYAGRIVA TUTORIALS ACADEMY</strong><br />
                  8-3-825/5/5/2, Yellareddyguda,<br />
                  Srinagar Colony, Hyderabad,<br />
                  Telangana – 500073
                </p>
                <div className="mt-2.5">
                  <a
                    href="https://maps.google.com/?q=Yellareddyguda+Srinagar+Colony+Hyderabad"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>View on Google Maps</span>
                    <ArrowRight size={12} />
                  </a>
                </div>
              </div>

              <div className="contact-col">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={20} className="text-emerald" />
                  <h4 className="font-bold text-white text-sm">Admissions Helpline</h4>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Call: <strong className="text-white font-mono">+91 9848266892</strong><br />
                  Alternative: <strong className="text-white font-mono">+91 9849473251</strong><br />
                  WhatsApp: <a href="https://wa.me/919848266892" target="_blank" rel="noreferrer" className="text-emerald font-semibold">+91 9848266892</a><br />
                  Email: <a href="mailto:hayagrivatutorials9@gmail.com" className="text-sky hover:underline">hayagrivatutorials9@gmail.com</a>
                </p>
              </div>

              <div className="contact-col">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} className="text-amber" />
                  <h4 className="font-bold text-white text-sm">Academy Operating Hours</h4>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Morning Batches: <strong>6:00 AM – 8:30 AM</strong><br />
                  Evening Batches: <strong>5:00 PM – 8:30 PM</strong><br />
                  Monday – Friday: Daily Single-Subject Immersion<br />
                  Saturday: Weekly Slip Test Evaluation &amp; WhatsApp Report
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. FOOTER */}
      {/* ============================================================== */}
      <footer className="landing-footer" id="site-footer">
        <div className="section-container">
          {/* Top Multi-Column Content */}
          <div className="footer-top-grid">
            {/* Column 1: Brand & Contact Identity */}
            <div className="footer-col brand-col">
              <div className="footer-brand-header">
                <HayagrivaLogo size={36} showGlow={true} />
                <div className="footer-brand-headings">
                  <span className="footer-brand-title">HAYAGRIVA TUTORIALS</span>
                  <span className="footer-brand-badge">Classes 1–10 • SSC &amp; CBSE</span>
                </div>
              </div>

              <p className="footer-brand-tagline">
                Transforming academic performance with conceptual clarity, daily single-subject immersion, and dedicated weekly assessments.
              </p>

              <div className="footer-address-block">
                <div className="footer-address-line">
                  <MapPin size={14} className="footer-icon-accent" />
                  <span>8-3-825/5/5/2, Yellareddyguda, Srinagar Colony, Hyderabad – 500073</span>
                </div>
              </div>

              <div className="footer-contact-chips">
                <a href="tel:+919848266892" className="footer-chip">
                  <Phone size={13} className="footer-icon-emerald" />
                  <span>+91 98482 66892</span>
                </a>
                <a href="https://wa.me/919848266892" target="_blank" rel="noreferrer" className="footer-chip">
                  <MessageCircle size={13} className="footer-icon-emerald" />
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </div>

            {/* Column 2: Academic Programs */}
            <div className="footer-col">
              <h4 className="footer-col-title">Academic Wings</h4>
              <ul className="footer-links-list">
                <li><a href="#batches" className="footer-nav-link"><span className="footer-link-bullet">›</span> Primary Wing (Classes 1–5)</a></li>
                <li><a href="#batches" className="footer-nav-link"><span className="footer-link-bullet">›</span> Middle Wing (Classes 6–8)</a></li>
                <li><a href="#batches" className="footer-nav-link"><span className="footer-link-bullet">›</span> High School (Classes 9–10 SSC &amp; CBSE)</a></li>
                <li><a href="#features" className="footer-nav-link"><span className="footer-link-bullet">›</span> Special Focus on Mathematics</a></li>
                <li><a href="#features" className="footer-nav-link"><span className="footer-link-bullet">›</span> Concept-Based Science Lab</a></li>
              </ul>
            </div>

            {/* Column 3: The Hayagriva Edge */}
            <div className="footer-col">
              <h4 className="footer-col-title">The Hayagriva Edge</h4>
              <ul className="footer-perks-list">
                <li className="footer-perk-item">
                  <CheckCircle2 size={13} className="footer-icon-emerald" />
                  <span>&ldquo;One Day, One Subject&rdquo; Immersion</span>
                </li>
                <li className="footer-perk-item">
                  <CheckCircle2 size={13} className="footer-icon-emerald" />
                  <span>Strict Limit: Max 25 Students/Batch</span>
                </li>
                <li className="footer-perk-item">
                  <CheckCircle2 size={13} className="footer-icon-emerald" />
                  <span>Saturday Weekly Slip Tests</span>
                </li>
                <li className="footer-perk-item">
                  <CheckCircle2 size={13} className="footer-icon-emerald" />
                  <span>Instant WhatsApp Progress Reports</span>
                </li>
                <li className="footer-perk-item">
                  <CheckCircle2 size={13} className="footer-icon-emerald" />
                  <span>Air-Conditioned &amp; CCTV Secured</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Quick Portals & Opportunities */}
            <div className="footer-col">
              <h4 className="footer-col-title">Faculty &amp; Portals</h4>
              <div className="footer-buttons-stack">
                <button 
                  type="button" 
                  className="footer-btn-primary" 
                  onClick={handleOpenTeacher}
                >
                  <Briefcase size={14} />
                  <span>Apply as Faculty / Tutor</span>
                </button>
                <a 
                  href="#contact" 
                  className="footer-btn-secondary"
                >
                  <MapPin size={14} />
                  <span>Academy Location</span>
                </a>
                {onOpenLogin && (
                  <button 
                    type="button" 
                    className="footer-btn-ghost" 
                    onClick={() => onOpenLogin('ADMIN')}
                  >
                    <LogIn size={14} />
                    <span>Admin / Staff Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Navigation Bar */}
          <div className="footer-bottom-bar">
            <div className="footer-copyright-text">
              &copy; {new Date().getFullYear()} <strong className="footer-brand-highlight">HAYAGRIVA TUTORIALS</strong>. All rights reserved.
              <span className="footer-city-tag">• Srinagar Colony, Hyderabad, Telangana</span>
            </div>

            <div className="footer-bottom-links">
              <a 
                href="#faculty-careers" 
                className="footer-bottom-link-btn"
              >
                Careers
              </a>
              <span className="footer-dot-separator">•</span>
              <a 
                href="#contact" 
                className="footer-bottom-link-btn"
              >
                Contact &amp; Location
              </a>
              <span className="footer-dot-separator">•</span>
              <button 
                type="button" 
                className="footer-bottom-link-btn footer-scroll-top-btn"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Top ↑
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* COMPONENT STYLES WITH COMPLETE MOBILE-FIRST REFINEMENTS */}
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

        .section-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 16px;
        }
        @media (min-width: 768px) {
          .section-container {
            padding: 0 24px;
          }
        }

        /* 1. Navbar */
        .landing-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(11, 15, 25, 0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 0;
          width: 100%;
        }
        .landing-nav-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
        }
        .landing-brand-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
          min-width: max-content;
        }
        .landing-brand-text {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .brand-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: nowrap;
        }
        .brand-main-name {
          font-family: var(--font-heading);
          font-weight: 850;
          color: #FFFFFF;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
          white-space: nowrap;
          line-height: 1.2;
        }
        .brand-classes-badge {
          background: rgba(99, 102, 241, 0.2);
          color: #A5B4FC;
          border: 1px solid rgba(99, 102, 241, 0.35);
          font-size: 0.62rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .brand-sub-desc {
          font-size: 0.68rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        .landing-nav-links {
          display: none;
          align-items: center;
          gap: 18px;
        }
        @media (min-width: 1024px) {
          .landing-nav-links {
            display: flex;
          }
        }
        .nav-item {
          color: #94A3B8;
          font-size: 0.8125rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          padding: 4px 0;
        }
        .nav-item:hover {
          color: #FFFFFF;
        }
        .nav-item.highlight-nav {
          color: #F59E0B;
        }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }
        .nav-action-parental-login {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.32);
          color: #E2E8F0;
          font-size: 0.78rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .nav-action-parental-login:hover {
          background: rgba(16, 185, 129, 0.18);
          border-color: rgba(16, 185, 129, 0.55);
          color: #FFFFFF;
          transform: translateY(-1px);
        }
        .nav-action-demo-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          border-radius: 8px;
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
          color: #FFFFFF;
          font-size: 0.78rem;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
          border: none;
          box-shadow: 0 0 16px rgba(79, 70, 229, 0.45);
          transition: all 0.2s ease;
        }
        .nav-action-demo-btn:hover {
          background: linear-gradient(135deg, #4338CA 0%, #4F46E5 100%);
          transform: translateY(-1px);
          box-shadow: 0 0 22px rgba(99, 102, 241, 0.65);
        }

        .nav-btn-text-full {
          display: inline !important;
        }
        .nav-btn-text-short {
          display: none !important;
        }

        /* Below 1024px: Whenever hamburger menu is visible, use compact labels and hide secondary brand text */
        @media (max-width: 1023px) {
          .nav-btn-text-full {
            display: none !important;
          }
          .nav-btn-text-short {
            display: inline !important;
          }
          .brand-classes-badge {
            display: none !important;
          }
          .brand-sub-desc {
            display: none !important;
          }
          .landing-nav-actions {
            margin-left: auto !important;
            gap: 6px !important;
            flex-shrink: 0 !important;
          }
          .landing-brand-wrap {
            flex-shrink: 0 !important;
            min-width: max-content !important;
          }
        }

        @media (max-width: 768px) {
          .landing-nav-container {
            padding: 0 10px !important;
            gap: 6px !important;
          }
          .landing-brand-wrap {
            gap: 6px !important;
            flex-shrink: 0 !important;
            min-width: max-content !important;
          }
          .hayagriva-logo-container {
            gap: 0 !important;
          }
          .hayagriva-emblem-badge {
            width: 26px !important;
            height: 26px !important;
            min-width: 26px !important;
          }
          .brand-main-name {
            font-size: 0.88rem !important;
            white-space: nowrap !important;
            line-height: 1 !important;
          }
          .landing-nav-actions {
            gap: 5px !important;
            flex-shrink: 0 !important;
            margin-left: auto !important;
          }
          .nav-action-parental-login {
            padding: 5px 8px !important;
            font-size: 0.72rem !important;
            gap: 4px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .nav-action-demo-btn {
            padding: 5px 9px !important;
            font-size: 0.72rem !important;
            gap: 4px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .mobile-menu-toggle-btn {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            flex-shrink: 0 !important;
          }
        }

        @media (max-width: 380px) {
          .landing-nav-container {
            padding: 0 6px !important;
            gap: 4px !important;
          }
          .landing-nav-actions {
            gap: 4px !important;
          }
          .brand-main-name {
            font-size: 0.82rem !important;
          }
          .nav-action-parental-login {
            padding: 4px 6px !important;
            font-size: 0.68rem !important;
          }
          .nav-action-demo-btn {
            padding: 4px 7px !important;
            font-size: 0.68rem !important;
          }
        }

        .tier-tag-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.74rem;
          color: #CBD5E1;
          font-weight: 600;
          text-align: center;
        }
        .tier-tag-highlight {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.3);
          color: #A5B4FC;
        }
        .cta-glow-btn {
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
          box-shadow: 0 0 16px rgba(79, 70, 229, 0.45);
          font-weight: 700;
          transition: all 0.25s ease;
        }
        .cta-glow-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 22px rgba(99, 102, 241, 0.65);
        }

        .mobile-menu-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #F8FAFC;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        @media (min-width: 1024px) {
          .mobile-menu-toggle-btn {
            display: none;
          }
        }

        .mobile-nav-drawer {
          background: rgba(15, 23, 42, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 14px 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: slideDownMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideDownMobile {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 8px;
          color: #CBD5E1;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.88rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
        }
        .mobile-nav-link.strategy-highlight {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.25);
          color: #FCD34D;
        }
        .mobile-drawer-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 6px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* 2. GRAND HERO SECTION */
        .grand-hero-section {
          position: relative;
          padding: 30px 0 40px 0;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .grand-hero-section {
            padding: 60px 0 50px 0;
          }
        }
        .hero-glow-sphere {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .sphere-1 {
          width: 320px;
          height: 320px;
          background: rgba(99, 102, 241, 0.16);
          top: -40px;
          left: 5%;
        }
        .sphere-2 {
          width: 300px;
          height: 300px;
          background: rgba(245, 158, 11, 0.12);
          bottom: 0px;
          right: 8%;
        }

        .grand-hero-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 14px;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 768px) {
          .grand-hero-container {
            padding: 0 20px;
          }
        }
        @media (min-width: 1024px) {
          .grand-hero-container {
            display: grid;
            grid-template-columns: 1.05fr 1fr;
            gap: 48px;
            align-items: center;
          }
        }

        .hero-lead-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .hero-badge {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 5px 12px;
          border-radius: 9999px;
        }
        .pulsing-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 8px #F59E0B;
          animation: pulse 1.5s infinite;
        }
        .hero-headline {
          font-family: var(--font-heading);
          font-size: 1.85rem;
          line-height: 1.18;
          font-weight: 850;
          color: #FFFFFF;
          margin-bottom: 12px;
          letter-spacing: -0.025em;
        }
        @media (min-width: 640px) {
          .hero-headline { font-size: 2.3rem; }
        }
        @media (min-width: 1024px) {
          .hero-headline { font-size: 3.1rem; }
        }
        .text-gradient-gold {
          background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #FBBF24 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-gradient-primary {
          background: linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #34D399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-description {
          font-size: 0.95rem;
          color: #94A3B8;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .hero-primary-cta {
          font-weight: 750;
          padding: 12px 22px;
          border-radius: 10px;
        }
        .quick-call-link {
          text-decoration: none;
          font-size: 0.85rem;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          transition: all 0.2s ease;
        }
        .quick-call-link:hover {
          background: rgba(16, 185, 129, 0.18);
        }

        .hero-trust-badges {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        .trust-badge-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #CBD5E1;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 12px;
          border-radius: 8px;
        }

        /* 3. HERO SLIDER WINDOW CONTAINER */
        .hero-slider-window-col {
          width: 100%;
          margin: 12px 0 0 0;
        }
        @media (min-width: 1024px) {
          .hero-slider-window-col {
            margin: 0;
          }
        }
        .slide-window-frame {
          padding: 0;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.12);
          position: relative;
        }
        .slide-media-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #0F172A;
        }
        .slide-item {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .slide-item.active-slide {
          pointer-events: auto;
        }
        .slide-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .slide-overlay-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(11, 15, 25, 0.2) 0%, rgba(11, 15, 25, 0.4) 40%, rgba(11, 15, 25, 0.95) 100%);
        }

        .slide-floating-top-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 5;
        }
        .pill-badge {
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 750;
          letter-spacing: 0.02em;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .badge-amber {
          background: rgba(245, 158, 11, 0.9);
          color: #FFFFFF;
        }
        .badge-emerald {
          background: rgba(16, 185, 129, 0.9);
          color: #FFFFFF;
        }
        .badge-sky {
          background: rgba(14, 165, 233, 0.9);
          color: #FFFFFF;
        }
        .badge-primary {
          background: rgba(99, 102, 241, 0.9);
          color: #FFFFFF;
        }


        /* Nav Arrows */
        .slide-nav-arrow {
          position: absolute;
          top: 42%;
          transform: translateY(-50%);
          z-index: 6;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .slide-nav-arrow:hover {
          background: rgba(99, 102, 241, 0.8);
          border-color: rgba(99, 102, 241, 0.6);
          transform: translateY(-50%) scale(1.08);
        }
        .arrow-prev { left: 8px; }
        .arrow-next { right: 8px; }

        /* Overlaid Slide Caption */
        .slide-caption-glass-box {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          z-index: 5;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(11, 15, 25, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .caption-category {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 750;
          color: #FCD34D;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .caption-title {
          font-size: 1rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 2px;
          line-height: 1.25;
        }
        .caption-subtitle {
          font-size: 0.74rem;
          font-weight: 600;
          color: #38BDF8;
          margin-bottom: 2px;
        }
        .caption-desc {
          font-size: 0.72rem;
          color: #CBD5E1;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Selector Bar Below Slide Window */
        .slide-selector-tabs-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: rgba(15, 23, 42, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 5px;
          gap: 4px;
        }
        .slide-tab-pill {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 7px 4px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          color: #94A3B8;
          font-size: 0.7rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .slide-tab-pill:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.04);
        }
        .slide-tab-pill.active {
          color: #FFFFFF;
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .tab-pill-icon {
          font-size: 0.8rem;
        }
        .active-pill-glow {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: #818CF8;
          border-radius: 2px;
          box-shadow: 0 0 6px #818CF8;
        }

        /* Responsive Mobile Hero Layout Switcher */
        .hero-mobile-content-block {
          display: none;
        }
        @media (max-width: 1023px) {
          .hero-desktop-content-block {
            display: none;
          }
          .hero-mobile-content-block {
            display: flex;
            flex-direction: column;
            width: 100%;
            margin-top: 18px;
          }
          .mobile-hero-desc {
            font-size: 0.88rem;
            color: #94A3B8;
            line-height: 1.55;
            margin-bottom: 16px;
          }
          .mobile-actions-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 12px;
          }
          .mobile-whatsapp-banner {
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 10px;
            padding: 10px 14px;
            color: #E2E8F0;
            text-decoration: none;
            font-size: 0.82rem;
            font-weight: 600;
            margin-bottom: 14px;
            transition: all 0.2s ease;
          }
          .mobile-whatsapp-banner:active {
            background: rgba(16, 185, 129, 0.2);
          }
          .mobile-trust-chips-row {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 6px;
          }
          .mobile-chip {
            font-size: 0.68rem;
            font-weight: 600;
            color: #CBD5E1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 4px 10px;
            border-radius: 6px;
          }
        }

        /* 4. "WE OFFER" 5 PILLARS MASTER SECTION */
        .we-offer-master-section {
          padding: 50px 0;
          background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.08) 0%, rgba(11, 15, 25, 0) 70%);
        }
        .we-offer-5-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }
        @media (min-width: 1100px) {
          .we-offer-5-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        @media (max-width: 640px) {
          .we-offer-5-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .offer-card:nth-child(5) {
            grid-column: span 2;
          }
        }
        .offer-card {
          padding: 18px 16px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: all 0.25s ease;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(17, 24, 39, 0.6);
        }
        .offer-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.35);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        }
        .offer-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        @media (max-width: 640px) {
          .offer-card {
            padding: 14px 12px;
          }
          .offer-icon-wrapper {
            width: 36px;
            height: 36px;
            margin-bottom: 8px;
          }
          .offer-icon-wrapper svg {
            width: 20px;
            height: 20px;
          }
        }
        .bg-indigo-soft { background: rgba(99, 102, 241, 0.15); }
        .bg-emerald-soft { background: rgba(16, 185, 129, 0.15); }
        .bg-amber-soft { background: rgba(245, 158, 11, 0.15); }
        .bg-rose-soft { background: rgba(244, 63, 94, 0.15); }
        .bg-sky-soft { background: rgba(14, 165, 233, 0.15); }
        .bg-primary-soft { background: rgba(99, 102, 241, 0.15); }

        .offer-order-pill {
          font-size: 0.62rem;
          font-weight: 750;
          color: #94A3B8;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .offer-title {
          font-size: 0.88rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 6px;
          line-height: 1.25;
        }
        .offer-text {
          font-size: 0.76rem;
          color: #94A3B8;
          line-height: 1.5;
          margin-bottom: 10px;
          flex-grow: 1;
        }
        .offer-footer-note {
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
        }

        .brochure-quote-banner {
          padding: 18px 22px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.12) 100%);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .quote-mark {
          font-size: 2.5rem;
          color: #10B981;
          font-family: serif;
          line-height: 0.8;
        }
        .quote-heading {
          font-size: 1.05rem;
          font-weight: 800;
          color: #FFFFFF;
        }
        .quote-sub {
          font-size: 0.76rem;
          color: #CBD5E1;
        }

        /* 5. "WHY CHOOSE US" INTERACTIVE FEATURE SLIDING SHOWCASE */
        .why-choose-showcase-section {
          padding: 50px 0;
        }
        .feature-nav-tabs {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .feature-nav-tabs {
            justify-content: flex-start;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .feature-nav-tabs::-webkit-scrollbar {
            display: none;
          }
          .feature-tab-btn {
            flex-shrink: 0;
            padding: 8px 12px;
            font-size: 0.74rem;
          }
        }
        .feature-tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 10px;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94A3B8;
          font-size: 0.8rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .feature-tab-btn:hover {
          color: #FFFFFF;
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(99, 102, 241, 0.1);
        }
        .feature-tab-btn.active {
          color: #FFFFFF;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%);
          border-color: #6366F1;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.25);
        }
        .tab-number {
          font-size: 0.7rem;
          font-weight: 800;
          color: #FCD34D;
        }

        .feature-showcase-window {
          padding: 24px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        @media (max-width: 640px) {
          .feature-showcase-window {
            padding: 16px 14px;
          }
        }
        .feature-window-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: center;
        }
        @media (min-width: 992px) {
          .feature-window-grid {
            grid-template-columns: 1.15fr 1fr;
            gap: 36px;
          }
        }
        .feature-visual-wrap {
          position: relative;
        }
        .feature-image-container {
          position: relative;
          aspect-ratio: 16 / 10;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .feature-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .feature-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(11, 15, 25, 0.8) 100%);
        }
        .feature-floating-stat {
          position: absolute;
          bottom: 12px;
          right: 12px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          text-align: right;
        }
        .stat-large {
          font-size: 1.15rem;
          font-weight: 850;
          color: #38BDF8;
          line-height: 1;
        }
        .stat-desc {
          font-size: 0.62rem;
          color: #94A3B8;
          font-weight: 600;
          margin-top: 2px;
        }

        .feature-content-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .feature-tag-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 750;
          color: #FCD34D;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .feature-window-heading {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.25;
          margin-bottom: 10px;
        }
        @media (min-width: 768px) {
          .feature-window-heading { font-size: 1.6rem; }
        }
        .feature-window-desc {
          font-size: 0.85rem;
          color: #94A3B8;
          line-height: 1.55;
          margin-bottom: 14px;
        }
        .feature-benefits-checklist {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          margin-bottom: 16px;
        }
        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.8rem;
          color: #E2E8F0;
          line-height: 1.35;
        }
        .benefit-check-circle {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .feature-quote-box {
          border-left: 3px solid #818CF8;
          padding-left: 10px;
          margin-bottom: 8px;
        }
        .quote-italic {
          font-style: italic;
          font-size: 0.78rem;
          color: #CBD5E1;
        }

        /* 6. WEEKLY ROTATION TIMETABLE */
        .weekly-timetable-section {
          padding: 50px 0;
          background: rgba(15, 23, 42, 0.4);
        }
        .timetable-master-card {
          padding: 22px 18px;
          border-radius: 18px;
        }
        .timetable-timings-pill {
          font-size: 0.75rem;
          color: #FCD34D;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 5px 12px;
          border-radius: 8px;
        }
        .timetable-days-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
        }
        @media (min-width: 992px) {
          .timetable-days-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }
        @media (min-width: 640px) and (max-width: 991px) {
          .timetable-days-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .timetable-days-grid {
            display: flex;
            overflow-x: auto;
            flex-wrap: nowrap;
            gap: 10px;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .timetable-days-grid::-webkit-scrollbar {
            display: none;
          }
          .schedule-day-box {
            min-width: 140px;
            max-width: 150px;
            flex-shrink: 0;
          }
        }
        .schedule-day-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 14px 10px;
          text-align: center;
          transition: all 0.2s ease;
        }
        .schedule-day-box:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }
        .schedule-day-box.highlight-test {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.3);
        }
        .schedule-day-box.highlight-doubt {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
        }
        .day-name {
          font-size: 0.68rem;
          font-weight: 800;
          color: #94A3B8;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }
        .subject-icon {
          font-size: 1.5rem;
          margin-bottom: 4px;
        }
        .subject-name {
          font-size: 0.82rem;
          font-weight: 750;
          color: #FFFFFF;
          margin-bottom: 4px;
          line-height: 1.25;
        }
        .subject-desc {
          font-size: 0.65rem;
          color: #94A3B8;
          line-height: 1.4;
        }

        /* 7. CLASSES 1 TO 10 TIERS */
        .classes-wings-section {
          padding: 50px 0;
        }
        .classes-tiers-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 860px) {
          .classes-tiers-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .class-tier-card {
          padding: 20px 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }
        .tier-highlight-featured {
          border-color: rgba(245, 158, 11, 0.4);
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, rgba(17, 24, 39, 0.7) 100%);
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.12);
        }
        .featured-flag {
          position: absolute;
          top: -10px;
          right: 18px;
          background: #F59E0B;
          color: #000000;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .tier-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 750;
          color: #38BDF8;
          background: rgba(14, 165, 233, 0.12);
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .tier-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 4px;
        }
        .tier-sub {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-bottom: 14px;
        }
        .tier-benefits-list {
          list-style: none;
          padding: 0;
          margin: 0 0 14px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.78rem;
          color: #CBD5E1;
        }
        .tier-benefits-list li {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* 8. TESTIMONIALS */
        .testimonials-section {
          padding: 50px 0;
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 768px) {
          .testimonials-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .testimonials-grid {
            display: flex;
            overflow-x: auto;
            flex-wrap: nowrap;
            gap: 12px;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .testimonials-grid::-webkit-scrollbar {
            display: none;
          }
          .testimonial-card {
            min-width: 260px;
            max-width: 280px;
            flex-shrink: 0;
          }
        }
        .testimonial-card {
          padding: 20px 18px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .testimonial-text {
          font-size: 0.82rem;
          color: #E2E8F0;
          line-height: 1.55;
          margin-bottom: 16px;
          font-style: italic;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .author-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4F46E5 0%, #10B981 100%);
          color: #FFFFFF;
          font-size: 0.76rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .author-name {
          font-size: 0.82rem;
          font-weight: 750;
          color: #FFFFFF;
        }
        .author-meta {
          font-size: 0.68rem;
          color: #94A3B8;
        }

        /* 9. CAREERS */
        .careers-section {
          padding: 40px 0;
        }
        .careers-banner-card {
          padding: 28px 22px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%);
          border: 1px solid rgba(99, 102, 241, 0.25);
        }
        .careers-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          align-items: center;
        }
        @media (min-width: 900px) {
          .careers-grid {
            grid-template-columns: 1.2fr 1fr;
          }
        }
        .perk-check {
          color: #10B981;
          font-weight: 800;
          font-size: 0.82rem;
        }

        /* 10. CONTACT */
        .contact-master-section {
          padding: 40px 0;
        }
        .contact-summary-card {
          padding: 24px 20px;
          border-radius: 18px;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .contact-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .contact-col {
          display: flex;
          flex-direction: column;
        }

        /* 11. FOOTER */
        .landing-footer {
          background: linear-gradient(180deg, #070A11 0%, #030509 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 44px 0 24px;
          color: #94A3B8;
          position: relative;
        }

        /* Complete reset for all footer buttons to prevent user-agent default styling */
        .landing-footer button {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background: transparent;
          border: none;
          outline: none;
          color: inherit;
          font-family: inherit;
          padding: 0;
          margin: 0;
          cursor: pointer;
          text-decoration: none;
        }

        .footer-top-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr 1.15fr 1fr;
          gap: 32px;
          margin-bottom: 36px;
        }
        @media (max-width: 1024px) {
          .footer-top-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
          }
        }
        @media (max-width: 640px) {
          .footer-top-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        .footer-col {
          display: flex;
          flex-direction: column;
        }
        .footer-brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .footer-brand-headings {
          display: flex;
          flex-direction: column;
        }
        .footer-brand-title {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .footer-brand-badge {
          display: inline-block;
          font-size: 0.64rem;
          font-weight: 700;
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 1px 7px;
          border-radius: 9999px;
          margin-top: 4px;
          width: fit-content;
        }
        .footer-brand-tagline {
          font-size: 0.8rem;
          line-height: 1.55;
          color: #94A3B8;
          margin-bottom: 14px;
        }
        .footer-address-block {
          margin-bottom: 14px;
        }
        .footer-address-line {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.77rem;
          color: #94A3B8;
          line-height: 1.45;
        }
        .footer-icon-accent {
          color: #F43F5E;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .footer-icon-emerald {
          color: #10B981;
          flex-shrink: 0;
        }
        .footer-contact-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .footer-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #E2E8F0;
          font-size: 0.76rem;
          font-weight: 550;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .footer-chip:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.35);
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .footer-col-title {
          font-family: var(--font-heading);
          font-size: 0.88rem;
          font-weight: 750;
          color: #FFFFFF;
          margin-bottom: 16px;
          letter-spacing: 0.02em;
          position: relative;
          padding-bottom: 8px;
        }
        .footer-col-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 24px;
          height: 2px;
          background: #6366F1;
          border-radius: 2px;
        }
        .footer-links-list, .footer-perks-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-nav-link {
          color: #94A3B8;
          text-decoration: none;
          font-size: 0.79rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.18s ease;
        }
        .footer-nav-link:hover {
          color: #FFFFFF;
          transform: translateX(3px);
        }
        .footer-link-bullet {
          color: #6366F1;
          font-weight: 700;
          font-size: 0.95rem;
          line-height: 1;
        }
        .footer-perk-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.78rem;
          color: #94A3B8;
          line-height: 1.45;
        }
        .footer-buttons-stack {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .footer-btn-primary {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%) !important;
          color: #FFFFFF !important;
          padding: 9px 14px !important;
          border-radius: 9px;
          font-size: 0.8rem;
          font-weight: 650;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
          transition: all 0.2s ease;
        }
        .footer-btn-primary:hover {
          background: linear-gradient(135deg, #4338CA 0%, #4F46E5 100%) !important;
          box-shadow: 0 6px 18px rgba(79, 70, 229, 0.4);
          transform: translateY(-1px);
        }
        .footer-btn-secondary {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #E2E8F0 !important;
          padding: 8px 14px !important;
          border-radius: 9px;
          font-size: 0.79rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .footer-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          color: #FFFFFF !important;
        }
        .footer-btn-ghost {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: transparent !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #94A3B8 !important;
          padding: 8px 14px !important;
          border-radius: 9px;
          font-size: 0.77rem;
          font-weight: 550;
          transition: all 0.2s ease;
        }
        .footer-btn-ghost:hover {
          color: #FFFFFF !important;
          border-color: rgba(255, 255, 255, 0.18) !important;
          background: rgba(255, 255, 255, 0.04) !important;
        }

        .footer-bottom-bar {
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          padding-top: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          font-size: 0.76rem;
          color: #64748B;
        }
        @media (max-width: 768px) {
          .footer-bottom-bar {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
          }
        }
        .footer-copyright-text {
          color: #94A3B8;
        }
        .footer-brand-highlight {
          color: #FFFFFF;
          font-weight: 700;
        }
        .footer-city-tag {
          color: #64748B;
          margin-left: 4px;
        }
        .footer-bottom-links {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 768px) {
          .footer-bottom-links {
            justify-content: center;
          }
        }
        .footer-bottom-link-btn {
          appearance: none;
          -webkit-appearance: none;
          background: transparent !important;
          border: none !important;
          color: #94A3B8 !important;
          font-size: 0.77rem !important;
          font-weight: 550;
          text-decoration: none !important;
          cursor: pointer;
          padding: 3px 6px !important;
          border-radius: 5px;
          transition: all 0.15s ease;
        }
        .footer-bottom-link-btn:hover {
          color: #818CF8 !important;
          background: rgba(99, 102, 241, 0.08) !important;
        }
        .footer-dot-separator {
          color: #334155;
          font-size: 0.65rem;
        }
        .footer-scroll-top-btn {
          color: #818CF8 !important;
          font-weight: 600 !important;
        }

        /* Reusable Section Headers */
        .section-header-center {
          max-width: 720px;
          margin: 0 auto;
        }
        .section-pill-tag {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 750;
          color: #818CF8;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 3px 12px;
          border-radius: 9999px;
          margin-bottom: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .section-heading-lg {
          font-family: var(--font-heading);
          font-size: 1.65rem;
          font-weight: 850;
          color: #FFFFFF;
          margin-bottom: 8px;
          line-height: 1.22;
          letter-spacing: -0.02em;
        }
        @media (min-width: 768px) {
          .section-heading-lg { font-size: 2.2rem; }
        }
        .section-sub-text {
          font-size: 0.85rem;
          color: #94A3B8;
          line-height: 1.55;
        }

        /* Mobile specific overrides */
        @media (max-width: 768px) {
          .desktop-only-btn {
            display: none !important;
          }
          .brand-sub-desc {
            display: none !important;
          }
          .brand-classes-badge {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .hero-headline {
            font-size: 1.75rem;
          }
          .caption-desc {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
