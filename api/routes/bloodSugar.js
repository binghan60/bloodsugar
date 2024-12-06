import express from 'express';
import BloodSugar from '../models/bloodSugarModel.js';
import BloodSugarCurve from '../models/bloodSugarCurveModel.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/diary', async (req, res) => {
	const { id, year, month, dayInMonth } = req.query;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({ error: 'Invalid user ID' });
	}

	if (!year || !month) {
		return res.status(400).send({ error: 'Year and month are required' });
	}

	try {
		const startDate = new Date(`${year}-${month}-01`);
		const endDate = new Date(`${year}-${month}-${dayInMonth}`);
		const data = await BloodSugar.find({
			userId: id,
			date: { $gte: startDate, $lte: endDate },
		}).sort({ date: 1 });

		return res.status(200).json(data);
	} catch (error) {
		return res.status(500).send({ error: 'Server error' });
	}
});

router.post('/create', async (req, res) => {
	try {
		const { userId, date, morning, evening, notes } = req.body;
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: 'Invalid userId' });
		}
		const existingRecord = await BloodSugar.findOne({
			userId,
			date: new Date(),
		});
		if (existingRecord) {
			const updateFields = {
				morning: {
					bloodSugar: morning.bloodSugar,
					insulin: morning.insulin,
				},
				evening: {
					bloodSugar: evening.bloodSugar,
					insulin: evening.insulin,
				},
				notes,
			};
			const updatedRecord = await BloodSugar.findOneAndUpdate({ _id: existingRecord._id }, { $set: updateFields }, { new: true });
			return res.status(200).send(updatedRecord);
		}
		// 如果沒有資料，創建新的 BloodSugar 資料
		const newBloodSugar = new BloodSugar({
			userId,
			date: new Date(date),
			morning: morning
				? {
						bloodSugar: morning.bloodSugar,
						insulin: morning.insulin,
				  }
				: undefined,
			evening: evening
				? {
						bloodSugar: evening.bloodSugar,
						insulin: evening.insulin,
				  }
				: undefined,
			notes: notes || '',
		});

		const bloodSugarRecord = await newBloodSugar.save();
		return res.status(201).send(bloodSugarRecord);
	} catch (error) {
		console.error('Error creating or updating blood sugar record:', error);
		if (error.name === 'ValidationError') {
			return res.status(400).json({ message: 'Validation Error', errors: error.errors });
		}
		res.status(500).json({ message: 'Server Error' });
	}
});

router.post('/createCurve', async (req, res) => {
	try {
		console.log(req.body);
		const { userId, date, records } = req.body;
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: 'Invalid userId' });
		}
		const newBloodSugarCurve = new BloodSugarCurve({
			userId,
			date: new Date(date),
			records,
		});
		const bloodSugarCurve = await newBloodSugarCurve.save();
		return res.status(201).send(bloodSugarCurve);
	} catch (error) {
		console.error('Error creating or updating blood sugar record:', error);
		if (error.name === 'ValidationError') {
			return res.status(400).json({ message: 'Validation Error', errors: error.errors });
		}
		res.status(500).json({ message: 'Server Error' });
	}
});

export default router;
