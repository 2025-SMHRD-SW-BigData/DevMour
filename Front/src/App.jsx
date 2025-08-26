import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./Index";
import Dashboard from "./Dashboard";
import NaverMap from "./NaverMap";
import { InfoContext } from "./context/InfoContext";
import WeatherDisplay from "./WeatherDisplay";
import RiskRankingDetail from "./pages/RiskRankingDetail";
import ComplaintDetail from "./pages/ComplaintDetail";
import ConstructionDetail from "./pages/ConstructionDetail";
import RiskScoreDetail from "./pages/RiskScoreDetail";
import ComparisonDetail from "./pages/ComparisonDetail";
import AlertDetail from "./pages/AlertDetail";
import CCTVAdd from "./pages/CCTVAdd";

function App() {
    const [lat, setLat] = useState(35.159983);
    const [lon, setLon] = useState(126.8513092);

    // 위치 업데이트 함수
    const updateLocation = (newLat, newLon) => {
        setLat(newLat);
        setLon(newLon);
    };

    return(
        <InfoContext.Provider value = {{lat, setLat, lon, setLon, updateLocation}}>
            <Routes>
                <Route path = '/' element={<Index></Index>}></Route>
                <Route path = '/dashboard' element={<Dashboard></Dashboard>}></Route>
                <Route path = '/navermap' element = {<NaverMap></NaverMap>}></Route>
                <Route path = '/weatherdisplay' element = {<WeatherDisplay></WeatherDisplay>}></Route>
                
                {/* 상세 페이지 라우트 */}
                <Route path = '/risk-ranking' element = {<RiskRankingDetail></RiskRankingDetail>}></Route>
                <Route path = '/complaints' element = {<ComplaintDetail></ComplaintDetail>}></Route>
                <Route path = '/construction' element = {<ConstructionDetail></ConstructionDetail>}></Route>
                <Route path = '/risk-score' element = {<RiskScoreDetail></RiskScoreDetail>}></Route>
                <Route path = '/comparison' element = {<ComparisonDetail></ComparisonDetail>}></Route>
                <Route path = '/alerts' element = {<AlertDetail></AlertDetail>}></Route>
                <Route path = '/cctv-add' element = {<CCTVAdd></CCTVAdd>}></Route>
            </Routes>
        </InfoContext.Provider>
    )
    
}

export default App