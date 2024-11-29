const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

// 使用中間件
app.use(bodyParser.json());
app.use(cors());
// 定義首頁路由
app.get('/', (req, res) => {
	res.send('Hello, Express!');
});
app.get('/api', (req, res) => {
	res.json({ message: 'Welcome to the API!' });
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
