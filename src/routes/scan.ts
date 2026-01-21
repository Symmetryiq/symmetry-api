import { getAuth, requireAuth } from '@clerk/express';
import express from 'express';
import { Scan } from '../models/Scan';

const router = express.Router();

// POST /api/scans - Create a new scan
router.post('/', requireAuth(), async (req, res) => {
  try {
    const { landmarks, scores } = req.body;
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!landmarks || !scores) {
      return res.status(400).json({ error: 'Missing landmarks or scores' });
    }

    const scan = await Scan.create({
      userId,
      landmarks,
      scores,
      scanDate: new Date(),
    });

    res.status(201).json({
      message: 'Scan saved successfully',
      scan: {
        id: scan._id,
        scores: scan.scores,
        scanDate: scan.scanDate,
      },
    });
  } catch (error: any) {
    console.error('Error saving scan:', error);
    res.status(500).json({ error: 'Failed to save scan' });
  }
});

// GET /api/scans - Get user's scan history
router.get('/', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const scans = await Scan.find({ userId })
      .sort({ scanDate: -1 })
      .select('scores scanDate')
      .limit(30); // Last 30 scans

    res.json({ scans });
  } catch (error: any) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// GET /api/scans/:id - Get specific scan
router.get('/:id', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const scan = await Scan.findOne({ _id: id, userId });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({ scan });
  } catch (error: any) {
    console.error('Error fetching scan:', error);
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

export default router;
