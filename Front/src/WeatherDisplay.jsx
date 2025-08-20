import React, {useState,useContext,useEffect,useRef} from "react";
import { InfoContext } from "./context/InfoContext";

const WeatherDisplay = ({}) => {
    console.log("출력중~")
    const {lat, lon} = useContext(InfoContext)
console.log("위도와 경도 : ", lat,lon)

 // 날씨 API 호출 함수
  const fetchWeatherData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/weather/weather?lat=${lat}&lon=${lon}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('날씨 데이터:', result.data);
        
      }
    } catch (error) {
      console.error('날씨 API 호출 실패:', error);
    }

   
  };
 return(
    <div className="card">

        
    </div>    
    )



}

export default WeatherDisplay

