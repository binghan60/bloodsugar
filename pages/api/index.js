import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import animalRouter from './animal.js';
import weightRouter from './weight.js';
import bloodSugarRouter from './bloodSugar.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
mongoose //連線至資料庫
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('資料庫連線成功');
    })
    .catch((err) => {
        console.log('資料庫連線失敗');
        console.log(err.message);
    });
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use('/animal', animalRouter);
app.use('/weight', weightRouter);
app.use('/bloodSugar', bloodSugarRouter);

app.get('/api', (req, res) => {
    res.send('Hello, Express!');
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
export default (req, res) => {
    app(req, res);
};
