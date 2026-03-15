import mongoose, { Document, Schema, Types } from 'mongoose';
import type { RoutineId } from '../types';

export interface IRoutineLog extends Document {
  userId: string;
  planId: Types.ObjectId;
  routineId: RoutineId;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
  completedAt: Date;
  durationSeconds?: number;
}

const RoutineLogSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    planId: {
      type: Types.ObjectId,
      ref: 'Plan',
      required: true,
      index: true,
    },
    routineId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'skipped'],
      default: 'completed',
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    durationSeconds: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// A user should only log a routine once per day
RoutineLogSchema.index({ userId: 1, date: 1, routineId: 1 }, { unique: true });

export const RoutineLog = mongoose.model<IRoutineLog>('RoutineLog', RoutineLogSchema);
