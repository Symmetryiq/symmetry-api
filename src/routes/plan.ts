import { getAuth, requireAuth } from '@clerk/express';
import express from 'express';
import { Plan } from '../models/Plan';
import { generatePlanFromScan, getCurrentPlan } from '../services/plan.service';

const router = express.Router();

// POST /api/plans/generate - Generate a new plan from a scan
router.post('/generate', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { scanId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!scanId) {
      return res.status(400).json({ error: 'Missing scanId' });
    }

    const plan = await generatePlanFromScan(userId, scanId);

    res.status(201).json({
      message: 'Plan generated successfully',
      plan,
    });
  } catch (error: any) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: error.message || 'Failed to generate plan' });
  }
});

// GET /api/plans/current - Get current active plan
router.get('/current', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const plan = await getCurrentPlan(userId);

    if (!plan) {
      return res.status(404).json({ error: 'No active plan found' });
    }

    res.json({ plan });
  } catch (error: any) {
    console.error('Error fetching current plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// GET /api/plans/:planId/routines/:date - Get routines for a specific date
router.get('/:planId/routines/:date', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { planId, date } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const plan = await Plan.findOne({ _id: planId, userId });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Parse the date (YYYY-MM-DD)
    const targetDate = new Date(date as string);
    targetDate.setHours(0, 0, 0, 0);

    // Find routine for this date
    const dailyRoutine = plan.dailyRoutines.find((dr) => {
      const drDate = new Date(dr.date);
      drDate.setHours(0, 0, 0, 0);
      return drDate.getTime() === targetDate.getTime();
    });

    res.json({
      dailyRoutine: dailyRoutine || null,
      bonusRoutines: plan.bonusRoutines,
    });
  } catch (error: any) {
    console.error('Error fetching routines:', error);
    res.status(500).json({ error: 'Failed to fetch routines' });
  }
});

// PATCH /api/plans/:planId/routines/:routineId/complete - Mark routine as completed
router.patch(
  '/:planId/routines/:routineId/complete',
  requireAuth(),
  async (req, res) => {
    try {
      const { userId } = getAuth(req);
      const { planId, routineId } = req.params;
      const { date } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const plan = await Plan.findOne({ _id: planId, userId });

      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      let routine;

      if (date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        routine = plan.dailyRoutines.find((dr) => {
          const drDate = new Date(dr.date);
          drDate.setHours(0, 0, 0, 0);
          return (
            dr.routineId === routineId &&
            drDate.getTime() === targetDate.getTime()
          );
        });
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        routine = plan.dailyRoutines.find((dr) => {
          const drDate = new Date(dr.date);
          drDate.setHours(0, 0, 0, 0);
          return (
            dr.routineId === routineId && drDate.getTime() === today.getTime()
          );
        });

        if (!routine) {
          routine = plan.dailyRoutines.find(
            (dr) => dr.routineId === routineId && !dr.completed,
          );
        }

        if (!routine) {
          routine = plan.dailyRoutines.find((dr) => dr.routineId === routineId);
        }
      }

      if (!routine) {
        return res
          .status(404)
          .json({ error: 'Routine not found in plan for this date' });
      }

      routine.completed = true;
      routine.completedAt = new Date();

      await plan.save();

      res.json({
        message: 'Routine marked as completed',
        routine,
      });
    } catch (error: any) {
      console.error('Error completing routine:', error);
      res.status(500).json({ error: 'Failed to complete routine' });
    }
  },
);

export default router;
