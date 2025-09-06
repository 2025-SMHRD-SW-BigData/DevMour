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
import Register from "./pages/Register";
import NotificationSystem from "./components/NotificationSystem";
import Modals from "./Modals";

function App() {
    const [lat, setLat] = useState(35.159983);
    const [lon, setLon] = useState(126.8513092);
    const [modalData, setModalData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);

    // 위치 업데이트 함수
    const updateLocation = (newLat, newLon) => {
        setLat(newLat);
        setLon(newLon);
    };

    // 알림 클릭 핸들러
    const handleNotificationClick = (notification) => {
        if (notification.type === 'citizen_report') {
            // 시민 제보 모달 데이터 설정
            setModalData({
                type: 'citizen_report',
                reportId: notification.reportId,
                addr: notification.addr,
                c_report_detail: notification.c_report_detail,
                lat: notification.lat,
                lon: notification.lon,
                timestamp: notification.timestamp
            });
            
            // 모달 열기
            setModalType('complaint');
            setIsModalOpen(true);
        }
    };

    // 모달 닫기 핸들러
    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalType(null);
        setModalData(null);
    };

    return(
        <InfoContext.Provider value = {{lat, setLat, lon, setLon, updateLocation, modalData, setModalData}}>
            <Routes>
                <Route path = '/' element={<Index></Index>}></Route>
                <Route path = '/register' element={<Register></Register>}></Route>
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

            {/* 실시간 알림 시스템 */}
            <NotificationSystem onNotificationClick={handleNotificationClick} />
            
            {/* 알림 클릭 시 열리는 모달 */}
            <Modals 
                isOpen={isModalOpen}
                onClose={handleModalClose}
                markerType={modalType}
                markerData={modalData}
            />
        </InfoContext.Provider>
    )
    
}

export default App
