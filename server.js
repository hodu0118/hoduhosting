const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// public 폴더의 정적 파일들을 서빙할 수 있도록 절대 경로 설정 보완
app.use(express.static(path.join(__dirname, 'public')));

// 현재 실행 중인 유저들의 봇 프로세스들을 저장하는 공간
const activeBots = {};

// [기능 0] 메인 페이지 접속 시 index.html을 강제로 보내주도록 설정 (에러 해결 핵심)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// [기능 1] 봇 실행 API
app.post('/api/bot/start', (req, res) => {
    const { userId, botCode } = req.body;

    if (!userId || !botCode) {
        return res.status(400).json({ success: false, message: '유저 ID와 봇 코드가 필요합니다.' });
    }

    if (activeBots[userId]) {
        clearInterval(activeBots[userId].interval);
    }

    try {
        console.log(`[${userId}] 봇 가동 시작...`);
        
        const botFunction = new Function('console', botCode);
        let logs = [];
        const customConsole = {
            log: (...args) => {
                const msg = args.join(' ');
                logs.push(`[LOG] ${msg}`);
                console.log(`[Bot-${userId}] ${msg}`);
            },
            error: (...args) => {
                const msg = args.join(' ');
                logs.push(`[ERROR] ${msg}`);
                console.error(`[Bot-${userId}] ${msg}`);
            }
        };

        botFunction(customConsole);

        const interval = setInterval(() => {
            customConsole.log("봇이 24시간 감시 모드로 정상 작동 중입니다...");
        }, 10000); 

        activeBots[userId] = {
            interval: interval,
            logs: logs,
            code: botCode,
            status: 'running'
        };

        res.json({ success: true, message: '봇이 성공적으로 켜졌습니다!' });
    } catch (error) {
        res.status(500).json({ success: false, message: `봇 실행 에러: ${error.message}` });
    }
});

// [기능 2] 봇 정지 API
app.post('/api/bot/stop', (req, res) => {
    const { userId } = req.body;

    if (activeBots[userId]) {
        clearInterval(activeBots[userId].interval);
        activeBots[userId].status = 'stopped';
        activeBots[userId].logs.push('[SYSTEM] 봇이 사용자에 의해 정지되었습니다.');
        res.json({ success: true, message: '봇이 정지되었습니다.' });
    } else {
        res.status(404).json({ success: false, message: '실행 중인 봇을 찾을 수 없습니다.' });
    }
});

// [기능 3] 봇 로그 가져오기 API
app.get('/api/bot/logs/:userId', (req, res) => {
    const { userId } = req.params; // 쿼리가 아니라 파라미터로 받도록 변경하여 안정성 향상
    if (activeBots[userId]) {
        res.json({ success: true, logs: activeBots[userId].logs, status: activeBots[userId].status });
    } else {
        res.json({ success: true, logs: ['실행 중인 봇이 없습니다.'], status: 'stopped' });
    }
});

app.listen(PORT, () => {
    console.log(`Hodu Hosting running on port ${PORT}`);
});
