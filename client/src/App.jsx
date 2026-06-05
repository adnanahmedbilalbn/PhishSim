import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  BookOpen,
  Eye,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import NewCampaign from './pages/NewCampaign';
import Results from './pages/Results';
import Awareness from './pages/Awareness';
import PhishingPreview from './pages/PhishingPreview';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns/new', icon: PlusCircle, label: 'New Campaign' },
  { to: '/results', icon: BarChart3, label: 'Results' },
  { to: '/awareness', icon: BookOpen, label: 'Awareness' },
  { to: '/preview', icon: Eye, label: 'Preview' },
];

export default function App() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="w-60 bg-card border-r border-border flex flex-col fixed h-full">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-accent" />
            <span className="text-xl font-bold text-white">PhishSim</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Security Awareness Lab</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-border/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-gray-600 text-center">Educational Use Only</p>
        </div>
      </aside>

      <main className="flex-1 ml-60 p-6 min-h-screen">
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns/new" element={<NewCampaign />} />
          <Route path="/results/:campaign_id" element={<Results />} />
          <Route path="/results" element={<Results />} />
          <Route path="/awareness" element={<Awareness />} />
          <Route path="/preview" element={<PhishingPreview />} />
        </Routes>
      </main>
    </div>
  );
}
