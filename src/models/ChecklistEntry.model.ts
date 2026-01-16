import mongoose, { Document, Schema } from 'mongoose';

export interface IChecklistTask {
  title: string;
  description: string;
  completed: boolean;
}

export interface IChecklistEntry extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  tasks: IChecklistTask[];
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistTaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const ChecklistEntrySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    tasks: [ChecklistTaskSchema],
  },
  {
    timestamps: true,
  }
);

// Each user can have only one checklist per date
ChecklistEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export const ChecklistEntry = mongoose.model<IChecklistEntry>(
  'ChecklistEntry',
  ChecklistEntrySchema
);
