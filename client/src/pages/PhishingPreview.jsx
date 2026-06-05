import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const TABS = [
  {
    id: 'gmail',
    label: 'Gmail',
    pageUrl: '/pages/gmail.html?preview=true',
    emailPreview: {
      subject: 'Security Alert: Unusual sign-in attempt detected',
      from: 'Google Security Team',
      body: 'We detected an unusual sign-in attempt on your Google Account from an unrecognized device in Frankfurt, Germany. If you don\'t recognize this activity, please verify your account immediately.',
      cta: 'Secure My Account',
    },
  },
  {
    id: 'university',
    label: 'University',
    pageUrl: '/pages/university.html?preview=true',
    emailPreview: {
      subject: 'Action Required: Student Portal Access Expiring',
      from: 'IT Support — University',
      body: 'Due to an upcoming system migration, all student portal credentials must be re-verified within the next 24 hours. Failure to verify will result in temporary suspension of portal access.',
      cta: 'Verify My Account',
    },
  },
  {
    id: 'corporate',
    label: 'Corporate',
    pageUrl: '/pages/corporate.html?preview=true',
    emailPreview: {
      subject: 'Mandatory: Multi-Factor Authentication Setup Required',
      from: 'IT Security Department',
      body: 'As part of our company-wide security initiative, all employees must enroll in MFA by end of business today. Employees who fail to complete enrollment will lose access to internal systems.',
      cta: 'Set Up MFA Now',
    },
  },
];

export default function PhishingPreview() {
  const [activeTab, setActiveTab] = useState('gmail');
  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Phishing Preview</h1>
      <p className="text-gray-500 text-sm mb-6">Analyst preview of simulation pages and email templates</p>

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-accent text-white'
                : 'bg-card border border-border text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-lg px-4 py-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-accent" />
        <span className="text-sm text-accent font-medium">SIMULATION VIEW — Analyst Preview Only</span>
      </div>

      <div className="card p-0 overflow-hidden mb-6">
        <iframe
          key={tab.pageUrl}
          src={tab.pageUrl}
          title={`${tab.label} phishing page preview`}
          className="w-full h-[520px] border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Matching Email Template</h2>
        <div className="bg-bg border border-border rounded-lg p-6 max-w-xl">
          <div className="text-xs text-gray-500 mb-3">From: {tab.emailPreview.from}</div>
          <div className="text-sm font-medium text-white mb-4">
            Subject: {tab.emailPreview.subject}
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">{tab.emailPreview.body}</p>
          <div className="inline-block bg-accent text-white text-sm font-medium px-6 py-2.5 rounded">
            {tab.emailPreview.cta}
          </div>
        </div>
      </div>
    </div>
  );
}
