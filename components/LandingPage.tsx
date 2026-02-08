
import React from 'react';
import { Gavel, Users, Calendar, FileText, Shield, Zap, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a]">
      {/* Hero Section with GIF Background */}
      <section className="relative overflow-hidden">
        {/* GIF Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://llazlwfqjxekpaykcbox.supabase.co/storage/v1/object/sign/tax-portal-documents/Profee.in%20(Video).gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jNTg1ZGNiMi1lMGNlLTQ4ZmEtOTQ3NS1jZTQxMGIyNTNmMDgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0YXgtcG9ydGFsLWRvY3VtZW50cy9Qcm9mZWUuaW4gKFZpZGVvKS5naWYiLCJpYXQiOjE3NzA1MzE0NzksImV4cCI6MjA4NTg5MTQ3OX0.qHSA_myEdDpZnze8zFGfpDyhS7lQzM43dgRPxyZ_vSY')`,
          }}
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

        {/* Header - overlaid on GIF */}
        <header className="relative z-10 p-6 md:p-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-2xl text-white shadow-lg border border-white/20">
                <Gavel className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">Profee</span>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all"
            >
              Sign In <ArrowRight size={16} />
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
              Tax Practice Management
              <span className="text-indigo-400"> Made Simple</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-200 max-w-2xl mx-auto drop-shadow">
              Profee is an AI-powered practice management suite designed for Indian tax professionals.
              Manage clients, track hearings, generate invoices, and sync with Google Calendar.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-105"
              >
                Get Started Free <ArrowRight size={20} />
              </button>
              <button
                onClick={onGetStarted}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-105"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-white dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-center text-slate-800 dark:text-white mb-12">
            Everything You Need to Run Your Practice
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Client Management"
              description="Organize client information, track PAN, contact details, and maintain comprehensive records."
            />
            <FeatureCard
              icon={<Gavel className="w-8 h-8" />}
              title="Hearing Tracker"
              description="Track all litigation proceedings, hearing dates, forums, and case outcomes in one place."
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Google Calendar Sync"
              description="Automatically sync your hearing dates with Google Calendar to never miss an important date."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Invoice Generation"
              description="Create professional GST-compliant invoices and receipts with your branding."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure & Private"
              description="Your data is encrypted and stored securely. We never share your information."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="AI-Powered"
              description="Smart insights and automation to help you focus on what matters most."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            Ready to Streamline Your Practice?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Join tax professionals who trust Profee to manage their practice efficiently.
          </p>
          <button
            onClick={onGetStarted}
            className="clay-button px-8 py-4 font-black text-lg"
          >
            Start Using Profee
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Gavel className="w-5 h-5" />
            </div>
            <span className="font-black text-indigo-600">Profee</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="/privacy" className="hover:text-indigo-600 hover:underline">Privacy Policy</a>
            <a href="/terms" className="hover:text-indigo-600 hover:underline">Terms of Service</a>
          </div>
          <p className="text-sm text-slate-400">
            &copy; 2026 Profee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="clay-card p-8 bg-white dark:bg-slate-800 border-none text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

export default LandingPage;
