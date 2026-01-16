import express, { Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Scan } from '../models/Scan.model';
import { AuthRequest } from '../types';

const router = express.Router();

// POST /api/scans - Create a new scan
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { landmarks, scores } = req.body;
    const userId = (req as any).userId;

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
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;

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
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

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
