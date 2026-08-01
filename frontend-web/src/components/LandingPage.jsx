import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, CheckCircle2, ArrowRight, Wrench, CalendarClock, Users, Building2, Sparkles, Boxes, CalendarDays, ShieldCheck } from 'lucide-react'; import Footer from './Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-100 selection:text-blue-900">

            {/*  NAVBAR  */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                            K
                        </div>
                        <span className="text-xl font-extrabold text-gray-900 tracking-tight">Koda CMMS</span>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                        {/* <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-blue-600 transition-colors">Resources</a> */}
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors hidden sm:block">
                            Log in
                        </Link>
                        <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95">
                            Start a Free Trial
                        </Link>
                    </div>
                </div>
            </nav>

            {/*  HERO SECTION  */}
            <main className="flex-1 flex flex-col">
                <section className="relative pt-20 pb-32 overflow-hidden">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>
                    <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-purple-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/4"></div>

                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

                        {/* Hero Text */}
                        <div className="max-w-2xl">
                            <div className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4 animate-spin-slow" />
                                CMMS & Maintenance Management
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                                One Platform for CMMS, Safety, and Asset Operations
                            </h1>
                            <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg">
                                Koda is the modern CMMS platform built to bring work orders, compliance, and preventive maintenance together. Extend asset life, reduce downtime, and empower your maintenance teams to work safer and faster.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                                    Create Workspace <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/login" className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-full text-base font-bold transition-all flex items-center justify-center shadow-sm hover:shadow-md">
                                    Sign In to Dashboard
                                </Link>
                            </div>

                            <div className="mt-10 flex items-center gap-6 text-sm font-medium text-gray-500">
                                {/* <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> No credit card required</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> 14-day free trial</div> */}
                            </div>
                        </div>

                        {/* Hero Image/UI Mockup */}
                        <div className="relative relative mx-auto w-full max-w-lg lg:max-w-none">
                            <div className="relative rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden z-10 transform transition-transform hover:-translate-y-2 duration-500">
                                {/* Simulated App Header */}
                                <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                {/* Simulated App Content */}
                                <div className="p-6 bg-white">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="h-6 w-48 bg-gray-200 rounded-md"></div>
                                        <div className="h-8 w-24 bg-blue-600 rounded-lg"></div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-20 w-full bg-gray-50 rounded-xl border border-gray-100 flex items-center px-4 gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-1/3 bg-gray-300 rounded"></div>
                                                <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-20 w-full bg-gray-50 rounded-xl border border-gray-100 flex items-center px-4 gap-4">
                                            <div className="w-12 h-12 bg-orange-100 rounded-lg"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
                                                <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-20 w-full bg-gray-50 rounded-xl border border-gray-100 flex items-center px-4 gap-4">
                                            <div className="w-12 h-12 bg-purple-100 rounded-lg"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-1/4 bg-gray-300 rounded"></div>
                                                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative floating card */}
                            <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 z-20 animate-bounce-slow hidden md:block">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Work Order #1024</p>
                                        <p className="text-xs font-medium text-green-600">Completed on time</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/*  FEATURES SECTION  */}
                <section id="features" className="py-24 bg-gray-50 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Everything your maintenance team needs to succeed.</h2>
                            <p className="text-lg text-gray-600">Eliminate paperwork, streamline communication, and gain deep insights into your operations with Koda's comprehensive toolkit.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <Wrench className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Work Order Management</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Create, assign, and track work orders in real-time. Keep your entire team aligned with instant updates, priority tagging, and detailed activity logs.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                    <CalendarClock className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Preventive Maintenance</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Transition from reactive to proactive. Schedule recurring maintenance tasks, automate reminders, and prevent costly equipment failures before they happen.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <Building2 className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Site Locations</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Manage infinite sites from a single dashboard. Filter assets, work orders, and team members by physical location with granular access controls.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Team Collaboration</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Organize users into dedicated teams. Control viewing permissions, manage external vendor requests, and communicate securely on active projects.
                                </p>
                            </div>

                            {/* Feature 5: AI Search */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <Sparkles className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Search</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Ask questions in plain English. Instantly check the tracking status of any work order, retrieve historical asset data, and pull up exact maintenance logs without digging through menus.
                                </p>
                            </div>

                            {/* Feature 6: Inventory */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                                    <Boxes className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Digital Inventory</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Ditch the pen and paper. Track all inbound parts, monitor outbound usage, and manage your entire stock lifecycle dynamically in an all-in-one digital system.
                                </p>
                            </div>

                            {/* Feature 7: Project Planning */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-6">
                                    <CalendarDays className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Project & Calendar Planning</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Visualize your entire operational roadmap. Use built-in dynamic calendars and project plans to coordinate long-term upgrades alongside daily emergency tasks seamlessly.
                                </p>
                            </div>

                            {/* Feature 8: Security */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Workspace Access</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Enterprise-grade protection for your data. Strict admin-approval workflows ensure only vetted, authorized personnel can enter and view your organization's sensitive workspaces.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/*  BOTTOM CTA  */}
                <section className="py-24 bg-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/5 -skew-y-3 origin-top-left transform scale-110 -z-10"></div>
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Ready to transform your operations?</h2>
                        <p className="text-xl text-gray-600 mb-10">Join the forward-thinking organizations using Koda to power their maintenance teams.</p>
                        <Link to="/signup" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg font-bold transition-all shadow-xl hover:shadow-2xl">
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