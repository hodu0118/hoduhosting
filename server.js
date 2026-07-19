const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// 프론트엔드 정적 파일들을 폴더에서 읽어오도록 설정
app.use(express.static(path.join(__dirname, 'public')));

// 현재 실행 중인 유저들의 봇 프로세스들을 저장하는 공간
const activeBots = {};

// [기능 1] 봇 실행 API
app.post('/api/bot/start', (req, res) => {
    const { userId, botCode } = req.body;

    if (!userId || !botCode) {
        return res.status(400).json({ success: false, message: '유저 ID와 봇 코드가 필요합니다.' });
    }

    // 이미 실행 중인 봇이 있다면 먼저 종료
    if (activeBots[userId]) {
        clearInterval(activeBots[userId].interval);
    }

    try {
        console.log(`[${userId}] 봇 가동 시작...`);
        
        // Render 무료 환경에서 격리 실행을 흉내 내기 위해 간단한 샌드박스 형태로 실행
        // 실제 유저 코드를 안전하게 격리 구동하기 위한 가상 컨텍스트 함수
        const botFunction = new Function('console', botCode);
        
        // 봇 콘솔 로그 기록용
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

        // 봇 실행
        botFunction(customConsole);

        // Render 무료 서버 자원 고갈을 막기 위한 강제 루프 모니터링 (예시 핑)
        const interval = setInterval(() => {
            customConsole.log("봇이 24시간 감시 모드로 정상 작동 중입니다...");
        }, 10000); // 10초마다 로그 기록

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
    const { userId } = req.query;
    if (activeBots[userId]) {
        res.json({ success: true, logs: activeBots[userId].logs, status: activeBots[userId].status });
    } else {
        res.json({ success: true, logs: ['실행 중인 봇이 없습니다.'], status: 'stopped' });
    }
});

app.listen(PORT, () => {
    console.log(`Hodu Hosting running on port ${PORT}`);
});
