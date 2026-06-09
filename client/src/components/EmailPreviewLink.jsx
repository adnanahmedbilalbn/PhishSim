import { Mail, ExternalLink } from 'lucide-react';

export default function EmailPreviewLink({ url, label = 'Preview' }) {
  if (!url) {
    return <span className="text-gray-600 text-xs">—</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="email-preview-link"
      title="Open sent email on Ethereal"
    >
      <Mail className="w-3 h-3 shrink-0" />
      <span>{label}</span>
      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-50" />
    </a>
  );
}
