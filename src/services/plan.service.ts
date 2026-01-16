import mongoose from 'mongoose';
import { type IDailyRoutine, Plan } from '../models/Plan.model';
import { Scan } from '../models/Scan.model';
import { type RoutineId, type Scores } from '../types';
import {
  type FactorKey,
  GOALS,
  ROUTINE_FACTOR_MAP,
  type RoutineMapping,
} from '../utils/constants';

/**
 * Represents a candidate routine with its computed priority score.
 */
interface CandidateRoutine {
  routineId: RoutineId;
  factor: FactorKey;
  priority: number;
}

/**
 * Calculate distance from goal for a factor.
 * For facialPuffiness (lower is better), distance = value - goal
 * For others, distance = goal - value
 */
const calculateDistance = (
  factor: FactorKey,
  score: number,
  goal: number
): number => {
  if (factor === 'facialPuffiness') {
    return Math.max(0, score - goal);
  }
  return Math.max(0, goal - score);
};

/**
 * Select routines using weighted priority algorithm.
 * Priority = distanceFromGoal × routineImpact + small variance
 *
 * This ensures:
 * - Factors further from goal get more attention
 * - Higher-impact routines are prioritized
 * - Small variance prevents identical plans on rescan
 */
const selectWeightedRoutines = (
  scores: Scores,
  maxDaily: number = 7
): { daily: RoutineId[]; bonus: RoutineId[] } => {
  const candidates: CandidateRoutine[] = [];

  // 1. Build candidate list from all factors that need improvement
  for (const [factorKey, goal] of Object.entries(GOALS)) {
    const factor = factorKey as FactorKey;
    const score = scores[factor];

    if (score === undefined) continue;

    const distance = calculateDistance(factor, score, goal);

    // Only consider factors that need improvement
    if (distance > 0) {
      const mappings: RoutineMapping[] = ROUTINE_FACTOR_MAP[factor];

      for (const mapping of mappings) {
        // Priority = distance × impact + small variance (0-2)
        const variance = Math.random() * 2;
        const priority = distance * mapping.impact + variance;

        candidates.push({
          routineId: mapping.routineId,
          factor,
          priority,
        });
      }
    }
  }

  // 2. Sort by priority (descending) - highest priority first
  candidates.sort((a, b) => b.priority - a.priority);

  // 3. Deduplicate and collect routines
  const allRoutines: RoutineId[] = [];
  const seenRoutines = new Set<RoutineId>();

  for (const candidate of candidates) {
    if (!seenRoutines.has(candidate.routineId)) {
      allRoutines.push(candidate.routineId);
      seenRoutines.add(candidate.routineId);
    }
  }

  // 4. Split into daily (first N) and bonus (remaining)
  const daily = allRoutines.slice(0, maxDaily);
  const bonus = allRoutines.slice(maxDaily);

  return { daily, bonus };
};

/**
 * Generate a weekly plan from a scan
 */
export const generatePlanFromScan = async (
  userId: mongoose.Types.ObjectId,
  scanId: mongoose.Types.ObjectId
): Promise<typeof Plan.prototype> => {
  // Fetch the scan
  const scan = await Scan.findById(scanId);

  if (!scan) {
    throw new Error('Scan not found');
  }

  if (scan.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  // Select routines using weighted algorithm
  const { daily, bonus } = selectWeightedRoutines(scan.scores);

  // Create 7-day plan starting from today
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // 7 days total

  // Create daily routine entries
  const dailyRoutines: IDailyRoutine[] = daily.map((routineId, index) => {
    const routineDate = new Date(startDate);
    routineDate.setDate(routineDate.getDate() + index);

    return {
      date: routineDate,
      routineId,
      completed: false,
    };
  });

  // Create the plan
  const plan = await Plan.create({
    userId,
    scanId,
    startDate,
    endDate,
    dailyRoutines,
    bonusRoutines: bonus,
  });

  return plan;
};

/**
 * Get the current active plan for a user
 */
export const getCurrentPlan = async (
  userId: mongoose.Types.ObjectId
): Promise<typeof Plan.prototype | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find plan where today is between startDate and endDate
  const plan = await Plan.findOne({
    userId,
    startDate: { $lte: today },
    endDate: { $gte: today },
  }).sort({ startDate: -1 });

  return plan;
};

/**
 * Update an existing plan with new routines based on a new scan.
 * Preserves completion status for completed routines.
 */
export const updatePlanFromScan = async (
  userId: mongoose.Types.ObjectId,
  planId: mongoose.Types.ObjectId,
  scanId: mongoose.Types.ObjectId
): Promise<typeof Plan.prototype> => {
  // Fetch the existing plan
  const existingPlan = await Plan.findOne({ _id: planId, userId });
  if (!existingPlan) {
    throw new Error('Plan not found');
  }

  // Fetch the new scan
  const scan = await Scan.findById(scanId);
  if (!scan) {
    throw new Error('Scan not found');
  }

  if (scan.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  // Get new routines based on updated scores
  const { daily, bonus } = selectWeightedRoutines(scan.scores);

  // Build a map of completed routines by date string
  const completedByDate = new Map<string, boolean>();
  for (const dr of existingPlan.dailyRoutines) {
    if (dr.completed) {
      const dateStr = new Date(dr.date).toDateString();
      completedByDate.set(dateStr, true);
    }
  }

  // Update daily routines, preserving completion status by date
  const updatedRoutines: IDailyRoutine[] = daily.map((routineId, index) => {
    const routineDate = new Date(existingPlan.startDate);
    routineDate.setDate(routineDate.getDate() + index);
    const dateStr = routineDate.toDateString();

    return {
      date: routineDate,
      routineId,
      completed: completedByDate.has(dateStr),
      completedAt: completedByDate.has(dateStr) ? new Date() : undefined,
    };
  });

  // Update the plan
  existingPlan.scanId = scanId;
  existingPlan.dailyRoutines = updatedRoutines;
  existingPlan.bonusRoutines = bonus;
  await existingPlan.save();

  return existingPlan;
};
