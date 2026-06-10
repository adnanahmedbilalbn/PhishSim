import { Router } from 'express';
import { getDb } from '../utils/db.js';

const router = Router();

function computeStats(targets) {
  const total = targets.length;
  const sent = targets.filter((t) => t.sent).length;
  const opened = targets.filter((t) => t.opened).length;
  const clicked = targets.filter((t) => t.clicked).length;
  const submitted = targets.filter((t) => t.submitted).length;

  const clickTimes = targets
    .filter((t) => t.sent_time && t.click_time)
    .map((t) => (new Date(t.click_time) - new Date(t.sent_time)) / 1000);

  const avgTimeToClick =
    clickTimes.length > 0
      ? Math.round(clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length)
      : 0;

  return {
    total_targets: total,
    sent_count: sent,
    opened_count: opened,
    clicked_count: clicked,
    submitted_count: submitted,
    open_rate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    click_rate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    submission_rate: sent > 0 ? Math.round((submitted / sent) * 100) : 0,
    avg_time_to_click_seconds: avgTimeToClick,
  };
}

function enrichTarget(target, events = []) {
  const timeToOpen =
    target.sent_time && target.open_time
      ? Math.round((new Date(target.open_time) - new Date(target.sent_time)) / 1000)
      : null;

  const timeToClick =
    target.sent_time && target.click_time
      ? Math.round((new Date(target.click_time) - new Date(target.sent_time)) / 1000)
      : null;

  const submitEvent = events.find(
    (e) => e.target_id === target.id && e.event === 'credentials_submitted'
  );

  const submittedStudentId =
    target.submitted_student_id || submitEvent?.student_id || null;
  const submittedEmail =
    target.submitted_email || submitEvent?.email || null;

  const submittedPassword =
    target.submitted_password || submitEvent?.password || null;

  return {
    ...target,
    time_to_open: timeToOpen,
    time_to_click: timeToClick,
    submitted_student_id: submittedStudentId,
    submitted_email: submittedEmail,
    submitted_password: submittedPassword,
    submitted_value: submittedStudentId || submittedEmail || null,
  };
}

// Must be registered BEFORE /api/results/:campaign_id (otherwise "all" is treated as an id)
router.get('/api/results/all', async (req, res) => {
  try {
    const db = await getDb();

    const summaries = db.data.campaigns.map((campaign) => {
      const targets = db.data.targets.filter((t) => t.campaign_id === campaign.id);
      const stats = computeStats(targets);
      return { ...campaign, stats };
    });

    const allTargets = db.data.targets;
    const overallStats = computeStats(allTargets);

    res.json({ campaigns: summaries, overall: overallStats });
  } catch (err) {
    console.error('Get all results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.get('/api/results/:campaign_id', async (req, res) => {
  try {
    const { campaign_id } = req.params;
    const db = await getDb();

    const campaign = db.data.campaigns.find((c) => c.id === campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const events = db.data.events.filter((e) => e.campaign_id === campaign_id);

    const targets = db.data.targets
      .filter((t) => t.campaign_id === campaign_id)
      .map((t) => enrichTarget(t, events));
    const stats = computeStats(targets);

    res.json({ campaign, targets, events, stats });
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
