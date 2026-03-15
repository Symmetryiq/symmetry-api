import mongoose from 'mongoose';
import { Plan } from '../models/Plan';
import { Scan } from '../models/Scan';
import { type RoutineId, type Scores } from '../types';
import { type FactorKey, GOALS, ROUTINE_FACTOR_MAP, type RoutineMapping } from '../utils/constants';

interface CandidateRoutine {
  routineId: RoutineId;
  factor: FactorKey;
  priority: number;
}

const calculateDistance = (factor: FactorKey, score: number, goal: number): number => {
  return factor === 'facialPuffiness' ? Math.max(0, score - goal) : Math.max(0, goal - score);
};

const selectWeightedRoutines = (scores: Scores): { primary: RoutineId[], supporting: RoutineId[], bonus: RoutineId[] } => {
  const candidates: CandidateRoutine[] = [];

  for (const [factorKey, goal] of Object.entries(GOALS)) {
    const factor = factorKey as FactorKey;
    const score = scores[factor as keyof Scores];
    if (score === undefined) continue;

    const distance = calculateDistance(factor, score as number, goal);
    if (distance > 0) {
      const mappings: RoutineMapping[] = ROUTINE_FACTOR_MAP[factor];
      for (const mapping of mappings) {
        // Deterministic rotational variance based on distance
        const priority = distance * mapping.impact;
        candidates.push({ routineId: mapping.routineId, factor, priority });
      }
    }
  }

  // Sort by priority description
  candidates.sort((a, b) => b.priority - a.priority);

  const uniqueRoutines: RoutineId[] = [];
  const seen = new Set<RoutineId>();

  for (const candidate of candidates) {
    if (!seen.has(candidate.routineId)) {
      uniqueRoutines.push(candidate.routineId);
      seen.add(candidate.routineId);
    }
  }

  // Split into components for the 28 day schedule
  // Primary = top 2 routines addressing the worst factors
  // Supporting = next 4 routines
  // Bonus = anything else
  const primary = uniqueRoutines.slice(0, 2);
  const supporting = uniqueRoutines.slice(2, 6);
  const bonus = uniqueRoutines.slice(6);
  
  // Flash fallbacks if not enough routines
  if (primary.length === 0) primary.push('mewing-basics', 'correct-swallowing');
  if (supporting.length === 0) supporting.push('jaw-massage-1', 'facial-yoga-1');

  return { primary, supporting, bonus };
};

export const generatePlanFromScan = async (userId: string, scanId: string): Promise<typeof Plan.prototype> => {
  const scan = await Scan.findById(scanId);
  if (!scan) throw new Error('Scan not found');
  if (scan.userId !== userId) throw new Error('Unauthorized');

  const { primary, supporting, bonus } = selectWeightedRoutines(scan.scores as unknown as Scores);

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 27); // 28 days total

  const schedule = new Map<string, string[]>();

  // Generate 28-day schedule
  for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

    const dayOfWeek = (dayOffset % 7) + 1; // 1 to 7

    // Day 7 is always rest
    if (dayOfWeek === 7) {
      schedule.set(dateStr, []);
      continue;
    }

    const dailyTasks: string[] = [];
    
    // Alternate primary routine every other active day
    dailyTasks.push(primary[dayOffset % primary.length] || primary[0]);
    
    // Add 1 supporting routine in week 1-2, 2 in week 3-4
    const supportCount = dayOffset >= 14 ? 2 : 1;
    for (let i = 0; i < supportCount; i++) {
        // rotate through supporting list
        const suppItem = supporting[(dayOffset + i) % supporting.length];
        if (suppItem && !dailyTasks.includes(suppItem)) {
            dailyTasks.push(suppItem);
        }
    }

    schedule.set(dateStr, dailyTasks);
  }

  // Mark older active plans as replaced
  await Plan.updateMany({ userId, status: 'active' }, { $set: { status: 'replaced' } });

  const plan = await Plan.create({
    userId,
    scanId,
    status: 'active',
    startDate,
    endDate,
    durationDays: 28,
    schedule,
    bonusRoutines: bonus,
  });

  return plan;
};

export const getCurrentPlan = async (userId: string): Promise<typeof Plan.prototype | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Plan.findOne({
    userId,
    status: 'active',
    startDate: { $lte: today },
    endDate: { $gte: today },
  }).sort({ startDate: -1 });
};
