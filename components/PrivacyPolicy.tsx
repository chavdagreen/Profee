
import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:underline">
          <ArrowLeft size={20} /> Back to Login
        </button>

        <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-slate-400">Last updated: February 2026</p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">1. Introduction</h2>
              <p>Profee ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our tax practice management application at profee.in.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">2. Information We Collect</h2>
              <p>We collect information you provide directly to us:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
                <li><strong>Practice Information:</strong> Practice name, address, PAN, GSTIN, and bank details for invoice generation</li>
                <li><strong>Client Data:</strong> Client names, contact details, PAN numbers, and case information you enter</li>
                <li><strong>Financial Records:</strong> Invoices, receipts, and billing information you create</li>
                <li><strong>Calendar Data:</strong> Hearing dates and schedules (synced with Google Calendar if you enable this feature)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and store your practice management data</li>
                <li>Generate invoices and receipts on your behalf</li>
                <li>Sync hearing dates to your Google Calendar (with your permission)</li>
                <li>Send important updates about the service</li>
                <li>Respond to your requests and support inquiries</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">4. Data Storage and Security</h2>
              <p>Your data is stored securely using Supabase, a trusted cloud database provider with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Row Level Security (RLS) ensuring you can only access your own data</li>
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Encrypted data storage at rest</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">5. Google Calendar Integration</h2>
              <p>If you choose to sign in with Google and enable calendar sync:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We request access to create events in your Google Calendar</li>
                <li>We only create hearing reminder events; we do not read or modify your existing events</li>
                <li>You can revoke this access anytime from your Google Account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">6. Data Sharing</h2>
              <p>We do NOT sell, trade, or share your personal or client data with third parties except:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights or safety</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Withdraw consent for optional features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">8. Data Retention</h2>
              <p>We retain your data for as long as your account is active. If you delete your account, we will delete your data within 30 days, except where we are required to retain it for legal or regulatory purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">9. Children's Privacy</h2>
              <p>Profee is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">11. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
              <p className="font-bold text-indigo-600">support@profee.in</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
