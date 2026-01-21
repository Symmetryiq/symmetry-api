import { Document, model, Schema } from 'mongoose';

export interface ITask {
  title: string;
  description: string;
  completed: boolean;
}

export interface IChecklist extends Document {
  userId: String;
  date: string;
  tasks: ITask[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

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
    tasks: [TaskSchema],
  },
  {
    timestamps: true,
  },
);

ChecklistSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Checklist = model<IChecklist>('Checklist', ChecklistSchema);
