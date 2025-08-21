import React , {useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";
import { InfoContext } from "./context/InfoContext";
import "./Dashboard.css";
import NaverMap from "./NaverMap";
import Modals from "./Modals";
import WeatherDisplay from "./WeatherDisplay";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState('cctv');
  const [selectedMarkerData, setSelectedMarkerData] = useState(null);
  const nav = useNavigate();
  
  // ✅ InfoContext에서 lat, lon 값 가져오기
  const { lat, lon } = useContext(InfoContext);

  // 이 함수를 NaverMap 컴포넌트 내부에서 호출할 수 있도록 props로 전달
  const handleMarkerClick = (markerType, markerData) => {
    console.log('🎯 Dashboard handleMarkerClick 호출:', { markerType, markerData });
    setSelectedMarkerType(markerType);
    setSelectedMarkerData(markerData);
    setIsModalOpen(true);
    console.log('✅ 모달 상태 업데이트 완료');
  };


  return (
    <div className="container">
      {/* 헤더 */}
      <header className="header">
        <div>도로 안전 관리 시스템</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            📍 현재 위치: {lat ? lat.toFixed(6) : 'N/A'}, {lon ? lon.toFixed(6) : 'N/A'}
          </span>
          <span>🔍</span>
        </div>
      </header>

      {/* 왼쪽 패널 */}
      <aside className="left-panel">
        <div className="card">
          <h3>도로 위험도 랭킹</h3>
          <p>🔴 고위험 구간: 3곳</p>
          <p>🟠 주의 구간: 7곳</p>
          <p>🟢 안전 구간: 12곳</p>
          <button className="detail-btn" onClick={() => nav('/risk-ranking')}>
            상세보기 →
          </button>
        </div>
        <div className="card">
          <h3>민원 신고 접수</h3>
          <p>오늘 접수: 8건</p>
          <p>처리 완료: 5건</p>
          <button className="detail-btn" onClick={() => nav('/complaints')}>
            상세보기 →
          </button>
        </div>
        <div className="card">
          <h3>도로 보수공사</h3>
          <p>진행 중: 4개</p>
          <div className="bar">
            <div className="bar-fill"></div>
          </div>
          <button className="detail-btn" onClick={() => nav('/construction')}>
            상세보기 →
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main className="main">
        <NaverMap onMarkerClick={handleMarkerClick}/>
        <Modals 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          markerType={selectedMarkerType}
          markerData={selectedMarkerData}
        />
        <div className="card">
          <h3>날씨 정보 및 예측</h3>
          <WeatherDisplay/>
          <div className="weather">
            {/* <div className="weather-item">
              <h4>☀️ 맑음</h4>
              <p>22℃</p>
            </div>
            <div className="weather-item">
              <h4>☁️ 흐림</h4>
              <p>18℃</p>
            </div>
            <div className="weather-item">
              <h4>🌧️ 비</h4>
              <p>15℃</p>
            </div>
            <div className="weather-item">
              <h4>❄️ 눈</h4>
              <p>-2℃</p>
            </div> */}
          </div>
        </div>
      </main>

      {/* 오른쪽 패널 */}
      <aside className="right-panel">
        <div className="card" style={{ textAlign: "center" }}>
          <h3>종합 위험도 점수</h3>
          <div className="score-circle">6.5</div>
          <p>오늘 평균 위험도 (보통 수준)</p>
          <button className="detail-btn" onClick={() => nav('/risk-score')}>
            상세보기 →
          </button>
        </div>

        <div className="card">
          <h3>전년도 동기간 대비</h3>
          <p>민원 건수 비교</p>
          <div className="bar">
            <div className="bar-fill" style={{ width: "65%" }}></div>
          </div>
          <p>위험도 비교</p>
          <div className="bar">
            <div
              className="bar-fill"
              style={{ width: "80%", background: "#2ecc71" }}
            ></div>
          </div>
          <button className="detail-btn" onClick={() => nav('/comparison')}>
            상세보기 →
          </button>
        </div>

        <div className="card">
          <h3>실시간 알림 현황</h3>
          <div className="alert red">⚠️ 장한로 구간 위험도 급상승</div>
          <div className="alert yellow">⚠️ 데이터 오류 발생</div>
          <div className="alert blue">📢 신규 신고: 10분 전</div>
          <button className="detail-btn" onClick={() => nav('/alerts')}>
            상세보기 →
          </button>
        </div>
      </aside>

    </div>
  );
};

export default Dashboard;
