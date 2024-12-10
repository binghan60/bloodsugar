import express from 'express';
import Animal from '../models/animalModel.js';
import Weight from '../models/weightModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
    res.send('ANIMAL');
});
router.get('/:id', async (req, res) => {
    const user = await Animal.findById(req.params.id); //用網址的ID去資料庫找該用戶  管理者顯示用戶資料用
    const weight = await Weight.find({ userId: req.params.id }).sort({ date: -1 }).limit(3);
    weight.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    user.weight = weight[weight.length - 1];
    const userWithWeight = { ...user.toObject(), weight: weight[weight.length - 1] };
    if (user) {
        res.send(userWithWeight); //如果有就回傳
    } else {
        res.status(404).send({ message: '找不到用戶' });
    }
});

router.post('/create', async (req, res) => {
    try {
        const newAnimal = new Animal({
            //以req.body的資料new一個User
            name: req.body.name,
            birthday: req.body.birthday,
            bloodType: req.body.bloodType,
            variety: req.body.variety,
            type: req.body.type,
            gender: req.body.gender,
            weight: req.body.weight,
            ligation: req.body.ligation,
        });
        const animal = await newAnimal.save(); //保存至資料庫
        res.send({ animal });
    } catch (error) {
        // 捕獲 Mongoose validation 錯誤
        console.error(error);
        if (error.name === 'ValidationError') {
            // 如果是驗證錯誤，返回詳細錯誤信息
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        // 其他錯誤，返回 500 錯誤
        res.status(500).json({ message: 'Server Error' });
    }
});
export default router;
