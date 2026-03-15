import { getAuth, requireAuth } from '@clerk/express';
import express from 'express';
import { z } from 'zod';
import { Plan } from '../models/Plan';
import { RoutineLog } from '../models/RoutineLog';
import { generatePlanFromScan, getCurrentPlan } from '../services/plan.service';
import { asyncHandler } from '../middleware/async-handler';
import { validate } from '../middleware/validate';
import mongoose from 'mongoose';

const router = express.Router();

const generatePlanSchema = z.object({
  body: z.object({
    scanId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid scanId format',
    }),
  }),
});

// POST /api/plans/generate - Generate a new plan from a scan
router.post(
  '/generate',
  requireAuth(),
  validate(generatePlanSchema),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { scanId } = req.body;

    const plan = await generatePlanFromScan(userId, scanId);

    res.status(201).json({
      success: true,
      message: 'Plan generated successfully',
      plan,
    });
  })
);

// GET /api/plans/current - Get current active plan
router.get(
  '/current',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    const plan = await getCurrentPlan(userId);

    if (!plan) {
      return res.status(404).json({ success: false, error: 'No active plan found' });
    }

    res.json({ success: true, plan });
  })
);

// GET /api/plans/:planId/routines/:date - Get routines and completion status for a specific date
router.get(
  '/:planId/routines/:date',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { planId, date } = req.params;

    const plan = await Plan.findOne({ _id: planId, userId });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Get the assigned routine IDs for this date from the schedule Map
    const assignedRoutines = plan.schedule.get(date) || [];

    // Get completion status from RoutineLog
    const logs = await RoutineLog.find({ userId, planId, date });
    
    // Map completed routine IDs
    const completedRoutineIds = logs.filter(l => l.status === 'completed').map(l => l.routineId);

    res.json({
      success: true,
      routines: {
        assigned: assignedRoutines,
        completed: completedRoutineIds,
        bonus: plan.bonusRoutines,
      }
    });
  })
);

const completeRoutineSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    durationSeconds: z.number().optional()
  }),
});

// PATCH /api/plans/:planId/routines/:routineId/complete - Mark routine as completed via RoutineLog
router.patch(
  '/:planId/routines/:routineId/complete',
  requireAuth(),
  validate(completeRoutineSchema),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { planId, routineId } = req.params;
    const { date, durationSeconds } = req.body;

    const plan = await Plan.findOne({ _id: planId, userId });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Upsert the RoutineLog entry
    const log = await RoutineLog.findOneAndUpdate(
      { userId, planId, routineId, date },
      { 
        $set: { 
          status: 'completed', 
          completedAt: new Date(),
          ...(durationSeconds !== undefined && { durationSeconds }) 
        } 
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Routine marked as completed',
      log,
    });
  })
);

export default router;
