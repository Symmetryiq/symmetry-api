import express, { type Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { ChecklistEntry } from '../models/ChecklistEntry.model';
import type { AuthRequest } from '../types';
import { CHECKLIST_TASKS } from '../utils/constants';

const router = express.Router();

// POST /api/checklist - Create or update checklist for a date
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { date, tasks } = req.body; // date should be YYYY-MM-DD

    if (!date || !tasks) {
      return res.status(400).json({ error: 'Missing date or tasks' });
    }

    // Upsert checklist entry
    const checklist = await ChecklistEntry.findOneAndUpdate(
      { userId, date },
      { tasks },
      { upsert: true, new: true }
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
router.get('/:date', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { date } = req.params;

    let checklist = await ChecklistEntry.findOne({ userId, date });

    // If no checklist exists, return default tasks
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
