import mongoose, { Document, Schema, Types } from 'mongoose';
import type { RoutineId } from '../types';

export interface IPlan extends Document {
  userId: string;
  scanId: Types.ObjectId;
  status: 'active' | 'completed' | 'replaced';
  startDate: Date;
  endDate: Date;
  durationDays: number;
  
  // The predefined schedule (what the user SHOULD do on which day)
  // E.g., Record<"day-1", ["routine-id-1", "routine-id-2"]>
  schedule: Map<string, string[]>;
  
  // Any bonus routines assigned to this plan pool
  bonusRoutines: RoutineId[];
  
  createdAt: Date;
}

const PlanSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    scanId: {
      type: Types.ObjectId,
      ref: 'Scan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'replaced'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    durationDays: {
      type: Number,
      default: 28,
      required: true,
    },
    schedule: {
      type: Map,
      of: [String],
      required: true,
    },
    bonusRoutines: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

PlanSchema.index({ userId: 1, status: 1 });
PlanSchema.index({ userId: 1, startDate: -1 });

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
