import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";
import NaverMap from "./NaverMap";
import Modals from "./Modals";
import WeatherDisplay from "./WeatherDisplay";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState('cctv');
  const [selectedMarkerData, setSelectedMarkerData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [riskRankings, setRiskRankings] = useState([]);
  const [riskRankingsLoading, setRiskRankingsLoading] = useState(true);
  const [averageRiskScore, setAverageRiskScore] = useState(0);
  const [averageRiskLoading, setAverageRiskLoading] = useState(true);
  const [citizenReportStats, setCitizenReportStats] = useState({ completedCount: 0, pendingCount: 0, totalCount: 0 });
  const [citizenReportLoading, setCitizenReportLoading] = useState(true);
  const [roadConstructionStats, setRoadConstructionStats] = useState({ completedCount: 0, inProgressCount: 0, totalCount: 0 });
  const [roadConstructionLoading, setRoadConstructionLoading] = useState(true);
  const [yearOverYearData, setYearOverYearData] = useState(null);
  const [yearOverYearLoading, setYearOverYearLoading] = useState(true);
  const nav = useNavigate();
  const { logout } = useAuth();
  
  // 위험도 상세 데이터 상태
  const [riskDetailData, setRiskDetailData] = useState([]);
  const [riskDetailLoading, setRiskDetailLoading] = useState(true);

  // 실시간 알림 데이터 가져오기
  useEffect(() => {
    fetchRecentAlerts();
    fetchRiskRankings();
    fetchRiskDetailData();
    fetchAverageRiskScore();
    fetchCitizenReportStats();
    fetchRoadConstructionStats();
    fetchYearOverYearData();
  }, []);

  // 실시간 알림 데이터 가져오기
  const fetchRecentAlerts = async () => {
    try {
      setAlertsLoading(true);
      const response = await fetch('http://localhost:3001/api/alert/recent');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        console.error('알림 데이터 조회 실패:', response.status);
        setAlerts([]);
      }
    } catch (error) {
      console.error('알림 데이터 조회 오류:', error);
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  // 위험도 랭킹 데이터 가져오기
  const fetchRiskRankings = async () => {
    try {
      setRiskRankingsLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/ranking');
      if (response.ok) {
        const data = await response.json();
        setRiskRankings(data.riskRankings || []);
      } else {
        console.error('위험도 랭킹 데이터 조회 실패:', response.status);
        setRiskRankings([]);
      }
    } catch (error) {
      console.error('위험도 랭킹 데이터 조회 오류:', error);
      setRiskRankings([]);
    } finally {
      setRiskRankingsLoading(false);
    }
  };

  // 위험도 상세 데이터 가져오기 (지도용)
  const fetchRiskDetailData = async () => {
    try {
      setRiskDetailLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/ranking-detail');
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Dashboard에서 받은 위험도 상세 데이터:', data);
        setRiskDetailData(data.riskRankings || []);
      } else {
        console.error('위험도 상세 데이터 조회 실패:', response.status);
        setRiskDetailData([]);
      }
    } catch (error) {
      console.error('위험도 상세 데이터 조회 오류:', error);
      setRiskDetailData([]);
    } finally {
      setRiskDetailLoading(false);
    }
  };

  // 평균 위험도 점수 가져오기
  const fetchAverageRiskScore = async () => {
    try {
      setAverageRiskLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/average-score');
      if (response.ok) {
        const data = await response.json();
        setAverageRiskScore(data.averageRiskScore || 0);
      } else {
        console.error('평균 위험도 점수 조회 실패:', response.status);
        setAverageRiskScore(0);
      }
    } catch (error) {
      console.error('평균 위험도 점수 조회 오류:', error);
      setAverageRiskScore(0);
    } finally {
      setAverageRiskLoading(false);
    }
  };

  // 시민 신고 통계 가져오기
  const fetchCitizenReportStats = async () => {
    try {
      setCitizenReportLoading(true);
      const response = await fetch('http://localhost:3001/api/complaint/stats');
      if (response.ok) {
        const data = await response.json();
        setCitizenReportStats(data.stats || { completedCount: 0, pendingCount: 0, totalCount: 0 });
      } else {
        console.error('시민 신고 통계 조회 실패:', response.status);
        setCitizenReportStats({ completedCount: 0, pendingCount: 0, totalCount: 0 });
      }
    } catch (error) {
      console.error('시민 신고 통계 조회 오류:', error);
      setCitizenReportStats({ completedCount: 0, pendingCount: 0, totalCount: 0 });
    } finally {
      setCitizenReportLoading(false);
    }
  };

  // 도로 공사 통계 가져오기
  const fetchRoadConstructionStats = async () => {
    try {
      setRoadConstructionLoading(true);
      const response = await fetch('http://localhost:3001/api/construction/stats');
      if (response.ok) {
        const data = await response.json();
        setRoadConstructionStats(data.stats || { completedCount: 0, inProgressCount: 0, totalCount: 0 });
      } else {
        console.error('도로 공사 통계 조회 실패:', response.status);
        setRoadConstructionStats({ completedCount: 0, inProgressCount: 0, totalCount: 0 });
      }
    } catch (error) {
      console.error('도로 공사 통계 조회 오류:', error);
      setRoadConstructionStats({ completedCount: 0, inProgressCount: 0, totalCount: 0 });
    } finally {
      setRoadConstructionLoading(false);
    }
  };

  // 연도별 비교 데이터 가져오기
  const fetchYearOverYearData = async () => {
    try {
      setYearOverYearLoading(true);
      const response = await fetch('http://localhost:3001/api/comparison/yearly');
      if (response.ok) {
        const data = await response.json();
        setYearOverYearData(data);
      } else {
        console.error('연도별 비교 데이터 조회 실패:', response.status);
        setYearOverYearData(null);
      }
    } catch (error) {
      console.error('연도별 비교 데이터 조회 오류:', error);
      setYearOverYearData(null);
    } finally {
      setYearOverYearLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>도로시(SEE) 관리 시스템</h1>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Weather Display */}
        <div className="weather-section">
          <WeatherDisplay />
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>실시간 알림</h3>
            <p>{alertsLoading ? '로딩 중...' : alerts.length}건</p>
          </div>
          <div className="stat-card">
            <h3>평균 위험도</h3>
            <p>{averageRiskLoading ? '로딩 중...' : averageRiskScore.toFixed(1)}점</p>
          </div>
          <div className="stat-card">
            <h3>시민 신고</h3>
            <p>{citizenReportLoading ? '로딩 중...' : citizenReportStats.totalCount}건</p>
          </div>
          <div className="stat-card">
            <h3>도로 공사</h3>
            <p>{roadConstructionLoading ? '로딩 중...' : roadConstructionStats.totalCount}건</p>
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <NaverMap />
        </div>

        {/* Risk Rankings */}
        <div className="risk-rankings">
          <h3>위험도 랭킹</h3>
          {riskRankingsLoading ? (
            <p>로딩 중...</p>
          ) : (
            <ul>
              {riskRankings.slice(0, 5).map((item: any, index: number) => (
                <li key={index}>
                  {index + 1}. {item.location} - {item.riskScore}점
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <Modals
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          markerType={selectedMarkerType}
          markerData={selectedMarkerData}
        />
      )}
    </div>
  );
};

export default Dashboard;
