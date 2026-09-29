import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
    Settings, ArrowRight, Wrench, CalendarClock, Users, Building2, 
    Sparkles, Boxes, CalendarDays, ShieldCheck, CheckCircle2,
    Zap, Clock
} from 'lucide-react';
import Footer from './Footer.jsx';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Hero Animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });
      
      tl.from(".nav-fade", { y: -20, opacity: 0, duration: 0.6, stagger: 0.1 })
        .from(".hero-content > *", { y: 30, opacity: 0, duration: 0.8, stagger: 0.15 }, "-=0.4")
        .from(".hero-mockup", { x: 40, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.6")
        .from(".floating-badge", { y: 20, opacity: 0, scale: 0.8, duration: 0.6, ease: "back.out(1.5)" }, "-=0.2");

      // 2. Continuous Floating Animation for Mockup Elements
      gsap.to(".hero-mockup", { y: -15, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".floating-badge", { y: -10, duration: 3.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5 });

      // 3. Scroll Reveal for Sections
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.fromTo(el, 
          { y: 50, opacity: 0 }, 
          {
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
            y: 0, opacity: 1, duration: 0.8, ease: "power3.out"
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const featuresList = [
    { num: "01 — Manage", title: "Work Order Management", desc: "Create, assign, and track work orders in real-time. Keep your entire team aligned with instant updates and seamless handoffs.", icon: Wrench, bgClass: "bg-white text-gray-900" },
    { num: "02 — Analyze", title: "Preventive Maintenance", desc: "Transition from reactive to proactive. Schedule recurring maintenance tasks and automate reminders to extend asset life.", icon: CalendarClock, bgClass: "bg-[#c8ecc8] text-gray-900" },
    { num: "03 — Protect", title: "Enterprise Security", desc: "Strict access controls with native Root Command Center. Enterprise-grade protection ensures only authorized personnel enter.", icon: ShieldCheck, bgClass: "bg-[#dcd0ee] text-gray-900" },
    { num: "04 — Scale", title: "Multi-Site Locations", desc: "Manage infinite sites from a single dashboard. Filter assets and work orders by physical location globally.", icon: Building2, bgClass: "bg-white text-gray-900" },
    { num: "05 — Collaborate", title: "Team Collaboration", desc: "Organize users into dedicated teams. Control viewing permissions and communicate securely across departments.", icon: Users, bgClass: "bg-[#fbc536] text-gray-900" },
    { num: "06 — Track", title: "Digital Inventory", desc: "Ditch the pen and paper. Track all inbound parts and monitor outbound usage dynamically across all your warehouses.", icon: Boxes, bgClass: "bg-white text-gray-900" },
    { num: "07 — Ask", title: "AI-Powered Search", desc: "Ask questions in plain English. Instantly check tracking statuses and retrieve historical asset data via AI assistance.", icon: Sparkles, bgClass: "bg-white text-gray-900" },
    { num: "08 — Plan", title: "Project Planning", desc: "Visualize your entire operational roadmap. Coordinate long-term upgrades alongside daily tasks effortlessly.", icon: CalendarDays, bgClass: "bg-white text-gray-900" }
  ];

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-[#f6f3eb] font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/*  NAVBAR  */}
      <nav className="sticky top-0 z-50 bg-[#f6f3eb]/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between nav-fade">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
              PW
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Pulseworks CMMS</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#resources" className="hover:text-blue-600 transition-colors">Resources</a>
            <Link to="/login" className="hover:text-blue-600 transition-colors">Sign in</Link>
          </div>

          {/* Auth Button */}
          <div className="flex items-center">
            <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95">
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/*  HERO SECTION  */}
        <section className="relative pt-16 md:pt-24 pb-20 md:pb-32 px-6 lg:px-8 bg-white rounded-b-[48px] shadow-sm">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Content */}
            <div className="hero-content text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs tracking-widest uppercase mb-6">
                <Settings className="w-4 h-4 animate-spin-slow" />
                CMMS & Maintenance Management
              </div>
              
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                One Platform for CMMS, Safety, and Asset Operations
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed font-medium">
                Pulseworks CMMS is the modern platform built to bring work orders, compliance, and preventive maintenance together. Extend asset life, reduce downtime, and empower your teams.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95">
                  Create Workspace <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-full text-base font-bold transition-all flex items-center justify-center shadow-sm hover:shadow-md active:scale-95">
                  Sign In to Dashboard
                </Link>
              </div>
            </div>

            {/* Right Content: Clean UI Mockup */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-xl mt-10 lg:mt-0 hero-mockup">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="p-6 md:p-8 space-y-6 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-48 h-6 bg-gray-200 rounded-md"></div>
                    <div className="w-24 h-8 bg-blue-600 rounded-lg"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="w-full h-20 bg-white rounded-xl border border-gray-100 flex items-center px-4 gap-4 shadow-sm">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="w-1/2 h-3 bg-gray-300 rounded"></div>
                        <div className="w-1/3 h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="w-full h-20 bg-white rounded-xl border border-gray-100 flex items-center px-4 gap-4 shadow-sm">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="w-1/2 h-3 bg-gray-300 rounded"></div>
                        <div className="w-1/3 h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="w-full h-20 bg-white rounded-xl border border-gray-100 flex items-center px-4 gap-4 shadow-sm">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="w-1/2 h-3 bg-gray-300 rounded"></div>
                        <div className="w-1/3 h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 z-20 floating-badge flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900">Work Order #1024</p>
                  <p className="text-xs font-bold text-green-600">Completed on time</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/*  CORE BENEFITS BANNER  */}
        <section className="py-16 bg-[#ecead4] px-6 border-b border-black/10 reveal">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-300">
            <div className="text-center px-4">
              <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Unlimited</div>
              <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Team Members</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Cloud</div>
              <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Native Platform</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>256-bit</div>
              <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Secure Encryption</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Real-time</div>
              <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Data Syncing</div>
            </div>
          </div>
        </section>

        {/*  THREE PILLARS & FEATURES GRID  */}
        <section id="features" className="py-24 bg-[#ecead4] px-6">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="mb-16 reveal">
              <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-gray-500 uppercase mb-4">
                <div className="w-8 h-[1px] bg-black"></div>
                02 / Built for teams
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h2 className="text-5xl md:text-7xl font-bold text-[#0f0f0f] tracking-tight max-w-2xl leading-none" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                  Three pillars. One platform. Zero busywork.
                </h2>
                <div className="text-left md:text-right font-mono text-xs text-gray-500 tracking-widest uppercase leading-relaxed">
                  Version 1.0<br/>Shipped Latest<br/>Enterprise Secure
                </div>
              </div>
            </div>

            {/* Colored Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuresList.map((feature, index) => (
                <div key={index} className={`p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300 reveal flex flex-col h-full ${feature.bgClass}`}>
                  <div className="font-mono text-xs tracking-widest opacity-60 mb-6 uppercase">
                    {feature.num}
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                    {feature.title}
                  </h3>
                  <p className="text-sm opacity-80 leading-relaxed mb-8 flex-1">
                    {feature.desc}
                  </p>
                  <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mt-auto">
                    <feature.icon className="w-6 h-6 opacity-80" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CENTERED METRICS BANNER ─── */}
        <section id="resources" className="bg-gray-900 py-12 border-b border-black">
          <div className="max-w-7xl mx-auto px-6 reveal">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-x divide-gray-800">
              <div className="flex flex-col items-center justify-center border-none px-4">
                <Zap className="w-6 h-6 text-yellow-400 mb-3" />
                <div className="text-3xl md:text-4xl font-black text-white mb-1">45%</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faster Resolutions</div>
              </div>
              <div className="flex flex-col items-center justify-center px-4">
                <Clock className="w-6 h-6 text-blue-400 mb-3" />
                <div className="text-3xl md:text-4xl font-black text-white mb-1">99.9%</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Uptime</div>
              </div>
              <div className="flex flex-col items-center justify-center px-4">
                <ShieldCheck className="w-6 h-6 text-purple-400 mb-3" />
                <div className="text-3xl md:text-4xl font-black text-white mb-1">100%</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Audit Compliance</div>
              </div>
            </div>
          </div>
        </section>

        {/*  FINAL CTA  */}
        <section className="py-24 bg-[#f6f3eb] px-6 text-center reveal">
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] rounded-[48px] p-16 md:p-24 relative overflow-hidden shadow-2xl">
            <div className="absolute top-[-50px] left-[-50px] w-[300px] h-[300px] bg-yellow-400/20 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                Stop losing time on <span className="text-[#fbc536]">breakdowns.</span>
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
                Unlimited users. Enterprise security. Just better asset data, today.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-3 bg-gradient-to-b from-[#ffd96a] to-[#d99c10] text-black px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_10px_20px_rgba(217,156,16,0.3)]">
                Start for free <ArrowRight className="w-5 h-5"/>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/*  FOOTER  */}
      <Footer />
    </div>
  );
};

export default LandingPage;