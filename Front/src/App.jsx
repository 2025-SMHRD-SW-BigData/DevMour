import { useContext } from "react";
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
import { getComplaintDetail } from "./utils/api";
import { isLoggedIn } from "./utils/auth";
import { useLocation } from "react-router-dom";

function App() {
    const { openCitizenReportModal, closeModal, isModalOpen, modalType, citizenReportData } = useContext(InfoContext);
    const location = useLocation();

    // 알림 클릭 핸들러
    const handleNotificationClick = async (notification) => {
        console.log('🔔 알림 클릭 이벤트 발생:', notification);
        
        if (notification.type === 'citizen_report') {
            try {
                console.log('🔍 시민 제보 상세 정보 조회 시작:', notification.reportId);
                console.log('📡 API 요청 URL:', `http://175.45.194.114:3001/api/complaint/detail/${notification.reportId}`);
                
                // 시민 제보 상세 정보 조회
                const detailResult = await getComplaintDetail(notification.reportId);
                
                console.log('✅ getComplaintDetail 함수 호출 완료:', detailResult);
                
                // Context를 통해 시민 제보 모달 열기
                openCitizenReportModal(notification, detailResult.success ? detailResult.complaint : null);
                
            } catch (error) {
                console.error('❌ 시민 제보 상세 정보 조회 실패:', error);
                
                // 오류가 발생해도 기본 정보로 모달 열기
                openCitizenReportModal(notification, null);
            }
        }
    };

    // 모달 닫기 핸들러
    const handleModalClose = () => {
        closeModal();
    };

    return(
        <>
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
            
            {/* 실시간 알림 시스템 - 로그인된 상태에서만 표시 */}
            {isLoggedIn() && location.pathname !== '/' && location.pathname !== '/register' && (
                <NotificationSystem onNotificationClick={handleNotificationClick} />
            )}
            
            {/* 알림 클릭 시 열리는 모달 */}
            <Modals 
                isOpen={isModalOpen}
                onClose={handleModalClose}
                markerType={modalType}
                markerData={citizenReportData}
            />
        </>
    )
    
}

export default App
