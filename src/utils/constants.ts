import type { RoutineId } from '../types';

export const GOALS = {
  overallSymmetry: 85,
  eyeAlignment: 85,
  noseCentering: 80,
  facialPuffiness: 30, // Lower is better
  skinClarity: 70,
  chinAlignment: 80,
  facialThirds: 70,
  jawlineSymmetry: 80,
  cheekboneBalance: 75,
  eyebrowSymmetry: 80,
} as const;

export type FactorKey = keyof typeof GOALS;

/**
 * Represents a routine mapped to a factor with an impact score.
 * Higher impact = more effective for improving that factor.
 */
export interface RoutineMapping {
  routineId: RoutineId;
  impact: number; // 1-10 scale
}

/**
 * Maps each facial factor to routines that can improve it.
 * Each routine has an impact score indicating effectiveness.
 */
export const ROUTINE_FACTOR_MAP: Record<FactorKey, RoutineMapping[]> = {
  overallSymmetry: [
    { routineId: 'hard-mewing-hold', impact: 9 },
    { routineId: 'chin-tucks', impact: 8 },
    { routineId: 'neck-curls-extensions', impact: 7 },
  ],
  facialThirds: [
    { routineId: 'hard-mewing-hold', impact: 8 },
    { routineId: 'chin-tucks', impact: 7 },
  ],
  eyeAlignment: [
    { routineId: 'orb-oculi-training', impact: 9 },
    { routineId: 'scm-neck-stretch', impact: 6 },
  ],
  eyebrowSymmetry: [{ routineId: 'orb-oculi-training', impact: 8 }],
  noseCentering: [
    { routineId: 'nose-centering-routine', impact: 9 },
    { routineId: 'scm-neck-stretch', impact: 5 },
  ],
  facialPuffiness: [
    { routineId: 'gua-sha-jawline', impact: 9 },
    { routineId: 'mandibular-fascia-release', impact: 7 },
  ],
  skinClarity: [{ routineId: 'gua-sha-jawline', impact: 7 }],
  jawlineSymmetry: [
    { routineId: 'masseter-balance-training', impact: 9 },
    { routineId: 'mandibular-fascia-release', impact: 7 },
  ],
  cheekboneBalance: [
    { routineId: 'cheekbone-lift-massage', impact: 9 },
    { routineId: 'gua-sha-jawline', impact: 6 },
  ],
  chinAlignment: [
    { routineId: 'chin-tucks', impact: 9 },
    { routineId: 'masseter-balance-training', impact: 7 },
  ],
};

export const CHECKLIST_TASKS = [
  {
    title: 'Tongue Posture',
    description: 'Hold correct mewing position for 10 minutes.',
  },
  {
    title: 'Chewing Balance',
    description: 'Chew gum for 5 minutes on your weaker side.',
  },
  {
    title: 'Symmetry Routine',
    description: "Complete today's 5-10 minute guided exercises.",
  },
  {
    title: 'Face Scan',
    description: "Track facial changes with today's scan.",
  },
  {
    title: 'Sleep Alignment',
    description: 'Prepare for back sleeping to improve facial symmetry.',
  },
];
