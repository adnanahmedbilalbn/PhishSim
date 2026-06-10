import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDb, resetDb } from '../utils/db.js';
import { sendCampaignEmail } from '../utils/emailSender.js';

const router = Router();

router.get('/api/campaigns', async (req, res) => {
  try {
    const db = await getDb();
    const campaigns = db.data.campaigns.map((campaign) => {
      const targets = db.data.targets.filter((t) => t.campaign_id === campaign.id);
      return {
        ...campaign,
        target_count: targets.length,
        sent_count: targets.filter((t) => t.sent).length,
        opened_count: targets.filter((t) => t.opened).length,
        clicked_count: targets.filter((t) => t.clicked).length,
        submitted_count: targets.filter((t) => t.submitted).length,
      };
    });
    res.json(campaigns);
  } catch (err) {
    console.error('Get campaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.post('/api/campaigns', async (req, res) => {
  try {
    const { name, template, targets: targetEmails } = req.body;

    if (!name || !template || !targetEmails?.length) {
      return res.status(400).json({ error: 'Name, template, and targets are required' });
    }

    const db = await getDb();
    const campaignId = nanoid();
    const now = new Date().toISOString();

    const campaign = {
      id: campaignId,
      name,
      template,
      status: 'ready',
      created_at: now,
      launched_at: null,
    };

    const targets = targetEmails.map((email) => ({
      id: nanoid(),
      campaign_id: campaignId,
      email: email.trim().toLowerCase(),
      sent: false,
      opened: false,
      clicked: false,
      submitted: false,
      sent_time: null,
      open_time: null,
      click_time: null,
      submit_time: null,
    }));

    db.data.campaigns.push(campaign);
    db.data.targets.push(...targets);
    await db.write();

    res.status(201).json({ ...campaign, targets });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.post('/api/campaigns/:id/launch', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const campaign = db.data.campaigns.find((c) => c.id === id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const targets = db.data.targets.filter((t) => t.campaign_id === id);
    const now = new Date().toISOString();
    const previewUrls = [];

    for (const target of targets) {
      const result = await sendCampaignEmail(target, campaign);
      previewUrls.push({ email: target.email, preview_url: result.preview_url });
      target.sent = true;
      target.sent_time = now;
    }

    campaign.status = 'active';
    campaign.launched_at = now;
    await db.write();

    res.json({
      success: true,
      sent_count: targets.length,
      preview_urls: previewUrls,
    });
  } catch (err) {
    console.error('Launch campaign error:', err);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
});

router.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    db.data.campaigns = db.data.campaigns.filter((c) => c.id !== id);
    db.data.targets = db.data.targets.filter((t) => t.campaign_id !== id);
    db.data.events = db.data.events.filter((e) => e.campaign_id !== id);
    await db.write();

    res.json({ success: true });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

router.post('/api/reset', async (req, res) => {
  try {
    await resetDb();
    res.json({ success: true, message: 'All data has been reset' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

router.get('/api/credentials', async (req, res) => {
  try {
    const db = await getDb();
    const PLACEHOLDERS = new Set(['TARGET_ID_PLACEHOLDER', 'CAMPAIGN_ID_PLACEHOLDER']);

    const credentials = [...db.data.events]
      .filter(
        (e) =>
          e.event === 'credentials_submitted' &&
          !PLACEHOLDERS.has(e.target_id) &&
          !PLACEHOLDERS.has(e.campaign_id)
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map((event) => {
        const target = db.data.targets.find((t) => t.id === event.target_id);
        const campaign = db.data.campaigns.find((c) => c.id === event.campaign_id);
        return {
          id: event.id,
          timestamp: event.timestamp,
          campaign_id: event.campaign_id,
          campaign_name: campaign?.name || 'Unknown',
          template: campaign?.template || 'unknown',
          recipient_email: target?.email || null,
          student_id: event.student_id || target?.submitted_student_id || null,
          submitted_email: event.email || target?.submitted_email || null,
          password: event.password || target?.submitted_password || null,
        };
      });

    res.json(credentials);
  } catch (err) {
    console.error('Get credentials error:', err);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

router.get('/api/events', async (req, res) => {
  try {
    const db = await getDb();
    const limit = parseInt(req.query.limit) || 20;

    const PLACEHOLDERS = new Set(['TARGET_ID_PLACEHOLDER', 'CAMPAIGN_ID_PLACEHOLDER']);

    const events = [...db.data.events]
      .filter((e) => !PLACEHOLDERS.has(e.target_id) && !PLACEHOLDERS.has(e.campaign_id))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
      .map((event) => {
        const target = db.data.targets.find((t) => t.id === event.target_id);
        const recipientEmail = target?.email || null;
        let display_id = recipientEmail || 'unknown';
        let submitted_value = null;

        if (event.event === 'credentials_submitted') {
          submitted_value = event.student_id || event.email || null;
          display_id = event.student_id
            ? `ID: ${event.student_id}`
            : event.email || recipientEmail || 'unknown';
        }

        return {
          ...event,
          recipient_email: recipientEmail,
          email: recipientEmail || event.email || null,
          student_id: event.student_id || null,
          submitted_email: event.email || null,
          submitted_password: event.password || null,
          submitted_value,
          display_id,
        };
      });

    res.json(events);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;
