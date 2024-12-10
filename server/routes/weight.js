import express from 'express';
import Weight from '../models/weightModel.js';
import mongoose from 'mongoose';

const router = express.Router();
router.get('/', async (req, res) => {
    res.send('WEIGHT');
});

router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ error: 'Invalid user ID' });
    }
    const weights = await Weight.find({ userId })
        .sort({ date: -1 }) // 按日期倒序排列，最近的在最前
        .limit(10);
    weights.sort((a, b) => {
        // 日期相同再用createdAt排
        const dateComparison = new Date(a.date) - new Date(b.date);
        if (dateComparison !== 0) {
            return dateComparison;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    res.send(weights);
});
router.post('/create', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const { userId, date, weight } = req.body;
        if (!userId || !date || !weight) {
            return res.status(400).json({ message: 'Missing required fields: userId, date, or weight' });
        }
        const newWeight = new Weight({
            userId,
            date: new Date(date),
            weight,
        });
        const weightRecord = await newWeight.save();

        res.status(201).send(weightRecord);
    } catch (error) {
        console.error('Error creating weight record:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
