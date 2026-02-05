
import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:underline">
          <ArrowLeft size={20} /> Back to Login
        </button>

        <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Terms of Service</h1>
              <p className="text-sm text-slate-400">Last updated: February 2026</p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using Profee at profee.in ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">2. Description of Service</h2>
              <p>Profee is a tax practice management application designed for Indian tax professionals. The Service provides:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Client management and record keeping</li>
                <li>Hearing and litigation tracking</li>
                <li>Invoice and receipt generation</li>
                <li>Calendar management with Google Calendar integration</li>
                <li>Practice analytics and reporting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">3. User Accounts</h2>
              <p>To use our Service, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an account with accurate and complete information</li>
                <li>Be at least 18 years of age</li>
                <li>Be responsible for maintaining the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">4. Acceptable Use</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Transmit any malicious code, viruses, or harmful content</li>
                <li>Interfere with other users' access to the Service</li>
                <li>Use the Service to store or transmit infringing or illegal content</li>
                <li>Reverse engineer or attempt to extract the source code of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">5. Data and Content</h2>
              <p>You retain ownership of all data and content you upload to the Service. By using the Service, you grant us a limited license to store, process, and display your content solely for the purpose of providing the Service to you.</p>
              <p className="mt-2">You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The accuracy and legality of the data you enter</li>
                <li>Obtaining necessary consents from your clients before storing their information</li>
                <li>Maintaining your own backups of critical data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">6. Third-Party Services</h2>
              <p>Our Service integrates with third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google:</strong> For authentication and calendar integration</li>
                <li><strong>Supabase:</strong> For data storage and authentication</li>
              </ul>
              <p className="mt-2">Your use of these third-party services is subject to their respective terms and privacy policies.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">7. Invoices and Financial Documents</h2>
              <p>The Service allows you to generate invoices and receipts. You acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are solely responsible for the accuracy of financial information</li>
                <li>Profee does not provide tax, legal, or financial advice</li>
                <li>Generated documents are tools for your practice; compliance with tax laws is your responsibility</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">8. Service Availability</h2>
              <p>We strive to maintain high availability but do not guarantee uninterrupted access. We may:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Perform scheduled maintenance with advance notice when possible</li>
                <li>Experience downtime due to factors beyond our control</li>
                <li>Modify or discontinue features with reasonable notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">9. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Service is provided "AS IS" without warranties of any kind</li>
                <li>We shall not be liable for any indirect, incidental, special, or consequential damages</li>
                <li>Our total liability shall not exceed the amount paid by you for the Service in the past 12 months</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">10. Indemnification</h2>
              <p>You agree to indemnify and hold harmless Profee and its operators from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">11. Termination</h2>
              <p>We may suspend or terminate your account if you violate these Terms. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">12. Governing Law</h2>
              <p>These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">13. Changes to Terms</h2>
              <p>We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify users of significant changes via email or in-app notification.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">14. Contact</h2>
              <p>For questions about these Terms, contact us at:</p>
              <p className="font-bold text-indigo-600">support@profee.in</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
