import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
    Settings, ArrowRight, Wrench, CalendarClock, Users, Building2, 
    Sparkles, Boxes, CalendarDays, ShieldCheck, Activity, Cpu, Shield, 
    MapPin, Database, Cloud, Globe, MousePointer2, Lock, ArrowUpRight,
    LineChart, CheckCircle2, Zap, Clock
} from 'lucide-react';
import Footer from './Footer.jsx';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);
  const constellationRef = useRef(null);
  const constellationInnerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cx = 0, cy = 0, mx = 0, my = 0;
    let cursorAnim;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const animateCursor = () => {
      cx += (mx - cx) * 0.2;
      cy += (my - cy) * 0.2;
      if (cursorRef.current) {
        cursorRef.current.style.left = `${cx}px`;
        cursorRef.current.style.top = `${cy}px`;
      }
      cursorAnim = requestAnimationFrame(animateCursor);
    };

    document.addEventListener("mousemove", onMouseMove);
    cursorAnim = requestAnimationFrame(animateCursor);

    const ctx = gsap.context(() => {
      document.querySelectorAll("a, button, .tile, .feature-card").forEach((el) => {
        el.addEventListener("mouseenter", () => gsap.to(cursorRef.current, { width: 36, height: 36, duration: 0.3 }));
        el.addEventListener("mouseleave", () => gsap.to(cursorRef.current, { width: 12, height: 12, duration: 0.3 }));
      });

      document.querySelectorAll(".constellation-lines path").forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
      });

      const splitWords = (selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const words = el.innerText.split(" ");
          el.innerHTML = words.map(w => 
            `<span class="sword" style="display:inline-block;overflow:hidden;padding-bottom:0.12em;vertical-align:top;"><span class="sword-inner" style="display:inline-block;transform:translateY(110%);will-change:transform;">${w}</span></span>`
          ).join(" ");
        });
      };

      splitWords(".features-title");
      splitWords(".final-cta-h2");

      document.querySelectorAll(".final-cta-h2 .sword-inner").forEach((el) => {
        if (el.textContent.includes("time") || el.textContent.includes("breakdowns.")) {
          el.style.color = "var(--yellow)";
        }
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });
      tl.to(".site-header", { opacity: 1, duration: 0.8 }, 0)
        .to(".title-inner", { y: 0, duration: 1.1, stagger: 0.08, ease: "power4.out" }, 0.2)
        .to(".hero-desc", { opacity: 1, duration: 0.8 }, 0.9)
        .from(".hero-desc", { y: 20, duration: 0.8 }, 0.9)
        .to(".cta-btn-hero", { opacity: 1, duration: 0.7 }, 1.0)
        .from(".cta-btn-hero", { y: 20, duration: 0.7 }, 1.0)
        .to(".tile", { opacity: 1, scale: 1, duration: 1.2, stagger: { each: 0.07, from: "center" }, ease: "elastic.out(1, 0.6)" }, 0.5)
        .from(".tile", { scale: 0, duration: 1.2, stagger: { each: 0.07, from: "center" }, ease: "elastic.out(1, 0.6)" }, 0.5)
        .to(".constellation-lines path", { strokeDashoffset: 0, duration: 1.4, stagger: 0.06, ease: "power2.inOut" }, 0.8)
        .to(".metric-pill", { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=2.4");

      if (constellationRef.current && constellationInnerRef.current) {
        constellationRef.current.addEventListener("mousemove", (e) => {
          const rect = constellationRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(constellationInnerRef.current, { rotationY: x * 12, rotationX: -y * 8, duration: 0.8, transformPerspective: 1500, ease: "power2.out" });
        });
        constellationRef.current.addEventListener("mouseleave", () => {
          gsap.to(constellationInnerRef.current, { rotationY: 0, rotationX: 0, duration: 1, ease: "elastic.out(1, 0.5)" });
        });
      }

      gsap.to(".constellation", {
        y: 100, scale: 0.92,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
      });
      gsap.to(".hero-left", {
        y: 60, opacity: 0.4,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
      });

      let mouseMoveHandler;
      if (!window.matchMedia("(pointer: coarse)").matches) {
        mouseMoveHandler = (e) => {
          const x = e.clientX / window.innerWidth - 0.5;
          const y = e.clientY / window.innerHeight - 0.5;
          gsap.to(".grid-bg", { x: x * 10, y: y * 10, duration: 2, ease: "power3.out", overwrite: "auto" });
        };
        document.addEventListener("mousemove", mouseMoveHandler);

        const cta = document.querySelector(".header-cta");
        if (cta) {
          cta.addEventListener("mousemove", (e) => {
            const r = cta.getBoundingClientRect();
            const cx = (e.clientX - r.left - r.width / 2) / r.width;
            const cy = (e.clientY - r.top - r.height / 2) / r.height;
            gsap.to(cta, { x: cx * 6, y: cy * 6, duration: 0.4, ease: "power2.out" });
          });
          cta.addEventListener("mouseleave", () => {
            gsap.to(cta, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,.5)" });
          });
        }
      }

      return () => {
        if (mouseMoveHandler) document.removeEventListener("mousemove", mouseMoveHandler);
      };
    }, containerRef);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(cursorAnim);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="traffo-landing font-sans bg-[#f6f3eb] text-[#0f0f0f] min-h-screen overflow-x-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600&display=swap');
        
        .traffo-landing * { cursor: none; }
        
        .traffo-landing::before {
          content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 200; mix-blend-mode: multiply; opacity: 0.1;
          background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>");
        }

        .cursor { position: fixed; width: 12px; height: 12px; background: #0f0f0f; border-radius: 50%; pointer-events: none; z-index: 9999; mix-blend-mode: difference; transform: translate(-50%, -50%); transition: width 0.3s, height 0.3s; }

        .site-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 56px; position: relative; z-index: 10; opacity: 0; }
        .logo { font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700; font-size: 22px; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
        .logo-cube { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15)); }
        
        .header-nav { display: flex; gap: 36px; align-items: center; font-family: "Manrope", sans-serif; font-size: 14px; font-weight: 500; color: #5a5a55; }
        .header-nav a { display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
        .header-nav a:hover { color: #0f0f0f; }

        .header-btn { display: inline-flex; align-items: center; gap: 10px; padding: 12px 22px; font-family: "Manrope", sans-serif; font-size: 13px; font-weight: 600; color: #0f0f0f; background: transparent; border: 1.5px solid #0f0f0f; border-radius: 12px; transition: all 0.3s; box-shadow: 0 4px 0 #0f0f0f; }
        .header-btn:hover { transform: translateY(2px); box-shadow: 0 2px 0 #0f0f0f; }
        .header-btn:active { transform: translateY(4px); box-shadow: 0 0 0 #0f0f0f; }

        .hero { display: grid; grid-template-columns: 1fr 1.15fr; gap: 40px; padding: 40px 56px 40px; align-items: center; position: relative; z-index: 5; min-height: 720px; }
        .hero-left { padding-top: 20px; }
        .hero-title { font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700; font-size: clamp(48px, 5.8vw, 84px); line-height: 1; letter-spacing: -0.035em; margin-bottom: 32px; }
        .title-line { display: block; overflow: hidden; padding-bottom: 0.08em; }
        .title-inner { display: inline-block; will-change: transform; transform: translateY(110%); }
        .hero-desc { font-size: 16px; line-height: 1.55; color: #5a5a55; max-width: 380px; margin-bottom: 40px; opacity: 0; }

        .cta-btn { display: inline-flex; align-items: center; gap: 14px; padding: 18px 32px; font-family: "Manrope", sans-serif; font-size: 15px; font-weight: 600; color: white; background: linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%); border: none; border-radius: 14px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.22), 0 16px 32px rgba(0, 0, 0, 0.12); transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s; position: relative; overflow: hidden; }
        .cta-btn-hero { opacity: 0; }
        .cta-btn::before { content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent); transition: left 0.6s ease; }
        .cta-btn:hover::before { left: 100%; }
        .cta-btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 14px 28px rgba(0, 0, 0, 0.3), 0 28px 56px rgba(0, 0, 0, 0.18); }
        .cta-arrow { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: rgba(255, 255, 255, 0.12); transition: transform 0.4s; }
        .cta-btn:hover .cta-arrow { transform: translateX(4px); }

        .hero-right { display: flex; align-items: center; justify-content: center; position: relative; }
        .grid-bg { position: absolute; inset: 0; top: -100px; right: -200px; bottom: 0; background-size: 50px 50px; background-image: linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px); mask-image: radial-gradient(circle at center, black 20%, transparent 70%); z-index: 0; pointer-events: none; will-change: transform; }
        .constellation { position: relative; width: 600px; height: 660px; max-width: 100%; perspective: 1500px; transform-style: preserve-3d; }
        .constellation-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; will-change: transform; z-index: 1; }
        .constellation-lines { position: absolute; inset: 0; pointer-events: none; z-index: 0; width: 100%; height: 100%; }
        .constellation-lines path { fill: none; stroke: rgba(15, 15, 15, 0.85); stroke-width: 1.6; stroke-linecap: round; }
        
        .tile { position: absolute; z-index: 2; transform-style: preserve-3d; opacity: 0; }
        .tile-inner { width: 100%; height: 100%; border-radius: 36px; display: flex; align-items: center; justify-content: center; position: relative; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); will-change: transform; }
        .tile:hover .tile-inner { transform: translateY(-10px) scale(1.06); }
        .tile-icon { display: flex; align-items: center; justify-content: center; transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .tile:hover .tile-icon { transform: scale(1.12) rotate(-4deg); }

        .tile.mint .tile-inner { background: linear-gradient(165deg, #dcf5dc 0%, #c8ecc8 50%, #95c598 100%); box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.7), inset 0 -4px 0 rgba(0, 0, 0, 0.08), inset 0 0 30px rgba(255, 255, 255, 0.4), 0 12px 24px rgba(149, 197, 152, 0.4), 0 24px 48px rgba(0, 0, 0, 0.08); color: #0f0f0f; }
        .tile.yellow .tile-inner { background: linear-gradient(165deg, #ffd96a 0%, #fbc536 50%, #d99c10 100%); box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.6), inset 0 -4px 0 rgba(0, 0, 0, 0.12), inset 0 0 30px rgba(255, 255, 255, 0.3), 0 12px 24px rgba(217, 156, 16, 0.35), 0 24px 48px rgba(0, 0, 0, 0.1); color: #0f0f0f; }
        .tile.purple .tile-inner { background: linear-gradient(165deg, #ece2f8 0%, #dcd0ee 50%, #ab9bd0 100%); box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.7), inset 0 -4px 0 rgba(0, 0, 0, 0.08), inset 0 0 30px rgba(255, 255, 255, 0.4), 0 12px 24px rgba(171, 155, 208, 0.4), 0 24px 48px rgba(0, 0, 0, 0.08); color: #0f0f0f; }
        .tile.black .tile-inner { background: linear-gradient(165deg, #3a3a3a 0%, #1a1a1a 50%, #050505 100%); box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.2), inset 0 -3px 0 rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.05), 0 12px 24px rgba(0, 0, 0, 0.3), 0 24px 48px rgba(0, 0, 0, 0.18); color: white; }

        .tile.size-main { width: 142px; height: 118px; }
        .tile.size-big { width: 156px; height: 132px; }
        .tile.size-pill { width: 64px; height: 64px; }
        .tile.size-pill .tile-inner { border-radius: 50%; }

        .tile-lock { top: 0; left: calc(50% - 32px); }
        .tile-expand { top: 95px; left: 95px; }
        .tile-chart { top: 95px; left: 365px; }
        .tile-cloud { top: 245px; left: 5px; }
        .tile-db { top: 240px; left: 222px; }
        .tile-thumb { top: 245px; left: 455px; }
        .tile-cursor { top: 405px; left: 45px; }
        .tile-person { top: 395px; left: 145px; }
        .tile-globe { top: 395px; left: 315px; }
        .tile-thumbpill { top: 405px; left: 495px; }
        .tile-hex { top: 545px; left: 230px; }

        @media (max-width: 1100px) {
          .hero { grid-template-columns: 1fr; gap: 60px; padding: 20px 32px; min-height: auto; }
          .site-header { padding: 20px 32px; }
        }

        @media (max-width: 700px) {
          .traffo-landing, .traffo-landing * { cursor: auto !important; }
          .cursor { display: none; }
          .header-nav { display: none; }
          .constellation { width: 100%; height: 580px; }
          .tile.size-main { width: 110px; height: 92px; }
          .tile.size-big { width: 120px; height: 102px; }
          .tile.size-pill { width: 52px; height: 52px; }
        }
      `}</style>

      <div className="ambient-1 absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
      <div className="ambient-2 absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[60px] pointer-events-none z-0"></div>
      
      <div className="cursor" ref={cursorRef}></div>

      <header className="site-header">
        <div className="logo">
          <span className="logo-cube">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <defs>
                <linearGradient id="cubeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3a3a3a" />
                  <stop offset="100%" stopColor="#0a0a0a" />
                </linearGradient>
              </defs>
              <path d="M17 3 L29 9 L29 21 L17 27 L17 15 L5 9 Z" fill="url(#cubeGrad)" stroke="#000" strokeWidth="0.5" />
              <path d="M5 9 L17 15 L17 27 L5 21 Z" fill="#2a2a2a" stroke="#000" strokeWidth="0.5" />
              <path d="M17 3 L29 9 L17 15 L5 9 Z" fill="#444" stroke="#000" strokeWidth="0.5" />
            </svg>
          </span>
          <span>PULSEWORKS</span>
        </div>
        
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#">Security</a>
          <a href="#">Resources</a>
          <Link to="/login">Sign in</Link>
        </nav>
        
        <Link to="/signup" className="header-btn">Start for free
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </header>

      <main className="hero">
        <div className="hero-left">
          <h1 className="hero-title title">
            <span className="title-line"><span className="title-inner">Master your</span></span>
            <span className="title-line"><span className="title-inner">maintenance</span></span>
            <span className="title-line has-desc">
              <span className="title-inner">operations</span>
            </span>
          </h1>
          <p className="hero-desc">No more lost data or reactive fixes. Get the best output from your assets and maximize your team's efficiency.</p>
          <Link to="/signup" className="cta-btn cta-btn-hero">Start for free
            <span className="cta-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        </div>

        <div className="hero-right">
          <div className="grid-bg"></div>
          <div className="constellation" ref={constellationRef}>
            <svg className="constellation-lines" viewBox="0 0 600 660" preserveAspectRatio="xMidYMid meet">
              <path d="M 295 64 C 270 90, 220 110, 166 152" />
              <path d="M 305 64 C 330 90, 380 110, 434 152" />
              <path d="M 166 200 C 175 230, 230 260, 280 285" />
              <path d="M 434 200 C 425 230, 370 260, 320 285" />
              <path d="M 76 305 C 130 305, 200 305, 248 302" />
              <path d="M 524 305 C 470 305, 400 305, 352 302" />
              <path d="M 285 372 C 270 405, 240 440, 214 452" />
              <path d="M 315 372 C 330 405, 360 440, 386 452" />
              <path d="M 110 437 C 145 442, 175 448, 214 452" />
              <path d="M 490 437 C 455 442, 425 448, 386 452" />
              <path d="M 214 502 C 235 540, 270 575, 300 603" />
              <path d="M 386 502 C 365 540, 330 575, 300 603" />
            </svg>

            <div className="constellation-inner" ref={constellationInnerRef}>
              <div className="tile size-pill black tile-lock">
                <div className="tile-inner"><div className="tile-icon"><Lock strokeWidth={2.5} className="w-6 h-6 text-white"/></div></div>
              </div>
              <div className="tile size-main mint tile-expand">
                <div className="tile-inner"><div className="tile-icon"><Wrench strokeWidth={1.5} className="w-12 h-12 text-emerald-900"/></div></div>
              </div>
              <div className="tile size-main yellow tile-chart">
                <div className="tile-inner"><div className="tile-icon"><LineChart strokeWidth={1.5} className="w-12 h-12 text-amber-900"/></div></div>
              </div>
              <div className="tile size-main purple tile-cloud">
                <div className="tile-inner"><div className="tile-icon"><Cloud strokeWidth={1.5} className="w-12 h-12 text-purple-900"/></div></div>
              </div>
              <div className="tile size-big black tile-db">
                <div className="tile-inner"><div className="tile-icon"><Database strokeWidth={1.5} className="w-16 h-16 text-white"/></div></div>
              </div>
              <div className="tile size-main mint tile-thumb">
                <div className="tile-inner"><div className="tile-icon"><CheckCircle2 strokeWidth={1.5} className="w-12 h-12 text-emerald-900"/></div></div>
              </div>
              <div className="tile size-pill black tile-cursor">
                <div className="tile-inner"><div className="tile-icon"><MousePointer2 strokeWidth={2} className="w-6 h-6 text-white"/></div></div>
              </div>
              <div className="tile size-main yellow tile-person">
                <div className="tile-inner"><div className="tile-icon"><Users strokeWidth={1.5} className="w-12 h-12 text-amber-900"/></div></div>
              </div>
              <div className="tile size-main purple tile-globe">
                <div className="tile-inner"><div className="tile-icon"><Globe strokeWidth={1.5} className="w-12 h-12 text-purple-900"/></div></div>
              </div>
              <div className="tile size-pill black tile-thumbpill">
                <div className="tile-inner"><div className="tile-icon"><ShieldCheck strokeWidth={2} className="w-6 h-6 text-white"/></div></div>
              </div>
              <div className="tile size-main mint tile-hex">
                <div className="tile-inner"><div className="tile-icon"><Settings strokeWidth={1.5} className="w-12 h-12 text-emerald-900"/></div></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CORE BENEFITS BANNER */}
      <section className="py-16 bg-[#ecead4] px-6 border-b border-black/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-300">
          <div className="text-center px-4">
            <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3">Unlimited</div>
            <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Team Members</div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3">Cloud</div>
            <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Native Platform</div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3">256-bit</div>
            <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Secure Encryption</div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl md:text-5xl font-bold text-[#0f0f0f] mb-3">Real-time</div>
            <div className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">Data Syncing</div>
          </div>
        </div>
      </section>

      {/* THREE PILLARS & FEATURES GRID */}
      <section id="features" className="py-24 bg-[#ecead4] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-3 text-sm font-mono tracking-widest text-gray-500 uppercase mb-6">
              <div className="w-8 h-[2px] bg-black"></div>
              02 / Built for teams
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <h2 className="text-5xl md:text-7xl font-bold text-[#0f0f0f] tracking-tight max-w-2xl leading-none" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                Three pillars. One platform. Zero busywork.
              </h2>
              <div className="text-right font-mono text-xs text-gray-500 tracking-widest uppercase leading-relaxed">
                Version 1.0<br/>Shipped Latest<br/>Enterprise Secure
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-400 mb-6">01 — Manage</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Work Order Management</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">Create, assign, and track work orders in real-time. Keep your entire team aligned with instant updates and seamless handoffs.</p>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><Wrench className="w-6 h-6 text-gray-800" /></div>
            </div>

            <div className="bg-gradient-to-br from-[#dcf5dc] to-[#95c598] p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-600 mb-6">02 — Analyze</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Preventive Maintenance</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">Transition from reactive to proactive. Schedule recurring maintenance tasks and automate reminders to extend asset life.</p>
              <div className="w-14 h-14 rounded-2xl bg-black/10 flex items-center justify-center"><CalendarClock className="w-6 h-6 text-gray-900" /></div>
            </div>

            <div className="bg-gradient-to-br from-[#ece2f8] to-[#ab9bd0] p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-600 mb-6">03 — Protect</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Enterprise Security</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">Strict access controls with native Root Command Center. Enterprise-grade protection ensures only authorized personnel enter.</p>
              <div className="w-14 h-14 rounded-2xl bg-black/10 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-gray-900" /></div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-400 mb-6">04 — Scale</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Multi-Site Locations</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">Manage infinite sites from a single dashboard. Filter assets and work orders by physical location globally.</p>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-800" /></div>
            </div>

            <div className="bg-gradient-to-br from-[#ffd96a] to-[#d99c10] p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-700 mb-6">05 — Collaborate</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Team Collaboration</h3>
              <p className="text-sm text-gray-800 leading-relaxed mb-6">Organize users into dedicated teams. Control viewing permissions and communicate securely across departments.</p>
              <div className="w-14 h-14 rounded-2xl bg-black/10 flex items-center justify-center"><Users className="w-6 h-6 text-gray-900" /></div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-400 mb-6">06 — Track</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Digital Inventory</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">Ditch the pen and paper. Track all inbound parts and monitor outbound usage dynamically across all your warehouses.</p>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><Boxes className="w-6 h-6 text-gray-800" /></div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-400 mb-6">07 — Ask</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>AI-Powered Search</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">Ask questions in plain English. Instantly check tracking statuses and retrieve historical asset data via AI assistance.</p>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><Sparkles className="w-6 h-6 text-gray-800" /></div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="font-mono text-xs tracking-widest text-gray-400 mb-6">08 — Plan</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>Project Planning</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">Visualize your entire operational roadmap. Coordinate long-term upgrades alongside daily tasks effortlessly.</p>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><CalendarDays className="w-6 h-6 text-gray-800" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* STRAIGHT QUOTE SECTION */}

      {/* FINAL CTA */}
      <section className="py-24 bg-[#f6f3eb] px-6 text-center">
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
            <Link to="/signup" className="inline-flex items-center gap-3 bg-gradient-to-b from-[#ffd96a] to-[#d99c10] text-black px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_10px_20px_rgba(217,156,16,0.3)]">
              Start for free <ArrowRight className="w-5 h-5"/>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default LandingPage;