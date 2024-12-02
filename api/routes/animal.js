import express from 'express';
import Animal from '../models/animalModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
	res.send('ANIMAL');
});
router.get('/create', async (req, res) => {
	res.send('ANIMAL');
});

router.post('/create', async (req, res) => {
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
	res.send({
		//通過驗證回傳帳號資料和token
		_id: animal._id,
		name: animal.name,
		birthday: animal.birthday,
		bloodType: animal.bloodType,
		variety: animal.variety,
		type: animal.type,
		gender: animal.gender,
		weight: animal.weight,
		ligation: animal.ligation,
	});
});

export default router;
