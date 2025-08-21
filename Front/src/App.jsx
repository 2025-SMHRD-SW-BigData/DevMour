import { useState } from "react";
import { Routes, Route } from "react-router-dom";
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

function App() {
    const [lat, setLat] = useState();
    const [lon, setLon] = useState();

    return(
        <InfoContext.Provider value = {{lat, setLat, lon, setLon}}>
            <Routes>
                <Route path = '/' element={<Dashboard></Dashboard>}></Route>
                <Route path = '/navermap' element = {<NaverMap></NaverMap>}></Route>
                <Route path = '/weatherdisplay' element = {<WeatherDisplay></WeatherDisplay>}></Route>
                
                {/* 상세 페이지 라우트 */}
                <Route path = '/risk-ranking' element = {<RiskRankingDetail></RiskRankingDetail>}></Route>
                <Route path = '/complaints' element = {<ComplaintDetail></ComplaintDetail>}></Route>
                <Route path = '/construction' element = {<ConstructionDetail></ConstructionDetail>}></Route>
                <Route path = '/risk-score' element = {<RiskScoreDetail></RiskScoreDetail>}></Route>
                <Route path = '/comparison' element = {<ComparisonDetail></ComparisonDetail>}></Route>
                <Route path = '/alerts' element = {<AlertDetail></AlertDetail>}></Route>
            </Routes>
        </InfoContext.Provider>
    )
    
}

export default App