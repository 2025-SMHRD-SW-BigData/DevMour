import React, {useState,useContext,useEffect,useRef} from "react";
import { InfoContext } from "./context/InfoContext";

const WeatherDisplay = ({}) => {
    console.log("출력중~")
    const {lat, lon} = useContext(InfoContext)
    const [loading, setLoading] = useState(false);
    const [weatherData, setWeatherData] = useState(null);

// DB 저장 함수를 먼저 정의
    const saveWeatherToDatabase = async (lat, lon, weatherData) => {
        try {
            console.log('DB에 날씨 데이터 저장 중...', { lat, lon, weatherData });
            
            const response = await fetch('http://localhost:3001/weather/save_weather', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lat: lat,
                    lon: lon,
                    temperature: weatherData.temperature,
                    rain: weatherData?.rain?.['1h'] ? `${weatherData.rain['1h']}mm` : 0,
                    snow: weatherData?.snow?.['1h'] ? `${weatherData.snow['1h']}mm` : 0,
                    weather: weatherData.weather || '실시간' 
                  })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ DB 저장 성공:', result);
            } else {
                console.log('ℹ️ DB 저장 결과:', result.message);
            }
        } catch (error) {
            console.error('❌ DB 저장 실패:', error);
        }
    };

 // 날씨 API 호출 함수
  const fetchWeatherData = async (lat, lon) => {
    if(!lat || !lon) return

setLoading(true);
    try {
      console.log(`날씨 API 호출 중 : 위도=${lat} 경도=${lon}`)

      const response = await fetch(`http://localhost:3001/api/weather/weather?lat=${lat}&lon=${lon}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('날씨 데이터:', result.data);
        setWeatherData(result.data);
      
        // 🔥 날씨 데이터를 받아온 후 DB에 저장
      await saveWeatherToDatabase(lat, lon, result.data);
      }
    } catch (error) {
      console.error('날씨 API 호출 실패:', error);
      setWeatherData(null)

    } finally {
      setLoading(false);
    }
  };


  
 // 🔥 위도/경도가 변경될 때마다 자동으로 날씨 데이터 가져오기
  useEffect(() => {
    if (lat && lon) {
      fetchWeatherData(lat, lon);
    }
  }, [lat, lon]); // lat, lon이 변경되면 자동 실행


console.log('=== 날씨 데이터 디버깅 ===');
console.log('lat:', lat, 'lon:', lon);
console.log('loading:', loading);
console.log('weatherData 전체:', weatherData);

if (weatherData) {
    console.log('weather 속성:', weatherData.weather);
    console.log('description 속성:', weatherData.description);
    console.log('temperature 속성:', weatherData.temperature);
}



 return(
    <div className="weather">
    <p>현재 위치: 위도 {lat}, 경도 {lon}</p>

    {/* 날씨 정보 표시 영역 */}
    {loading ? (
        <div className="weather_loading">
            <p>날씨 정보를 불러오는 중...</p>
        </div>
    ): weatherData ?(
      <div className="weather-info">
          <div className="weather-main">
            <h4 style={{ textAlign: 'center' }}>📍 {weatherData.city}</h4>

            <div style={{display: 'flex', 
                        gap: '20px', 
                        justifyContent: 'space-between',
                        marginTop: '20px' }}>            
            <div className="detail-item">🌡{weatherData.temperature.toFixed(1)}°C</div>
            <div className="detail-item">{weatherData.description}</div>
            <div className="detail-item">💧 강수량: {weatherData?.rain?.['1h'] ? `${weatherData.rain['1h']}mm/h` : '없음'}
            </div>
            <div className="detail-item">❄️ 강설량: {weatherData?.snow?.['1h'] ? `${weatherData.snow['1h']}mm/h` : '없음'}
            </div>

            </div>
      <div className="weather-details">
          </div>
          </div>
        </div>
    ):(
        <div className="weather-placeholder">
        <p>📍 지도를 클릭하면 해당 위치의 날씨가 표시됩니다</p>
        </div>
    )}   
    
    </div> 

 )
}

export default WeatherDisplay

