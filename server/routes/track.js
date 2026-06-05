import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDb } from '../utils/db.js';
import { sendPixel } from '../utils/trackingPixel.js';

const router = Router();

const PLACEHOLDER_IDS = new Set(['TARGET_ID_PLACEHOLDER', 'CAMPAIGN_ID_PLACEHOLDER']);

function isValidTrackingId(id) {
  return id && !PLACEHOLDER_IDS.has(id);
}

async function logEvent(db, { target_id, campaign_id, event }) {
  if (!isValidTrackingId(target_id) || !isValidTrackingId(campaign_id)) {
    return null;
  }
  const timestamp = new Date().toISOString();
  const eventRecord = {
    id: nanoid(),
    target_id,
    campaign_id,
    event,
    timestamp,
  };
  db.data.events.push(eventRecord);

  const target = db.data.targets.find(
    (t) => t.id === target_id && t.campaign_id === campaign_id
  );

  if (target) {
    if (event === 'email_opened' && !target.opened) {
      target.opened = true;
      target.open_time = timestamp;
    } else if (event === 'page_loaded' && !target.opened) {
      target.opened = true;
      target.open_time = timestamp;
    } else if (event === 'link_clicked' && !target.clicked) {
      target.clicked = true;
      target.click_time = timestamp;
    }
  }

  await db.write();
  return eventRecord;
}

router.get('/track/pixel/:target_id/:campaign_id', async (req, res) => {
  try {
    const { target_id, campaign_id } = req.params;
    const db = await getDb();
    await logEvent(db, { target_id, campaign_id, event: 'email_opened' });
    sendPixel(res);
  } catch (err) {
    console.error('Pixel tracking error:', err);
    sendPixel(res);
  }
});

router.get('/track', async (req, res) => {
  try {
    const { event, target_id, campaign_id } = req.query;

    if (!event || !target_id || !campaign_id) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const db = await getDb();
    const campaign = db.data.campaigns.find((c) => c.id === campaign_id);
    const template = campaign?.template || 'gmail';

    if (event === 'email_opened') {
      await logEvent(db, { target_id, campaign_id, event: 'email_opened' });
      return sendPixel(res);
    }

    if (event === 'page_loaded') {
      await logEvent(db, { target_id, campaign_id, event: 'page_loaded' });
      return sendPixel(res);
    }

    if (event === 'link_clicked') {
      await logEvent(db, { target_id, campaign_id, event: 'link_clicked' });
      return res.redirect(`/pages/${template}.html?target_id=${target_id}&campaign_id=${campaign_id}`);
    }

    res.status(400).json({ error: 'Invalid event type' });
  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

export default router;
