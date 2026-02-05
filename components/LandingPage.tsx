
import React from 'react';
import { Gavel, Users, Calendar, FileText, Shield, Zap, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a]">
      {/* Header */}
      <header className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Gavel className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-indigo-600 tracking-tighter">Profee</span>
          </div>
          <button
            onClick={onGetStarted}
            className="clay-button px-6 py-3 font-bold text-sm flex items-center gap-2"
          >
            Sign In <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
            Tax Practice Management
            <span className="text-indigo-600"> Made Simple</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Profee is an AI-powered practice management suite designed for Indian tax professionals.
            Manage clients, track hearings, generate invoices, and sync with Google Calendar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="clay-button px-8 py-4 font-black text-lg flex items-center justify-center gap-3"
            >
              Get Started Free <ArrowRight size={20} />
            </button>
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
