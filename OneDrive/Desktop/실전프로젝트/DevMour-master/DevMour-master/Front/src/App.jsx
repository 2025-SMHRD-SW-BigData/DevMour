import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import NaverMap from "./NaverMap";
import { InfoContext } from "./context/InfoContext";
import WeatherDisplay from "./WeatherDisplay";
import Login from "./Login"; // Login 컴포넌트 import

function App() {
    const [lat, setLat] = useState();
    const [lon, setLon] =  useState();

    return (
        <InfoContext.Provider value={{ lat, setLat, lon, setLon }}>
            <Routes>
                {/* 메인 페이지를 로그인으로 설정 */}
                <Route path="/" element={<Login />} />

                {/* 로그인 성공 후 이동할 페이지들 */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/navermap" element={<NaverMap />} />
                <Route path="/weatherdisplay" element={<WeatherDisplay />} />
            </Routes>
        </InfoContext.Provider>
    );
}

export default App;