// routes/weather.js
const express = require('express');
const axios = require('axios');
const router = express.Router();


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
        timestamp: response.data.dt
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


module.exports = router;