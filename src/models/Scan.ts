import mongoose, { Document, Schema } from 'mongoose';
import { type Scores } from '../types';

type Landmark = {
  x: number;
  y: number;
  z: number;
};

export interface IScan extends Document {
  userId: string;
  landmarks: Landmark[];
  scores: Scores;
  scanDate: Date;
  createdAt: Date;
}

const ScanSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    landmarks: {
      type: [
        {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          z: { type: Number, required: true },
        },
      ],
      required: true,
    },
    scores: {
      overallSymmetry: { type: Number, required: true },
      eyeAlignment: { type: Number, required: true },
      noseCentering: { type: Number, required: true },
      facialPuffiness: { type: Number, required: true },
      skinClarity: { type: Number, required: true },
      chinAlignment: { type: Number, required: true },
      facialThirds: { type: Number, required: true },
      jawlineSymmetry: { type: Number, required: true },
      cheekboneBalance: { type: Number, required: true },
      eyebrowSymmetry: { type: Number, required: true },
    },
    scanDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

ScanSchema.index({ userId: 1, scanDate: -1 }, { unique: true });

export const Scan = mongoose.model<IScan>('Scan', ScanSchema);
