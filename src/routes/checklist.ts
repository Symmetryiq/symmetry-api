import { getAuth, requireAuth } from '@clerk/express';
import express from 'express';
import { Checklist } from '../models/Checklist';
import { CHECKLIST_TASKS } from '../utils/constants';

const router = express.Router();

// POST /api/checklist - Create or update checklist for a date
router.post('/', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { date, tasks } = req.body;

    if (!date || !tasks) {
      return res.status(400).json({ error: 'Missing date or tasks' });
    }

    const checklist = await Checklist.findOneAndUpdate(
      { userId, date },
      { tasks },
      { upsert: true, new: true },
    );

    res.json({
      message: 'Checklist saved successfully',
      checklist,
    });
  } catch (error: any) {
    console.error('Error saving checklist:', error);
    res.status(500).json({ error: 'Failed to save checklist' });
  }
});

// GET /api/checklist/:date - Get checklist for a specific date
router.get('/:date', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { date } = req.params;

    let checklist = await Checklist.findOne({ userId, date });

    if (!checklist) {
      return res.json({
        checklist: {
          date,
          tasks: CHECKLIST_TASKS.map((task) => ({
            ...task,
            completed: false,
          })),
        },
      });
    }

    res.json({ checklist });
  } catch (error: any) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

export default router;
