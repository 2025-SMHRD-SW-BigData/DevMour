import React from 'react';
import html2pdf from 'html2pdf.js';
import './ReportPreview.css';

const ReportPreview = ({ isOpen, onClose, reportData }) => {
  if (!isOpen) return null;

  // 기본 데이터 (실제 데이터가 없을 때 사용)
  const defaultData = {
    cctvId: 'CCTV-001',
    location: '광주광역시 서구 무등로 123',
    riskLevel: '위험',
    agency: '경찰청',
    date: '2025년 8월 26일',
    time: '오후 06:13',
    department: '도로관리과',
    author: '홍길동',
    position: '대리',
    description: '무등로 123번지 좌측 차선에 포트홀이 확인되었습니다. 구멍의 크기는 직경 약 45cm, 깊이 7cm 정도입니다. CCTV로 감지된 포트홀로 인한 교통 정체 우려가 있습니다.',
    riskScore: 85
  };

  const data = reportData || defaultData;

  // PDF 다운로드 함수
  const downloadPDF = () => {
    // PDF로 변환할 HTML 요소 생성
    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = `
      <div style="font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; padding: 30px; max-width: 800px; background: white; color: #333;">
        <!-- 제목 -->
        <h1 style="text-align: left; color: #1e40af; font-size: 28px; font-weight: bold; margin: 0 0 40px 0; padding-bottom: 15px; border-bottom: 3px solid #e5e7eb;">
          도로상태 긴급보고서
        </h1>
        
        <!-- 연락처 정보 (오른쪽 상단) -->
        <div style="position: absolute; top: 40px; right: 40px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 2px solid #e2e8f0; min-width: 220px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #374151;">담당:</span>
            <span style="color: #1f2937;">${data.author}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #374151;">이메일:</span>
            <span style="color: #1f2937;">hong@gwangju.go.kr</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #374151;">전화번호:</span>
            <span style="color: #1f2937;">010-1234-5678</span>
          </div>
        </div>
        
        <!-- 기본 정보 테이블 -->
        <div style="margin-top: 80px; margin-bottom: 40px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <!-- 첫 번째 열 -->
            <div style="padding: 20px; background: #f9fafb; border-right: 2px solid #e5e7eb;">
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">CCTV_ID:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.cctvId}</div>
              </div>
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">설치장소:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.location}</div>
              </div>
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">위험도:</div>
                <div style="color: #dc2626; font-size: 16px; font-weight: 600;">${data.riskLevel}</div>
              </div>
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">보고 기관:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.agency}</div>
              </div>
            </div>
            
            <!-- 두 번째 열 -->
            <div style="padding: 20px; background: #f9fafb;">
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">발생일자:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.date}</div>
              </div>
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">발생시간:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.time}</div>
              </div>
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">부서:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.department}</div>
              </div>
              <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d1d5db;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">작성일:</div>
                <div style="color: #1f2937; font-size: 16px;">08.20</div>
              </div>
            </div>
          </div>
          
          <!-- 작성자 정보 -->
          <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              <div>
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">작성자:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.author}</div>
              </div>
              <div>
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">직급:</div>
                <div style="color: #1f2937; font-size: 16px;">${data.position}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 구분선 -->
        <hr style="border: none; height: 3px; background: linear-gradient(to right, #1e40af, #3b82f6, #1e40af); margin: 40px 0; border-radius: 2px;">
        
        <!-- 도로상태 내용 -->
        <div style="margin-bottom: 40px;">
          <h3 style="color: #dc2626; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 4px solid #dc2626;">
            도로상태 내용
          </h3>
          <div style="background: #fef2f2; padding: 25px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">${data.description}</p>
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">추가 관찰 결과, 주변 도로 상태는 양호하며 배수로도 정상 작동합니다.</p>
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">교통량 분석 결과, 평균 시간당 120대, 피크 시간 180대의 통행량을 보입니다.</p>
            <p style="line-height: 1.8; margin: 0; color: #1f2937;">도로 표면은 아스팔트 노후화가 진행 중이며 균열이 발생했습니다.</p>
          </div>
        </div>
        
        <!-- 위험도 분석 -->
        <div style="margin-bottom: 40px;">
          <h3 style="color: #059669; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 4px solid #059669;">
            위험도 분석
          </h3>
          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #059669;">
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">종합 위험도: <strong style="color: #dc2626; font-size: 18px;">${data.riskScore}점</strong> (<strong style="color: #dc2626;">${data.riskLevel}</strong>)</p>
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">감지된 손상: 포트홀 2개, 악어등 균열 1개</p>
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">야간 가시성 저하로 사고 가능성 증가</p>
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">AI 신뢰도: <strong style="color: #059669;">94.2%</strong></p>
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">기상 조건으로는 우천 시 배수로 기능 저하가 우려됩니다</p>
            <p style="line-height: 1.8; margin: 0 0 15px 0; color: #1f2937;">주변 환경으로는 가로등 3개 중 1개가 불량하여 야간 가시성이 저하됩니다</p>
            <p style="line-height: 1.8; margin: 0; color: #1f2937;">교통 안전 측면에서는 급커브 구간으로 인한 추가 위협 요소가 있습니다</p>
          </div>
        </div>
        
        <!-- 권장 조치사항 -->
        <div style="margin-bottom: 40px;">
          <h3 style="color: #7c3aed; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 4px solid #7c3aed;">
            권장 조치사항
          </h3>
          <div style="background: #faf5ff; padding: 25px; border-radius: 8px; border-left: 4px solid #7c3aed;">
            <ul style="line-height: 1.8; padding-left: 25px; margin: 0; color: #1f2937;">
              <li style="margin-bottom: 12px;">우선순위: <strong style="color: #dc2626;">1순위</strong></li>
              <li style="margin-bottom: 12px;">즉시 보수 필요 (24시간 내)</li>
              <li style="margin-bottom: 12px;">관할 유지보수팀 현장 출동 요청</li>
              <li style="margin-bottom: 12px;">임시 안전 표지판 및 차량 감속 유도 조치 필요</li>
              <li style="margin-bottom: 12px;">보수 완료 후 48시간 이내 재점검 실시</li>
              <li style="margin-bottom: 12px;">가로등 수리 및 야간 조명 강화 필요</li>
              <li>도로 표면 전면 재포장 검토 및 계획 수립 필요</li>
            </ul>
          </div>
        </div>
        
        <!-- 첨부파일 -->
        <div style="margin-bottom: 40px; padding: 20px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px;">
          <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">첨부파일</h4>
          <p style="margin: 0; color: #1f2937;">cctv 이미지 영상.jpg</p>
        </div>
        
        <!-- 구분선 -->
        <hr style="border: none; height: 3px; background: linear-gradient(to right, #1e40af, #3b82f6, #1e40af); margin: 40px 0; border-radius: 2px;">
        
        <!-- 하단 정보 -->
        <div style="margin-top: 30px; text-align: center;">
          <p style="margin-bottom: 15px; color: #1f2937; font-size: 16px;">위와 같이 도로상태에 대한 결과를 보고합니다.</p>
          <p style="margin-bottom: 20px; color: #1f2937; font-size: 16px;">2025년 8월 20일</p>
          <p style="margin-bottom: 25px; color: #1f2937; font-size: 16px;"><strong>작성자: ${data.author}_(인)</strong></p>
          <p style="color: #1e40af; font-size: 18px; font-weight: 600;">광주시 도로관리과</p>
        </div>
      </div>
    `;
    
    // PDF 옵션 설정
    const opt = {
      margin: 15,
      filename: `도로상태_긴급보고서_${String(data.cctvId)}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // PDF 생성 및 다운로드
    html2pdf().set(opt).from(pdfContent).save();
  };

  return (
    <div className="report-preview-overlay">
      <div className="report-preview-window">
        {/* 제목 바 */}
        <div className="report-preview-titlebar">
          <div className="report-preview-title">도로상태 긴급보고서 미리보기</div>
          <div className="report-preview-controls">
            <button className="control-btn minimize">─</button>
            <button className="control-btn maximize">□</button>
            <button className="control-btn close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* 툴바 */}
        <div className="report-preview-toolbar">
          <div className="toolbar-left">
            <button className="toolbar-btn">📋</button>
            <button className="toolbar-btn">▼</button>
          </div>
          <div className="toolbar-center">
            <button className="toolbar-btn">🔍-</button>
            <button className="toolbar-btn">🔍+</button>
            <span className="page-info">1 of 1</span>
          </div>
          <div className="toolbar-right">
            <button className="toolbar-btn">🖨️</button>
            <button className="toolbar-btn">⬇️</button>
            <button className="toolbar-btn">⋯</button>
          </div>
        </div>

        {/* 보고서 내용 */}
        <div className="report-preview-content">
          {/* 메인 제목 및 연락처 */}
          <div className="report-header">
            <h1 className="report-main-title">도로상태 긴급보고서</h1>
            <div className="contact-info">
              <div className="contact-item">
                <strong>담당:</strong> {data.author}
              </div>
              <div className="contact-item">
                <strong>이메일:</strong> hong@gwangju.go.kr
              </div>
              <div className="contact-item">
                <strong>전화번호:</strong> 010-1234-5678
              </div>
            </div>
          </div>

          {/* 보고서 상세 정보 */}
          <div className="report-details">
            <div className="detail-row">
              <span className="detail-label">CCTV_ID:</span>
              <span className="detail-value">{data.cctvId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">설치장소:</span>
              <span className="detail-value">{data.location}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">위험도:</span>
              <span className="detail-value risk-danger">{data.riskLevel}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">보고 기관:</span>
              <span className="detail-value">{data.agency}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">발생일자:</span>
              <span className="detail-value">{data.date}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">발생시간:</span>
              <span className="detail-value">{data.time}</span>
            </div>
          </div>

          {/* 작성자 정보 */}
          <div className="author-info">
            <div className="author-row">
              <span className="author-label">부서:</span>
              <span className="author-value">{data.department}</span>
            </div>
            <div className="author-row">
              <span className="author-label">작성일:</span>
              <span className="author-value">08. 26.</span>
            </div>
            <div className="author-row">
              <span className="author-label">작성자:</span>
              <span className="author-value">{data.author}</span>
            </div>
            <div className="author-row">
              <span className="author-label">직급:</span>
              <span className="author-value">{data.position}</span>
            </div>
          </div>

          {/* 도로상태 내용 */}
          <div className="road-condition">
            <h3>도로상태 내용</h3>
            <p>{data.description}</p>
          </div>

          {/* 위험도 분석 */}
          <div className="risk-analysis">
            <h3>위험도 분석</h3>
            <div className="risk-score">
              전체 위험도 점수: <span className="score-value">{data.riskScore}점</span> 
              <span className="risk-level">({data.riskLevel} 수준)</span>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="report-preview-actions">
          <button className="action-btn close-btn" onClick={onClose}>
            닫기
          </button>
          <button className="action-btn download-btn" onClick={downloadPDF}>
            📄 PDF 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
