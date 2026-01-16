import mongoose, { Document, Schema } from 'mongoose';
import type { RoutineId } from '../types';

export interface IDailyRoutine {
  date: Date;
  routineId: RoutineId;
  completed: boolean;
  completedAt?: Date;
}

export interface IPlan extends Document {
  userId: mongoose.Types.ObjectId;
  scanId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  dailyRoutines: IDailyRoutine[];
  bonusRoutines: RoutineId[];
  createdAt: Date;
}

const DailyRoutineSchema = new Schema({
  date: { type: Date, required: true },
  routineId: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const PlanSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanId: {
      type: Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    dailyRoutines: [DailyRoutineSchema],
    bonusRoutines: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Index for finding active plans
PlanSchema.index({ userId: 1, startDate: -1 });
PlanSchema.index({ userId: 1, endDate: 1 });

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
