import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Mail,
  MousePointerClick,
  AlertTriangle,
  Trash2,
  BarChart3,
  RotateCcw,
  MailOpen,
  Link2,
  KeyRound,
} from 'lucide-react';
import { apiFetch } from '../utils/api';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const eventIcons = {
  email_opened: { icon: MailOpen, color: 'text-blue-400' },
  page_loaded: { icon: MailOpen, color: 'text-blue-400' },
  link_clicked: { icon: Link2, color: 'text-warning' },
  credentials_submitted: { icon: KeyRound, color: 'text-accent' },
};

const eventLabels = {
  email_opened: 'opened email',
  page_loaded: 'loaded page',
  link_clicked: 'clicked link',
  credentials_submitted: 'submitted credentials',
};

function eventLabel(event) {
  if (event.event === 'credentials_submitted' && event.student_id) {
    return 'submitted student ID';
  }
  return eventLabels[event.event] || event.event;
}

function eventDisplayId(event) {
  if (event.event === 'credentials_submitted') {
    if (event.student_id) return `ID: ${event.student_id}`;
    if (event.submitted_value) return event.submitted_value;
    if (event.email && !event.recipient_email) return event.email;
  }
  return event.display_id || event.recipient_email || event.email || 'unknown';
}

function StatusBadge({ status }) {
  const classes = {
    ready: 'badge-ready',
    active: 'badge-active',
    completed: 'badge-completed',
  };
  return <span className={classes[status] || 'badge-ready'}>{status}</span>;
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [overall, setOverall] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [campaignsData, resultsData, eventsData] = await Promise.all([
        apiFetch('/api/campaigns'),
        apiFetch('/api/results/all'),
        apiFetch('/api/events?limit=20'),
      ]);
      setCampaigns(campaignsData);
      setOverall(resultsData.overall);
      setEvents(eventsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign and all related data?')) return;
    await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleReset = async () => {
    if (!confirm('Reset ALL data? This cannot be undone.')) return;
    await apiFetch('/api/reset', { method: 'POST' });
    fetchData();
  };

  const stats = [
    {
      label: 'Total Campaigns',
      value: campaigns.length,
      icon: Target,
      trend: `${campaigns.filter((c) => c.status === 'active').length} active`,
    },
    {
      label: 'Total Targets',
      value: overall?.total_targets || 0,
      icon: Mail,
      trend: `${overall?.sent_count || 0} sent`,
    },
    {
      label: 'Overall Click Rate',
      value: `${overall?.click_rate || 0}%`,
      icon: MousePointerClick,
      trend: `${overall?.clicked_count || 0} clicks`,
    },
    {
      label: 'Overall Submission Rate',
      value: `${overall?.submission_rate || 0}%`,
      icon: AlertTriangle,
      trend: `${overall?.submitted_count || 0} submissions`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Live campaign overview — auto-refreshes every 5s</p>
        </div>
        <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4" />
          Reset All Data
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, trend }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <Icon className="w-5 h-5 text-gray-500" />
              <span className="text-xs text-gray-600">{trend}</span>
            </div>
            <span className="text-3xl font-mono font-bold text-white">{value}</span>
            <span className="text-sm text-gray-500 mt-1">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Active Campaigns</h2>
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No campaigns yet.</p>
                <Link to="/campaigns/new" className="text-accent hover:underline text-sm mt-2 inline-block">
                  Create your first campaign →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-border">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Template</th>
                      <th className="text-center py-2 px-2">Targets</th>
                      <th className="text-center py-2 px-2">Sent</th>
                      <th className="text-center py-2 px-2">Opened</th>
                      <th className="text-center py-2 px-2">Clicked</th>
                      <th className="text-center py-2 px-2">Submitted</th>
                      <th className="text-center py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-border/20">
                        <td className="py-3 px-2 font-medium text-white">{c.name}</td>
                        <td className="py-3 px-2 capitalize text-gray-400">{c.template}</td>
                        <td className="py-3 px-2 text-center font-mono">{c.target_count}</td>
                        <td className="py-3 px-2 text-center font-mono">{c.sent_count}</td>
                        <td className="py-3 px-2 text-center font-mono text-blue-400">{c.opened_count}</td>
                        <td className="py-3 px-2 text-center font-mono text-warning">{c.clicked_count}</td>
                        <td className="py-3 px-2 text-center font-mono text-accent">{c.submitted_count}</td>
                        <td className="py-3 px-2 text-center">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/results/${c.id}`}
                              className="text-xs text-accent hover:underline flex items-center gap-1"
                            >
                              <BarChart3 className="w-3 h-3" /> Results
                            </Link>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="text-gray-500 hover:text-accent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="w-80">
          <div className="card h-full">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Events</h2>
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No events yet.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {events.map((event) => {
                  const cfg = eventIcons[event.event] || eventIcons.email_opened;
                  const Icon = cfg.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3 text-sm">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                      <div>
                        <p className="text-gray-300">
                          <span className="font-mono text-xs text-gray-400">{eventDisplayId(event)}</span>
                          <br />
                          {eventLabel(event)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{timeAgo(event.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
