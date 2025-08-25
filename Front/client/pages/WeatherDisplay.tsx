import React, { useState, useEffect } from 'react';

const WeatherDisplay: React.FC = () => {
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: '맑음',
    humidity: 65,
    windSpeed: 3.2
  });

  return (
    <div className="weather-display">
      <h3>날씨 정보</h3>
      <div className="weather-grid">
        <div className="weather-item">
          <span className="label">온도</span>
          <span className="value">{weather.temperature}°C</span>
        </div>
        <div className="weather-item">
          <span className="label">날씨</span>
          <span className="value">{weather.condition}</span>
        </div>
        <div className="weather-item">
          <span className="label">습도</span>
          <span className="value">{weather.humidity}%</span>
        </div>
        <div className="weather-item">
          <span className="label">풍속</span>
          <span className="value">{weather.windSpeed}m/s</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;
