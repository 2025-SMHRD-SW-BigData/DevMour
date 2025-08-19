import React from 'react';
import './CCTVModal.css';
import { FaFilePdf, FaTruck, FaShare, FaExclamationTriangle, FaRobot, FaSearch } from 'react-icons/fa';

const CCTVModal = ({ isOpen, onClose }) => {
  // 모달이 닫혀있으면 아무것도 렌더링하지 않습니다.
  if (!isOpen) {
    return null;
  }

  // 보고서 생성, 현장팀 출동 요청, 관련 부서 공유 버튼 클릭 이벤트 핸들러
  const handleButtonClick = (action) => {
    alert(`'${action}' 버튼이 클릭되었습니다.`);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>CCTV 실시간 영상</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <div className="cctv-feed">
            <div className="feed-overlay">LIVE</div>
            <video autoPlay muted loop>
              <source src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAs1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCA0ZmU3ZGY3IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4Mzpw" type="video/mp4"/>
            </video>
          </div>
          
          <div className="analysis-results">
            <div className="analysis-card">
              <h4><FaRobot /> AI 분석 결과</h4>
              <div className="risk-score">
                <div className="risk-gauge">
                  <div className="risk-value">85</div>
                </div>
                <strong>위험도 점수</strong>
              </div>
            </div>
            
            <div className="analysis-card">
              <h4><FaSearch /> 감지된 손상</h4>
              <div className="detections">
                <div className="detection-item">
                  <span>포트홀</span>
                  <strong>2개</strong>
                </div>
                <div className="detection-item">
                  <span>악어등 균열</span>
                  <strong>1개</strong>
                </div>
                <div className="detection-item">
                  <span>종방향 균열</span>
                  <strong>3개</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="recommendations-card">
            <h4><FaExclamationTriangle /> 권장 조치사항</h4>
            <ul>
              <li>즉시 조치 필요 (24시간 내)</li>
              <li>교통통제 권장</li>
              <li>예상 복구비용: 250만원</li>
              <li>우선순위: 1순위</li>
            </ul>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={() => handleButtonClick('긴급 보고서 생성')}>
            <FaFilePdf /> 긴급 보고서 생성
          </button>
          <button className="btn btn-warning" onClick={() => handleButtonClick('현장팀 출동 요청')}>
            <FaTruck /> 현장팀 출동 요청
          </button>
          <button className="btn btn-success" onClick={() => handleButtonClick('관련 부서 공유')}>
            <FaShare /> 관련 부서 공유
          </button>
        </div>
      </div>
    </div>
  );
};

export default CCTVModal;
