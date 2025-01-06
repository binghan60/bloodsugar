import express from 'express';
import BloodSugar from '../models/bloodSugarModel.js';
import BloodSugarCurve from '../models/bloodSugarCurveModel.js';
import Animal from '../models/animalModel.js';
import mongoose from 'mongoose';
const router = express.Router();
router.get('/statistics', async (req, res) => {
    try {
        // 取得從前端發來的查詢參數
        const { animalId, start, end } = req.query;

        // 將傳入的時間字串轉換為 Date 類型，便於 MongoDB 操作
        const startDate = new Date(start);
        const endDate = new Date(end);

        // 檢查animalId是否為有效的MongoDB ObjectId格式
        if (!mongoose.Types.ObjectId.isValid(animalId)) {
            return res.status(400).json({ error: 'Invalid animal ID' });
        }

        // 使用MongoDB的聚合管道進行資料處理
        const statistics = await BloodSugar.aggregate([
            {
                // $match: 過濾符合條件的文檔
                $match: {
                    userId: new mongoose.Types.ObjectId(animalId), // 匹配指定的動物ID
                    date: { $gte: startDate, $lte: endDate }, // 日期範圍內的記錄
                    $or: [
                        { 'morning.bloodSugar': { $nin: [null, ''] } }, // 早晨血糖不為空
                        { 'evening.bloodSugar': { $nin: [null, ''] } }, // 晚上血糖不為空
                    ],
                },
            },
            {
                // $project: 選擇需要的欄位，並重命名
                $project: {
                    morningSugar: '$morning.bloodSugar', // 取出早晨血糖值
                    eveningSugar: '$evening.bloodSugar', // 取出晚上血糖值
                    date: 1, // 保留日期
                    userId: 1, // 保留使用者ID
                },
            },
            {
                // $facet: 同時進行多組聚合計算
                $facet: {
                    averages: [
                        {
                            // 計算平均值
                            $group: {
                                _id: null, // 不分組，對所有記錄進行統計
                                totalAverage: { $avg: { $avg: ['$morningSugar', '$eveningSugar'] } }, // 早晚血糖總平均
                                morningAverage: { $avg: '$morningSugar' }, // 早晨血糖平均
                                eveningAverage: { $avg: '$eveningSugar' }, // 晚上血糖平均
                            },
                        },
                    ],
                    ranges: [
                        {
                            // 為血糖值分配範圍
                            $project: {
                                morningRange: {
                                    $cond: [
                                        {
                                            $or: [
                                                { $eq: ['$morningSugar', null] }, // 如果早晨血糖值為null
                                                { $eq: ['$morningSugar', ''] }, // 或為空字串
                                            ],
                                        },
                                        'morningSugarUndefined', // 未定義範圍
                                        {
                                            $cond: [
                                                { $and: [{ $gte: ['$morningSugar', 1] }, { $lt: ['$morningSugar', 249] }] },
                                                'morningSugarLow', // 低範圍
                                                {
                                                    $cond: [
                                                        { $and: [{ $gte: ['$morningSugar', 250] }, { $lt: ['$morningSugar', 399] }] },
                                                        'morningSugarMid', // 中範圍
                                                        'morningSugarHigh', // 高範圍
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                eveningRange: {
                                    $cond: [
                                        {
                                            $or: [
                                                { $eq: ['$eveningSugar', null] }, // 如果晚上血糖值為null
                                                { $eq: ['$eveningSugar', ''] }, // 或為空字串
                                            ],
                                        },
                                        'eveningSugarUndefined', // 未定義範圍
                                        {
                                            $cond: [
                                                { $and: [{ $gte: ['$eveningSugar', 1] }, { $lt: ['$eveningSugar', 249] }] },
                                                'eveningSugarLow', // 低範圍
                                                {
                                                    $cond: [
                                                        { $and: [{ $gte: ['$eveningSugar', 250] }, { $lt: ['$eveningSugar', 399] }] },
                                                        'eveningSugarMid', // 中範圍
                                                        'eveningSugarHigh', // 高範圍
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        { $unwind: '$morningRange' }, // 展開早晨範圍的陣列
                        { $unwind: '$eveningRange' }, // 展開晚上範圍的陣列
                        {
                            $group: {
                                _id: {
                                    morningRange: '$morningRange', // 依早晨範圍分組
                                    eveningRange: '$eveningRange', // 依晚上範圍分組
                                },
                                count: { $sum: 1 }, // 計算每個範圍內的記錄數
                            },
                        },
                    ],
                },
            },
        ]);

        // 提取結果
        const { averages, ranges } = statistics[0];

        // 重新整理範圍計數
        const rangeCounts = ranges.reduce((acc, range) => {
            const morningKey = range._id.morningRange.replace('morningSugar', 'Morning');
            const eveningKey = range._id.eveningRange.replace('eveningSugar', 'Evening');

            acc[morningKey] = (acc[morningKey] || 0) + range.count;
            acc[eveningKey] = (acc[eveningKey] || 0) + range.count;

            return acc;
        }, {});

        // 計算各範圍的總數
        const totalLow = (rangeCounts.MorningLow || 0) + (rangeCounts.EveningLow || 0);
        const totalMid = (rangeCounts.MorningMid || 0) + (rangeCounts.EveningMid || 0);
        const totalHigh = (rangeCounts.MorningHigh || 0) + (rangeCounts.EveningHigh || 0);

        // 回傳統計結果
        res.json({
            totalAverage: averages[0]?.totalAverage || 0, // 總平均值
            morningAverage: averages[0]?.morningAverage || 0, // 早晨平均值
            eveningAverage: averages[0]?.eveningAverage || 0, // 晚上平均值
            rangeCounts, // 各範圍的統計數
            totalLow, // 低範圍總數
            totalMid, // 中範圍總數
            totalHigh, // 高範圍總數
        });
    } catch (error) {
        // 錯誤處理
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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
            date: new Date(date),
        });
        if (existingRecord) {
            let updateFields = {};
            if (morning.bloodSugar !== undefined && morning.bloodSugar !== '') {
                updateFields['morning.bloodSugar'] = morning.bloodSugar;
            }
            if (morning.insulin !== undefined && morning.insulin !== '') {
                updateFields['morning.insulin'] = morning.insulin;
            }
            if (morning.time !== undefined && morning.time !== '') {
                updateFields['morning.time'] = morning.time;
            }
            if (evening.bloodSugar !== undefined && evening.bloodSugar !== '') {
                updateFields['evening.bloodSugar'] = evening.bloodSugar;
            }
            if (evening.insulin !== undefined && evening.insulin !== '') {
                updateFields['evening.insulin'] = evening.insulin;
            }
            if (evening.time !== undefined && evening.time !== '') {
                updateFields['evening.time'] = evening.time;
            }
            if (notes !== undefined && notes !== '') {
                updateFields['notes'] = notes;
            }
            //////////////////
            // let updateFields = {};
            // console.log(morning);
            // if (morning.bloodSugar) {
            // 	updateFields.morning.bloodSugar = morning.bloodSugar;
            // }
            // if (morning.insulin) {
            // 	updateFields.morning.insulin = morning.insulin;
            // }
            console.log(updateFields);
            const updatedRecord = await BloodSugar.findOneAndUpdate({ _id: existingRecord._id }, { $set: updateFields }, { new: true });
            return res.status(200).send(updatedRecord);
        }
        // 如果沒有資料，創建新的 BloodSugar 資料
        const newBloodSugar = new BloodSugar({
            userId,
            date: new Date(date),
            morning: morning
                ? {
                      time: morning.time,
                      bloodSugar: morning.bloodSugar,
                      insulin: morning.insulin,
                  }
                : undefined,
            evening: evening
                ? {
                      time: evening.time,
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
router.get('/getCurve', async (req, res) => {
    const { userId, year, month } = req.query;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
    }
    try {
        const dayInMonth = new Date(year, month, 0).getDate();
        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(`${year}-${month}-${dayInMonth}`);
        const data = await BloodSugarCurve.find({
            userId,
            date: { $gte: startDate, $lte: endDate },
        }).sort({ date: 1 });
        return res.status(201).send(data);
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
        const { userId, date, records } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const targetDate = new Date(date);
        const existingRecord = await BloodSugarCurve.findOne({
            userId,
            date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) },
        });
        if (existingRecord) {
            existingRecord.records.push(...records);
            const updatedRecord = await existingRecord.save();
            return res.status(200).send(updatedRecord);
        } else {
            //沒資料
            const newBloodSugarCurve = new BloodSugarCurve({
                userId,
                date: targetDate,
                records,
            });
            const bloodSugarCurve = await newBloodSugarCurve.save();
            return res.status(201).send(bloodSugarCurve);
        }
    } catch (error) {
        console.error('Error creating or updating blood sugar record:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
