import { Document, model, Schema } from 'mongoose';

export interface IChecklist extends Document {
  userId: string;
  date: string; // YYYY-MM-DD format
  completedTaskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    completedTaskIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

ChecklistSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Checklist = model<IChecklist>('Checklist', ChecklistSchema);
