import { Request } from 'express';

export type RoutineId =
  | 'hard-mewing-hold'
  | 'masseter-balance-training'
  | 'neck-curls-extensions'
  | 'chin-tucks'
  | 'wall-posture-reset'
  | 'scm-neck-stretch'
  | 'mandibular-fascia-release'
  | 'gua-sha-jawline'
  | 'cheekbone-lift-massage'
  | 'smile-symmetry-routine'
  | 'orb-oculi-training'
  | 'wall-posture-training'
  | 'neck-stretch'
  | 'nose-centering-routine';

export interface Scores {
  overallSymmetry: number;
  eyeAlignment: number;
  noseCentering: number;
  facialPuffiness: number;
  skinClarity: number;
  chinAlignment: number;
  facialThirds: number;
  jawlineSymmetry: number;
  cheekboneBalance: number;
  eyebrowSymmetry: number;
}

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
  userId?: any;
}
