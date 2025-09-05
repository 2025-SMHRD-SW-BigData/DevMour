import React from 'react';
import html2pdf from 'html2pdf.js';
import './ReportPreview.css';

const ReportPreview = ({ isOpen, onClose, reportData }) => {
  console.log('🔍 ReportPreview 컴포넌트 렌더링됨');
  console.log('🔍 isOpen:', isOpen);
  console.log('🔍 reportData:', reportData);
  
     // 기본 데이터 (실제 데이터가 없을 때 사용)
   const defaultData = {
     cctvId: 'CCTV-001',
     location: '광주광역시 서구 무등로 123',
     riskLevel: '위험',
     agency: '경찰청',
     date: new Date().toLocaleDateString('ko-KR', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric' 
     }),
     time: new Date().toLocaleTimeString('ko-KR', { 
       hour: '2-digit', 
       minute: '2-digit' 
     }),
     department: '도로관리과',
     author: '홍길동',
     phone: '010-1234-5678',
     position: '대리',
     description: '무등로 123번지 좌측 차선에 포트홀이 확인되었습니다. 구멍의 크기는 직경 약 45cm, 깊이 7cm 정도입니다. CCTV로 감지된 포트홀로 인한 교통 정체 우려가 있습니다.',
     totalScore: 85,
     breakCnt: 2,
     aliCrackCnt: 1,
     weatherScore: 75,
     roadScore: 82
   };

  const data = reportData || defaultData;
  
  // 도로 이름 추출 함수 - 상단 제목에서 CCTV 위치명 추출
  const getRoadName = () => {
    // reportData에서 CCTV 위치명을 가져오거나, 기본값 사용
    let title = "CCTV 모니터링 - 평동산단4번로사거리"; // 기본값
    
    // reportData에 cctvLocation이나 title 필드가 있다면 사용
    if (data.cctvLocation) {
      title = data.cctvLocation;
    } else if (data.title) {
      title = data.title;
    } else if (data.location && data.location.includes('CCTV 모니터링 - ')) {
      // location 필드에 CCTV 모니터링 정보가 있다면 사용
      title = data.location;
    } else if (data.cctvName) {
      // cctvName 필드가 있다면 사용
      title = `CCTV 모니터링 - ${data.cctvName}`;
    } else if (data.cctv_name) {
      // cctv_name 필드가 있다면 사용 (Modals.jsx와 일치)
      title = `CCTV 모니터링 - ${data.cctv_name}`;
    }
    
    if (title.includes('CCTV 모니터링 - ')) {
      return title.replace('CCTV 모니터링 - ', '');
    }
    return '도로';
  };
  
  const roadName = getRoadName();
  
  console.log('🔍 ReportPreview 데이터 확인:');
  console.log('🔍 reportData:', reportData);
  console.log('🔍 defaultData:', defaultData);
  console.log('🔍 최종 사용 데이터:', data);

  // PDF 다운로드 함수
  const downloadPDF = () => {
    // PDF로 변환할 HTML 요소 생성
    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = `
      <div style="font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; padding: 15px; max-width: 800px; background: white; color: #333;">
        <!-- 제목 -->
        <div style="margin: 0 0 20px 0;">
          <h1 style="text-align: left; color: #1e40af; font-size: 24px; font-weight: bold; margin: 0; line-height: 1.2;">
            도로상태<br>긴급보고서
          </h1>
          <div style="width: 240px; height: 3px; background: #e5e7eb; margin-top: 10px;"></div>
        </div>
        
        <!-- 연락처 정보 (오른쪽 상단) -->
        <div style="position: absolute; top: 25px; right: 25px; min-width: 180px;">
          <div style="margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #374151; font-size: 12px;">담당:</span>
            <span style="color: #1f2937; font-size: 12px;">${data.author}</span>
          </div>
          <div style="margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #374151; font-size: 12px;">이메일:</span>
            <span style="color: #1f2937; font-size: 12px;">hong@gwangju.go.kr</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: #374151; font-size: 12px;">전화번호:</span>
            <span style="color: #1f2937; font-size: 12px;">${data.phone}</span>
          </div>
        </div>
        
        <!-- 기본 정보 테이블 (표 형태) -->
        <div style="margin-top: 30px; margin-bottom: 15px;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <tbody>
              <tr>
                <td style="padding: 10px 14px; border-right: 2px solid #e5e7eb; border-bottom: 1px solid #d1d5db; width: 50%;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">CCTV_ID:</span>
                    <span style="color: #1f2937; font-size: 14px;">${data.cctvId}</span>
                  </div>
                </td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #d1d5db; width: 50%;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">설치장소:</span>
                    <span style="color: #1f2937; font-size: 14px;">${data.location}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-right: 2px solid #e5e7eb; border-bottom: 1px solid #d1d5db;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">위험도:</span>
                    <span style="color: #dc2626; font-size: 14px; font-weight: 600;">${data.riskLevel}</span>
                  </div>
                </td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #d1d5db;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">보고 기관:</span>
                    <span style="color: #1f2937; font-size: 14px;">${data.agency}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-right: 2px solid #e5e7eb;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">발생일자:</span>
                    <span style="color: #1f2937; font-size: 14px;">${data.date}</span>
                  </div>
                </td>
                <td style="padding: 10px 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">발생시간:</span>
                    <span style="color: #1f2937; font-size: 14px;">${data.time}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- 작성자 정보 테이블 -->
          <table style="width: 100%; margin-top: 12px; border-collapse: collapse; border: 2px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <tbody>
              <tr>
                <td style="padding: 10px 14px; border-right: 1px solid #d1d5db; width: 25%;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">부서:</span>
                    <span style="color: #1f2937; font-size: 14px;">${data.department}</span>
                  </div>
                </td>
                                 <td style="padding: 10px 14px; border-right: 1px solid #d1d5db; width: 25%;">
                   <div style="display: flex; justify-content: space-between; align-items: center;">
                     <span style="font-weight: 600; color: #374151; font-size: 12px;">작성일:</span>
                     <span style="color: #1f2937; font-size: 14px;">${data.date}</span>
                   </div>
                 </td>
                <td style="padding: 10px 14px; border-right: 1px solid #d1d5db; width: 25%;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #374151; font-size: 12px;">작성자:</span>
                    <span style="color: #1f2937; font-size: 14px;">${data.author}</span>
                  </div>
                </td>
                
              </tr>
            </tbody>
          </table>
        </div>

                                   <!-- 구분선 -->
          <hr style="border: none; height: 2px; background: #d1d5db; margin: 25px 0 15px 0;" />

        <!-- 도로상태 내용 -->
        <div style="margin-bottom: 12px;">
          <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
            도로상태 내용
          </h3>
          <ul style="line-height: 1.3; padding-left: 16px; margin: 0; color: #1f2937; font-size: 12px;">
            <li style="margin-bottom: 4px;">${data.description}</li>
            <li style="margin-bottom: 4px;">추가 관찰 결과, 주변 도로 상태는 양호하며 배수로도 정상 작동합니다.</li>
            <li style="margin-bottom: 4px;">교통량 분석 결과, 평균 시간당 120대, 피크 시간 180대의 통행량을 보입니다.</li>
            <li>도로 표면은 아스팔트 노후화가 진행 중이며 균열이 발생했습니다.</li>
          </ul>
        </div>

        <!-- 구분선 -->
        <hr style="border: none; height: 2px; background: #d1d5db; margin: 12px 0;" />

        <!-- 위험도 분석 -->
        <div style="margin-bottom: 12px;">
          <h3 style="color: #059669; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
            위험도 분석
          </h3>
                     <ul style="line-height: 1.3; padding-left: 16px; margin: 0; color: #1f2937; font-size: 12px;">
                           <li style="margin-bottom: 4px;">종합 점수: <strong style="color: #dc2626;">${data.totalScore}점</strong></li>
             <li style="margin-bottom: 4px;">감지된 손상: 포트홀 ${data.breakCnt}개, 거북등 균열 ${data.aliCrackCnt}개</li>
             <li style="margin-bottom: 4px;">날씨점수: <strong style="color: #059669;">${data.weatherScore}점</strong></li>
             <li style="margin-bottom: 4px;">도로점수: <strong style="color: #059669;">${data.roadScore}점</strong></li>
                           <li style="margin-bottom: 4px;">기상 조건으로는 우천 시 배수로 기능 저하가 우려됩니다</li>
              <li>교통 안전 측면에서는 급커브 구간으로 인한 추가 위협 요소가 있습니다</li>
           </ul>
        </div>

        <!-- 구분선 -->
        <hr style="border: none; height: 2px; background: #d1d5db; margin: 12px 0;" />

        <!-- 권장 조치사항 -->
        <div style="margin-bottom: 12px;">
          <h3 style="color: #7c3aed; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
            권장 조치사항
          </h3>
                                <ul style="line-height: 1.3; padding-left: 16px; margin: 0; color: #1f2937; font-size: 12px;">
             <li style="margin-bottom: 4px;">관할 유지보수팀 현장 출동 요청</li>
            <li style="margin-bottom: 4px;">임시 안전 표지판 및 차량 감속 유도 조치 필요</li>
                         <li style="margin-bottom: 4px;">보수 완료 후 48시간 이내 재점검 실시</li>
             <li>도로 표면 전면 재포장 검토 및 계획 수립 필요</li>
          </ul>
        </div>

                 <!-- 구분선 -->
        <hr style="border: none; height: 2px; background: #d1d5db; margin: 12px 0;" />

                                                                       <!-- 하단 정보 -->
                     <div style="margin-top: 30px;">
                                     <p style="margin-bottom: 40px; color: #1f2937; font-size: 14px;">위와 같이 <span style="color: #1e40af; font-weight: 600;">${roadName}</span> 도로상태에 대한 결과를 보고합니다.</p>
             <p style="margin-bottom: 15px; color: #1f2937; font-size: 16px;">${data.date}</p>
                          <p style="margin-bottom: 15px; color: #1f2937; font-size: 16px;"><strong>작성자: ${data.author}_(인)</strong></p>
                         <p style="color: #1e40af; font-size: 18px; font-weight: 600; text-align: right;">광주시 도로관리과</p>
          </div>
      </div>
    `;
    
    // PDF 옵션 설정
    const opt = {
      margin: 10,
      filename: `도로상태_긴급보고서_${String(data.cctvId)}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // PDF 생성 및 다운로드
    html2pdf().set(opt).from(pdfContent).save();
  };

  return (
    <>
      {console.log('🔍 return 문 실행됨, isOpen:', isOpen)}
      {isOpen && (
        <>
          {console.log('🔍 isOpen이 true이므로 모달 렌더링')}
          <div className="report-preview-overlay">
            {console.log('🔍 모달 오버레이 렌더링')}
            <div className="report-preview-window">
              {/* 제목 바 */}
              <div className="report-preview-titlebar">
                <div className="report-preview-title">도로상태 긴급보고서 미리보기</div>
                <div className="report-preview-controls">
                  <button className="control-btn close" onClick={onClose}>✕</button>
                </div>
              </div>

              {/* 툴바 */}
              <div className="report-preview-toolbar">
                <div className="toolbar-left">
                </div>
                <div className="toolbar-center">
                </div>
                <div className="toolbar-right">
                  <button className="toolbar-btn" onClick={downloadPDF}>⬇️</button>
                </div>
              </div>

              {/* 보고서 내용 */}
              <div className="report-preview-content">
                {console.log('🔍 보고서 내용 렌더링 시작')}
                {/* 보고서 헤더 */}
                <div className="report-header">
                  <h1 style={{ textAlign: 'left', color: '#1e40af', fontSize: '24px', fontWeight: 'bold', margin: 0, lineHeight: '1.2' }}>
                    도로상태<br />긴급보고서
                  </h1>
                  <div style={{ width: '240px', height: '3px', background: '#e5e7eb', marginTop: '10px' }}></div>
                  <div className="contact-info">
                    <div className="contact-item">
                      <strong>담당:</strong> {data?.author}
                    </div>
                    <div className="contact-item">
                      <strong>이메일:</strong> hong@gwangju.go.kr
                    </div>
                    <div className="contact-item">
                      <strong>전화번호:</strong> {data?.phone}
                    </div>
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="report-details">
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '15px', background: 'white', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px 14px', borderRight: '2px solid #e5e7eb', borderBottom: '1px solid #d1d5db', width: '50%', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>CCTV_ID:</span>
                            <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.cctvId}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #d1d5db', width: '50%', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>설치장소:</span>
                            <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.location}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 14px', borderRight: '2px solid #e5e7eb', borderBottom: '1px solid #d1d5db', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>위험도:</span>
                            <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>{data?.riskLevel}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #d1d5db', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>보고 기관:</span>
                            <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.agency}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 14px', borderRight: '2px solid #e5e7eb', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>발생일자:</span>
                            <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.date}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>발생시간:</span>
                            <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.time}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 작성자 정보 */}
                <div className="author-info">
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', background: 'white', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px 14px', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', width: '25%', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>부서:</span>
                            <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.department}</span>
                          </div>
                        </td>
                                         <td style={{ padding: '10px 14px', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', width: '25%', background: 'white' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>작성일:</span>
                             <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.date}</span>
                           </div>
                         </td>
                        <td style={{ padding: '10px 14px', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', width: '25%', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '12px' }}>작성자:</span>
                            <span style={{ color: '#1f2937', fontSize: '14px' }}>{data?.author}</span>
                          </div>
                        </td>
                        
                      </tr>
                    </tbody>
                  </table>
                </div>

                                 {/* 구분선 */}
                 <hr style={{ border: 'none', height: '2px', background: '#d1d5db', margin: '50px 0 15px 0' }} />

                {/* 도로상태 내용 */}
                <div className="road-condition">
                  <h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>도로상태 내용</h3>
                                     <ul style={{ lineHeight: '1.3', paddingLeft: '16px', margin: 0, color: '#1f2937', fontSize: '12px' }}>
                     <li style={{ marginBottom: '4px' }}>추가 관찰 결과, 주변 도로 상태는 양호하며 배수로도 정상 작동합니다.</li>
                    <li style={{ marginBottom: '4px' }}>교통량 분석 결과, 평균 시간당 120대, 피크 시간 180대의 통행량을 보입니다.</li>
                    <li>도로 표면은 아스팔트 노후화가 진행 중이며 균열이 발생했습니다.</li>
                  </ul>
                </div>

                {/* 구분선 */}
                <hr style={{ border: 'none', height: '2px', background: '#d1d5db', margin: '12px 0' }} />

                {/* 위험도 분석 */}
                <div className="risk-analysis">
                  <h3 style={{ color: '#059669', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>위험도 분석</h3>
                                     <ul style={{ lineHeight: '1.3', paddingLeft: '16px', margin: 0, color: '#1f2937', fontSize: '12px' }}>
                     <li style={{ marginBottom: '4px' }}>종합 점수: <strong style={{ color: '#dc2626' }}>{data?.totalScore}점</strong></li>
                     <li style={{ marginBottom: '4px' }}>감지된 손상: 포트홀 {data?.breakCnt}개, 거북등 균열 {data?.aliCrackCnt}개</li>
                     <li style={{ marginBottom: '4px' }}>날씨점수: <strong style={{ color: '#059669' }}>{data?.weatherScore}점</strong></li>
                     <li style={{ marginBottom: '4px' }}>도로점수: <strong style={{ color: '#059669' }}>{data?.roadScore}점</strong></li>
                                           <li style={{ marginBottom: '4px' }}>기상 조건으로는 우천 시 배수로 기능 저하가 우려됩니다</li>
                      <li>교통 안전 측면에서는 급커브 구간으로 인한 추가 위협 요소가 있습니다</li>
                   </ul>
                </div>

                {/* 구분선 */}
                <hr style={{ border: 'none', height: '2px', background: '#d1d5db', margin: '12px 0' }} />

                {/* 권장 조치사항 */}
                <div className="recommended-actions">
                  <h3 style={{ color: '#7c3aed', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>권장 조치사항</h3>
                                                        <ul style={{ lineHeight: '1.3', paddingLeft: '16px', margin: 0, color: '#1f2937', fontSize: '12px' }}>
                     <li style={{ marginBottom: '4px' }}>관할 유지보수팀 현장 출동 요청</li>
                    <li style={{ marginBottom: '4px' }}>임시 안전 표지판 및 차량 감속 유도 조치 필요</li>
                                         <li style={{ marginBottom: '4px' }}>보수 완료 후 48시간 이내 재점검 실시</li>
                     <li>도로 표면 전면 재포장 검토 및 계획 수립 필요</li>
                  </ul>
                </div>

                                 {/* 구분선 */}
                <hr style={{ border: 'none', height: '2px', background: '#d1d5db', margin: '12px 0' }} />

                                 {/* 하단 정보 */}
                                   <div className="report-footer" style={{ marginTop: '50px' }}>
                                                           <p style={{ marginBottom: '80px', color: '#1f2937', fontSize: '16px' }}>위와 같이 <span style={{ color: '#1e40af', fontWeight: '600' }}>{roadName}</span> 도로상태에 대한 결과를 보고합니다.</p>
                     <p style={{ marginBottom: '6px', color: '#1f2937', fontSize: '16px' }}>2025년 8월 20일</p>
                    <p style={{ marginBottom: '6px', color: '#1f2937', fontSize: '16px' }}><strong>작성자: {data?.author}_(인)</strong></p>
                    <p style={{ color: '#1e40af', fontSize: '18px', fontWeight: '600', textAlign: 'right' }}>광주시 도로관리과</p>
                 </div>
                {console.log('🔍 보고서 내용 렌더링 완료')}
              </div>

              {/* 하단 액션 버튼 */}
              <div className="report-preview-actions">
                <button className="action-btn close-btn" onClick={onClose}>
                  닫기
                </button>
                <button className="action-btn download-btn" onClick={downloadPDF}>
                  PDF 다운로드
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {console.log('🔍 컴포넌트 렌더링 완료')}
    </>
  );
};

export default ReportPreview;
