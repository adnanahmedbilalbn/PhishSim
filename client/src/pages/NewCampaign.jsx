import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { CheckCircle, Loader2, AlertTriangle, X, Upload } from 'lucide-react';
import { apiFetch } from '../utils/api';

const TEMPLATES = [
  {
    id: 'gmail',
    name: 'Gmail Security Alert',
    description: 'Mimics Google security notification about unusual sign-in',
    color: 'from-red-500 to-yellow-500',
    subject: 'Security Alert: Unusual sign-in attempt detected',
    preview: 'We detected an unusual sign-in attempt on your Google Account from Frankfurt, Germany...',
  },
  {
    id: 'university',
    name: 'University Portal',
    description: 'KIET LMS portal — captures Student ID + Password on login',
    color: 'from-blue-700 to-blue-500',
    subject: 'Action Required: Student Portal Access Expiring',
    preview: 'Due to system migration, all student portal credentials must be re-verified within 24 hours...',
  },
  {
    id: 'corporate',
    name: 'Corporate MFA',
    description: 'Mandatory MFA enrollment from IT Security Department',
    color: 'from-slate-800 to-blue-600',
    subject: 'Mandatory: Multi-Factor Authentication Setup Required',
    preview: 'All employees must enroll in MFA by end of business today or lose system access...',
  },
];

export default function NewCampaign() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [targets, setTargets] = useState([]);
  const [emailText, setEmailText] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(null);
  const fileRef = useRef();

  const selectedTemplate = TEMPLATES.find((t) => t.id === template);

  const parseEmails = (text) => {
    const emails = text
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@') && e.includes('.'));
    return [...new Set(emails)];
  };

  const handleEmailTextChange = (text) => {
    setEmailText(text);
    setTargets(parseEmails(text));
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (results) => {
        const emails = [];
        results.data.forEach((row) => {
          Object.values(row).forEach((val) => {
            if (typeof val === 'string' && val.includes('@')) {
              emails.push(val.trim().toLowerCase());
            }
          });
        });
        const unique = [...new Set(emails)];
        setTargets(unique);
        setEmailText(unique.join('\n'));
      },
    });
    e.target.value = '';
  };

  const removeTarget = (email) => {
    const updated = targets.filter((t) => t !== email);
    setTargets(updated);
    setEmailText(updated.join('\n'));
  };

  const canProceed = () => {
    if (step === 1) return name.trim() && template;
    if (step === 2) return targets.length > 0;
    return true;
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const campaign = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, template, targets }),
      });
      const result = await apiFetch(`/api/campaigns/${campaign.id}/launch`, {
        method: 'POST',
      });
      setLaunched({ campaign, result });
    } catch (err) {
      alert('Launch failed: ' + err.message);
    } finally {
      setLaunching(false);
    }
  };

  if (launched) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Campaign Launched!</h1>
        <p className="text-gray-400 mb-2">
          {launched.result.sent_count} emails sent via Ethereal test server
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Check the server console for Ethereal preview URLs to view sent emails.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to={`/results/${launched.campaign.id}`} className="btn-primary">
            View Results
          </Link>
          <Link to="/" className="btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">New Campaign</h1>
      <p className="text-gray-500 text-sm mb-6">Create and launch a phishing simulation campaign</p>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold ${
                step >= s ? 'bg-accent text-white' : 'bg-border text-gray-500'
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
              {s === 1 ? 'Setup' : s === 2 ? 'Targets' : 'Launch'}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-accent' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 Security Awareness Test"
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Template</label>
            <div className="grid grid-cols-3 gap-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    template === t.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-gray-600'
                  }`}
                >
                  <div className={`h-16 rounded-md bg-gradient-to-br ${t.color} mb-3`} />
                  <p className="font-medium text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {template === 'university'
                ? 'Recipient Emails (one per line) — login page captures Student ID'
                : 'Target Emails (one per line)'}
            </label>
            <textarea
              value={emailText}
              onChange={(e) => handleEmailTextChange(e.target.value)}
              rows={6}
              placeholder={template === 'university'
                ? 'student1@kiet.edu&#10;student2@kiet.edu&#10;(emails receive the phishing link; victims enter Student ID on login page)'
                : 'student1@university.edu&#10;employee@company.com&#10;test@example.com'}
              className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <span className="text-sm text-gray-500">{targets.length} targets</span>
          </div>
          {targets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {targets.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 bg-border text-gray-300 text-xs px-2 py-1 rounded-full font-mono"
                >
                  {email}
                  <button onClick={() => removeTarget(email)} className="hover:text-accent">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && selectedTemplate && (
        <div className="card space-y-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Campaign</p>
              <p className="text-white font-medium">{name}</p>
            </div>
            <div>
              <p className="text-gray-500">Template</p>
              <p className="text-white font-medium">{selectedTemplate.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Targets</p>
              <p className="text-white font-mono">{targets.length}</p>
            </div>
          </div>

          <div className="bg-bg border border-border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Email Preview</p>
            <p className="text-sm font-medium text-white mb-1">Subject: {selectedTemplate.subject}</p>
            <p className="text-sm text-gray-400">{selectedTemplate.preview}</p>
          </div>

          <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              This simulation will send emails via Ethereal (test SMTP only). No real emails are delivered.
              Preview URLs will be logged to the server console.
            </p>
          </div>

          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
          >
            {launching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Launching...
              </>
            ) : (
              'Launch Campaign'
            )}
          </button>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-secondary disabled:opacity-30"
        >
          Back
        </button>
        {step < 3 && (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-30"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
