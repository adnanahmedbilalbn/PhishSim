import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';

const PSYCHOLOGY = {
  gmail: {
    title: 'Authority + Fear Analysis',
    text: 'The Gmail template exploits trust in a well-known brand (Google) combined with fear of account compromise. The mention of a specific foreign location (Frankfurt) and unusual time (3:42 AM) creates urgency. Users are conditioned to trust Google security alerts, making them less likely to scrutinize the sender or link destination.',
  },
  university: {
    title: 'Deadline Pressure + Institutional Trust',
    text: 'The university template leverages institutional authority and deadline pressure. Students are accustomed to urgent IT notices about portal access. The 24-hour expiration creates artificial scarcity, and the threat of losing access to grades and registration motivates quick action without verification.',
  },
  corporate: {
    title: 'Compliance Fear + Professional Urgency',
    text: 'The corporate MFA template uses mandatory compliance language and consequences (loss of system access, payroll). Employees fear being locked out of work systems. The professional tone and IT Security sender name mimic legitimate internal communications, reducing skepticism.',
  },
};

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatSeconds(sec) {
  if (sec === null || sec === undefined) return '—';
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function rowColor(target) {
  if (target.submitted) return 'bg-accent/10';
  if (target.clicked) return 'bg-warning/10';
  if (target.opened) return 'bg-yellow-900/10';
  return '';
}

function submittedLabel(template) {
  if (template === 'university') return 'Student ID Submitted';
  if (template === 'corporate') return 'Username Submitted';
  return 'Email Submitted';
}

function exportCsv(campaign, targets) {
  const submittedCol = submittedLabel(campaign.template);
  const headers = ['Recipient Email', submittedCol, 'Sent', 'Opened', 'Time to Open (s)', 'Clicked', 'Time to Click (s)', 'Submitted', 'Submit Time'];
  const rows = targets.map((t) => [
    t.email,
    t.submitted_value ?? '',
    t.sent ? 'Yes' : 'No',
    t.opened ? 'Yes' : 'No',
    t.time_to_open ?? '',
    t.clicked ? 'Yes' : 'No',
    t.time_to_click ?? '',
    t.submitted ? 'Yes' : 'No',
    t.submit_time ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${campaign.name.replace(/\s+/g, '_')}_results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function FunnelBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-white">{count} ({pct}%)</span>
      </div>
      <div className="h-6 bg-border rounded overflow-hidden">
        <div className={`h-full ${color} rounded transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SingleCampaignResults({ campaignId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/results/${campaignId}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Campaign not found.</p>;

  const { campaign, targets, stats } = data;
  const psych = PSYCHOLOGY[campaign.template] || PSYCHOLOGY.gmail;
  const submittedCol = submittedLabel(campaign.template);

  const statCards = [
    { label: 'Sent', value: stats.sent_count, pct: 100, color: 'text-gray-300' },
    { label: 'Opened', value: stats.opened_count, pct: stats.open_rate, color: 'text-blue-400' },
    { label: 'Clicked', value: stats.clicked_count, pct: stats.click_rate, color: 'text-warning' },
    { label: 'Submitted', value: stats.submitted_count, pct: stats.submission_rate, color: 'text-accent' },
  ];

  return (
    <div>
      <Link to="/results" className="text-sm text-gray-500 hover:text-accent flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> All Results
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {campaign.template} template · Status: {campaign.status} ·
            Launched: {formatTime(campaign.launched_at)}
          </p>
        </div>
        <button
          onClick={() => exportCsv(campaign, targets)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, pct, color }) => (
          <div key={label} className="stat-card">
            <span className={`text-3xl font-mono font-bold ${color}`}>{value}</span>
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-xs font-mono text-gray-600 mt-1">{pct}%</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h2>
          <FunnelBar label="Sent" count={stats.sent_count} total={stats.total_targets} color="bg-gray-600" />
          <FunnelBar label="Opened" count={stats.opened_count} total={stats.sent_count} color="bg-blue-600" />
          <FunnelBar label="Clicked" count={stats.clicked_count} total={stats.sent_count} color="bg-yellow-600" />
          <FunnelBar label="Submitted" count={stats.submitted_count} total={stats.sent_count} color="bg-accent" />
          {stats.avg_time_to_click_seconds > 0 && (
            <p className="text-sm text-gray-500 mt-3">
              Avg time to click: <span className="font-mono text-white">{formatSeconds(stats.avg_time_to_click_seconds)}</span>
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-3">Psychological Analysis</h2>
          <p className="text-sm font-medium text-warning mb-2">{psych.title}</p>
          <p className="text-sm text-gray-400 leading-relaxed">{psych.text}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Per-Target Data</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-border">
                <th className="text-left py-2 px-2">Recipient Email</th>
                <th className="text-left py-2 px-2">{submittedCol}</th>
                <th className="text-left py-2 px-2">Sent Time</th>
                <th className="text-center py-2 px-2">Opened</th>
                <th className="text-center py-2 px-2">Time-to-Open</th>
                <th className="text-center py-2 px-2">Clicked</th>
                <th className="text-center py-2 px-2">Time-to-Click</th>
                <th className="text-center py-2 px-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id} className={`border-b border-border/50 ${rowColor(t)}`}>
                  <td className="py-2 px-2 font-mono text-xs">{t.email}</td>
                  <td className="py-2 px-2 font-mono text-xs text-accent">
                    {t.submitted_value || '—'}
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-400">{formatTime(t.sent_time)}</td>
                  <td className="py-2 px-2 text-center">{t.opened ? '✓' : '—'}</td>
                  <td className="py-2 px-2 text-center font-mono text-xs">{formatSeconds(t.time_to_open)}</td>
                  <td className="py-2 px-2 text-center">{t.clicked ? '✓' : '—'}</td>
                  <td className="py-2 px-2 text-center font-mono text-xs">{formatSeconds(t.time_to_click)}</td>
                  <td className="py-2 px-2 text-center">{t.submitted ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AllCampaignsResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/results/all')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const campaigns = data?.campaigns || [];
  const maxClickRate = Math.max(...campaigns.map((c) => c.stats.click_rate), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">All Campaign Results</h1>
      <p className="text-gray-500 text-sm mb-6">Summary across all simulation campaigns</p>

      {campaigns.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No campaign data yet.</div>
      ) : (
        <>
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Campaign Comparison</h2>
            <div className="space-y-4">
              {campaigns.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <Link to={`/results/${c.id}`} className="text-white hover:text-accent">
                      {c.name}
                    </Link>
                    <span className="font-mono text-warning">{c.stats.click_rate}% click rate</span>
                  </div>
                  <div className="h-5 bg-border rounded overflow-hidden">
                    <div
                      className="h-full bg-warning rounded"
                      style={{ width: `${(c.stats.click_rate / maxClickRate) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-border">
                    <th className="text-left py-2 px-2">Campaign</th>
                    <th className="text-left py-2 px-2">Template</th>
                    <th className="text-center py-2 px-2">Targets</th>
                    <th className="text-center py-2 px-2">Open Rate</th>
                    <th className="text-center py-2 px-2">Click Rate</th>
                    <th className="text-center py-2 px-2">Submission Rate</th>
                    <th className="text-center py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-border/20">
                      <td className="py-3 px-2">
                        <Link to={`/results/${c.id}`} className="text-white hover:text-accent font-medium">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3 px-2 capitalize text-gray-400">{c.template}</td>
                      <td className="py-3 px-2 text-center font-mono">{c.stats.total_targets}</td>
                      <td className="py-3 px-2 text-center font-mono text-blue-400">{c.stats.open_rate}%</td>
                      <td className="py-3 px-2 text-center font-mono text-warning">{c.stats.click_rate}%</td>
                      <td className="py-3 px-2 text-center font-mono text-accent">{c.stats.submission_rate}%</td>
                      <td className="py-3 px-2 text-center capitalize text-gray-400">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Results() {
  const { campaign_id } = useParams();
  if (campaign_id) return <SingleCampaignResults campaignId={campaign_id} />;
  return <AllCampaignsResults />;
}
