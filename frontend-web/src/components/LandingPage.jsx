import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, CheckCircle2, ArrowRight, Wrench, CalendarClock, Users, Building2, Sparkles, Boxes, CalendarDays, ShieldCheck } from 'lucide-react';
import Footer from './Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-100 selection:text-blue-900">

            {/*  NAVBAR - Updated with safe-area padding for mobile notch */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 pt-[env(safe-area-inset-top)]">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl shadow-md">
                            PW
                        </div>
                        <span className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">CMMS</span>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link to="/login" className="hidden sm:block text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                            Log in
                        </Link>
                        <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap">
                            Free Trial
                        </Link>
                    </div>
                </div>
            </nav>

            {/*  HERO SECTION  */}
            <main className="flex-1 flex flex-col">
                <section className="relative pt-12 md:pt-20 pb-20 md:pb-32 overflow-hidden px-4 md:px-6">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 -z-10 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>
                    <div className="absolute bottom-0 left-0 -z-10 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/4"></div>

                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-16 items-center">

                        {/* Hero Text */}
                        <div className="max-w-2xl mx-auto text-center lg:text-left">
                            <div className="justify-center lg:justify-start text-blue-600 font-bold text-[10px] md:text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4 animate-spin-slow" />
                                CMMS & Maintenance Management
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight md:leading-[1.1] mb-4 md:mb-6 tracking-tight">
                                One Platform for CMMS, Safety, and Asset Operations
                            </h1>
                            <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Pulseworks CMMS is the modern platform built to bring work orders, compliance, and preventive maintenance together. Extend asset life, reduce downtime, and empower your teams.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                                <Link to="/signup" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                                    Create Workspace <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                                </Link>
                                <Link to="/login" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full text-sm md:text-base font-bold transition-all flex items-center justify-center shadow-sm hover:shadow-md">
                                    Sign In to Dashboard
                                </Link>
                            </div>
                        </div>

                        {/* Hero Image/UI Mockup */}
                        <div className="relative mx-auto w-full max-w-sm md:max-w-lg lg:max-w-none px-2 md:px-0 mt-8 md:mt-0">
                            <div className="relative rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden z-10 transform transition-transform hover:-translate-y-2 duration-500">
                                <div className="h-10 md:h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"></div>
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="p-4 md:p-6 bg-white">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="h-4 md:h-6 w-32 md:w-48 bg-gray-200 rounded-md"></div>
                                        <div className="h-6 md:h-8 w-20 md:w-24 bg-blue-600 rounded-lg"></div>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        {[
                                            { bg: 'bg-blue-100' },
                                            { bg: 'bg-orange-100' },
                                            { bg: 'bg-purple-100' }
                                        ].map((mock, idx) => (
                                            <div key={idx} className="h-16 md:h-20 w-full bg-gray-50 rounded-xl border border-gray-100 flex items-center px-3 md:px-4 gap-3 md:gap-4">
                                                <div className={`w-10 h-10 md:w-12 md:h-12 ${mock.bg} rounded-lg shrink-0`}></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 md:h-4 w-1/2 md:w-1/3 bg-gray-300 rounded"></div>
                                                    <div className="h-2 md:h-3 w-1/3 md:w-1/4 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 bg-white p-4 md:p-6 rounded-2xl shadow-xl border border-gray-100 z-20 animate-bounce-slow hidden sm:block">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-bold text-gray-900">Work Order #1024</p>
                                        <p className="text-[10px] md:text-xs font-medium text-green-600">Completed on time</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/*  FEATURES SECTION  */}
                <section id="features" className="py-16 md:py-24 bg-gray-50 border-t border-gray-100 px-4 md:px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 md:mb-6">Everything your maintenance team needs.</h2>
                            <p className="text-base md:text-lg text-gray-600">Eliminate paperwork, streamline communication, and gain deep insights into your operations with Pulseworks CMMS comprehensive toolkit.</p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">

                            {[
                                { icon: Wrench, color: "text-blue-600", bg: "bg-blue-100", title: "Work Order Management", desc: "Create, assign, and track work orders in real-time. Keep your entire team aligned with instant updates." },
                                { icon: CalendarClock, color: "text-purple-600", bg: "bg-purple-100", title: "Preventive Maintenance", desc: "Transition from reactive to proactive. Schedule recurring maintenance tasks and automate reminders." },
                                { icon: Building2, color: "text-orange-600", bg: "bg-orange-100", title: "Multi-Site Locations", desc: "Manage infinite sites from a single dashboard. Filter assets and work orders by physical location." },
                                { icon: Users, color: "text-green-600", bg: "bg-green-100", title: "Team Collaboration", desc: "Organize users into dedicated teams. Control viewing permissions and communicate securely." },
                                { icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-100", title: "AI-Powered Search", desc: "Ask questions in plain English. Instantly check tracking statuses and retrieve historical asset data." },
                                { icon: Boxes, color: "text-teal-600", bg: "bg-teal-100", title: "Digital Inventory", desc: "Ditch the pen and paper. Track all inbound parts and monitor outbound usage dynamically." },
                                { icon: CalendarDays, color: "text-pink-600", bg: "bg-pink-100", title: "Project Planning", desc: "Visualize your entire operational roadmap. Coordinate long-term upgrades alongside daily tasks." },
                                { icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-100", title: "Secure Workspace", desc: "Enterprise-grade protection. Strict admin-approval workflows ensure only authorized personnel enter." }
                            ].map((feature, index) => (
                                <div key={index} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-4 md:mb-6`}>
                                        <feature.icon className="w-6 h-6 md:w-7 md:h-7" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}

                        </div>
                    </div>
                </section>

                {/*  BOTTOM CTA  */}
                <section className="py-16 md:py-24 bg-white relative overflow-hidden px-4 md:px-6">
                    <div className="absolute inset-0 bg-blue-600/5 -skew-y-3 origin-top-left transform scale-110 -z-10"></div>
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 md:mb-6">Ready to transform your operations?</h2>
                        <p className="text-base md:text-xl text-gray-600 mb-8 md:mb-10 px-4">Join the forward-thinking organizations using Pulseworks CMMS to power their maintenance teams.</p>
                        <Link to="/signup" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full text-base md:text-lg font-bold transition-all shadow-xl hover:shadow-2xl">
                            Get Started for Free
                        </Link>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;