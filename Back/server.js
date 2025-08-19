// 서버 실행 (포트 liston만 담당)
const express       = require('express');
const cors          = require('cors');
const path          = require('path');

const app = express();
const PORT = 3001;

// 미들웨어 설정 추가
app.use(cors());         
app.use(express.json());  

// 날씨 라우터 연결 추가
const weatherRouter = require('./router/weather')

app.use('/weather', weatherRouter);


// 기본 라우트 추가 (선택사항)
app.get('/', (req, res) => {
    console.log('🏠 기본 라우트 접근');
  res.json({ 
    message: 'Weather API Server',
    version: '1.0.0'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});