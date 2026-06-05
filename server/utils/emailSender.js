import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '..', '..', 'email-templates');

const TEMPLATE_CONFIG = {
  gmail: {
    file: 'gmail-template.html',
    subject: 'Security Alert: Unusual sign-in attempt detected',
    from: '"Google Security Team" <security@google-alerts.ethereal.test>',
  },
  university: {
    file: 'university-template.html',
    subject: 'Action Required: Student Portal Access Expiring',
    from: '"IT Support — University" <it-support@university.ethereal.test>',
  },
  corporate: {
    file: 'corporate-template.html',
    subject: 'Mandatory: Multi-Factor Authentication Setup Required',
    from: '"IT Security Department" <security@corp-intranet.ethereal.test>',
  },
};

async function getTransporter() {
  const db = await getDb();

  if (!db.data.ethereal) {
    const testAccount = await nodemailer.createTestAccount();
    db.data.ethereal = {
      user: testAccount.user,
      pass: testAccount.pass,
      smtp: testAccount.smtp,
    };
    await db.write();
    console.log('✉️  Ethereal test account created:', testAccount.user);
  }

  const { user, pass, smtp } = db.data.ethereal;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user, pass },
  });
}

function extractFirstName(email) {
  const local = email.split('@')[0] || 'User';
  const name = local.split(/[._-]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function replacePlaceholders(html, target, campaignId) {
  const trackingPixelUrl = `http://localhost:4000/track/pixel/${target.id}/${campaignId}`;
  const phishingLink = `http://localhost:4000/track?event=link_clicked&target_id=${target.id}&campaign_id=${campaignId}`;

  return html
    .replace(/\{\{TARGET_EMAIL\}\}/g, target.email)
    .replace(/\{\{FIRST_NAME\}\}/g, extractFirstName(target.email))
    .replace(/\{\{TRACKING_PIXEL_URL\}\}/g, trackingPixelUrl)
    .replace(/\{\{PHISHING_LINK\}\}/g, phishingLink);
}

export async function sendCampaignEmail(target, campaign) {
  const config = TEMPLATE_CONFIG[campaign.template];
  if (!config) {
    throw new Error(`Unknown template: ${campaign.template}`);
  }

  const templatePath = path.join(templatesDir, config.file);
  let html = await fs.readFile(templatePath, 'utf-8');
  html = replacePlaceholders(html, target, campaign.id);

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: config.from,
    to: target.email,
    subject: config.subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📧 Email sent to ${target.email}`);
  console.log(`   Preview URL: ${previewUrl}`);

  return { success: true, preview_url: previewUrl };
}
