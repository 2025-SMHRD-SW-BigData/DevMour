// routes/weather.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const mysql = require('mysql2')

// MySQL 연결 설정 (conn.connect()를 쿼리마다 호출하는 기존 스타일 유지)
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

const API_KEY = 'c1c00ab7cd918d1121e2b38128a14709';
const BASE_URL = `https://api.openweathermap.org/data/2.5`;

//http://localhost:3001/weather/weather?lat=35.1595&lon=126.8526 <- 예시로 얘 주소에 치면 값 나옴

// API 키 확인 미들웨어
const checkApiKey = (req, res, next) => {
  if (!API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'OpenWeatherMap API 키가 설정되지 않았습니다.'
    });
  }
  next();
};


// 현재 날씨 조회 - 좌표로
router.get('/weather', checkApiKey, async (req, res) => {
  try {
    console.log('🌤️ 날씨 API 요청 시작!');
    console.log('📍 받은 쿼리 파라미터:', req.query);
    const { lat, lon } = req.query;
    console.log(`📊 추출된 좌표: lat=${lat}, lon=${lon}`);
    
    // 좌표 유효성 검사
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: '올바른 좌표를 입력해주세요.'
      });
    }

console.log(`날씨 조회 요청: lat=${lat}, lon=${lon}`); // 디버깅용

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        appid: API_KEY,
        units: 'metric',
        lang: 'kr'
      }
    });

    res.json({
      success: true,
      data: {
        city: response.data.name,
        country: response.data.sys.country,
        coordinates: {
          lat: response.data.coord.lat,
          lon: response.data.coord.lon
        },
        temperature: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        weather: response.data.weather[0].main,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        windSpeed: response.data.wind.speed,
        windDirection: response.data.wind.deg,
        visibility: response.data.visibility,
        cloudiness: response.data.clouds.all,
        sunrise: response.data.sys.sunrise,
        sunset: response.data.sys.sunset,
        timestamp: response.data.dt,
        rain: response.data.rain || null, 
        snow: response.data.snow || null
      }
  
    }
  );

  } catch (error) {
    console.error('좌표 기반 날씨 조회 오류:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: '날씨 정보를 가져오는데 실패했습니다.'
    });
  }
});


//현재 시간 분 단위로
//const timestamp = Math.floor(Date.now() / (1000*60));

// POST 
router.post('/save_weather', (req, res) => {
const {lat, lon, temperature, rain, snow, weather } = req.body;

console.log('받은 데이터:', req.body)

const checkSQL = `SELECT * FROM t_weather 
        WHERE lat = ? AND lon = ? 
        AND DATE_FORMAT(wh_date, '%Y-%m-%d %H:%i') = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i')`

      conn.query(checkSQL, [lat, lon], (err, results) => {
        if (err) {
            console.error('중복 체크 에러:', err);
            return res.status(500).json({ 
                success: false, 
                message: '서버 오류' 
            });
        }

        // 중복 데이터 존재 여부 확인

        if (results.length > 0) {
            return res.status(200).json({ 
                success: false, 
                message: '같은 위치, 같은 시간의 날씨 데이터가 이미 존재합니다.',
                existing_data: results[0]
            });
        }

const insertSQL = 'Insert into t_weather(wh_date, lat, lon, temp, precipitation, snowfall,wh_type) values (?,?, ?, ?, ?,?,?)'

        // 데이터 전처리 - DECIMAL 컬럼이므로 숫자로 변환
        const precipitationValue = parseFloat(rain) || 0;
        const snowfallValue = parseFloat(snow) || 0;

conn.query(insertSQL, [new Date(),lat, lon, temperature, precipitationValue, snowfallValue, weather ], (err, insertResults) => {
    if (err) {

        console.error('=== 삽입 에러 상세 정보 ===');
            console.error('에러 코드:', err.code);
            console.error('에러 메시지:', err.message);
            console.error('SQL 상태:', err.sqlState);

        return res.status(500).json({ success: false,
                                     message: '데이터 삽입 실패' });     
      }
    console.log('삽입 성공:', insertResults);


    return res.json({ success: true,
                     message: '날씨데이터가 성공적으로 DB에 들어갔습니다.' });

  });
})
})

module.exports = router;