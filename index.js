const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 서버 작동 확인용 기본 페이지
app.get('/', (req, res) => {
    res.send('Welcome to Hodu Hosting API Server! 🚀');
});

// 나중에 유저가 봇을 켤 때 요청할 API 예시
app.post('/api/bot/start', (req, res) => {
    // 여기에 유저 봇 프로세스를 구동하는 로직이 들어갈 예정입니다.
    res.json({ success: true, message: "봇이 성공적으로 구동되었습니다." });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
