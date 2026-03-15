import { getAuth, requireAuth } from '@clerk/express';
import express from 'express';
import { z } from 'zod';
import { Scan } from '../models/Scan';
import { asyncHandler } from '../middleware/async-handler';
import { validate } from '../middleware/validate';

const router = express.Router();

const createScanSchema = z.object({
  body: z.object({
    scores: z.object({
      overallSymmetry: z.number().min(0).max(100),
      eyeAlignment: z.number().min(0).max(100),
      noseCentering: z.number().min(0).max(100),
      facialPuffiness: z.number().min(0).max(100),
      skinClarity: z.number().min(0).max(100),
      chinAlignment: z.number().min(0).max(100),
      facialThirds: z.number().min(0).max(100),
      jawlineSymmetry: z.number().min(0).max(100),
      cheekboneBalance: z.number().min(0).max(100),
      eyebrowSymmetry: z.number().min(0).max(100),
    }),
    keyRatios: z.record(z.string(), z.number()).optional(),
  }),
});

// POST /api/scans - Create a new scan
router.post(
  '/',
  requireAuth(),
  validate(createScanSchema),
  asyncHandler(async (req, res) => {
    const { scores, keyRatios } = req.body;
    const { userId } = getAuth(req);

    const scan = await Scan.create({
      userId,
      scores,
      keyRatios,
      scanDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Scan saved successfully',
      scan: {
        id: scan._id,
        scores: scan.scores,
        scanDate: scan.scanDate,
      },
    });
  })
);

// GET /api/scans - Get user's scan history
router.get(
  '/',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    const scans = await Scan.find({ userId })
      .sort({ scanDate: -1 })
      .select('scores scanDate')
      .limit(30);

    res.json({ success: true, scans });
  })
);

// GET /api/scans/:id - Get specific scan
router.get(
  '/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { id } = req.params;

    const scan = await Scan.findOne({ _id: id, userId });

    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan not found' });
    }

    res.json({ success: true, scan });
  })
);

export default router;
