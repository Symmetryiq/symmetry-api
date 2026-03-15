import { getAuth, requireAuth } from '@clerk/express';
import express from 'express';
import { z } from 'zod';
import { Checklist } from '../models/Checklist';
import { asyncHandler } from '../middleware/async-handler';
import { validate } from '../middleware/validate';

const router = express.Router();

const checklistSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    completedTaskIds: z.array(z.string()),
  }),
});

// POST /api/checklist - Create or update checklist tasks for a date
router.post(
  '/',
  requireAuth(),
  validate(checklistSchema),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { date, completedTaskIds } = req.body;

    const checklist = await Checklist.findOneAndUpdate(
      { userId, date },
      { completedTaskIds },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Checklist saved successfully',
      checklist,
    });
  })
);

// GET /api/checklist/:date - Get completed tasks for a specific date
router.get(
  '/:date',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { date } = req.params;

    const checklist = await Checklist.findOne({ userId, date });

    res.json({
      success: true,
      checklist: {
        date,
        completedTaskIds: checklist?.completedTaskIds || [],
      },
    });
  })
);

export default router;
