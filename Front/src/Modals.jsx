import React, { useState, useEffect, useContext } from 'react';
import ReportPreview from './components/ReportPreview';
import './Modal.css';
import { getUser } from './utils/auth';
import { getComplaintAnalysisResult, getComplaintFloodResult  } from './utils/api';
import { InfoContext } from './context/InfoContext';

// CCTV AI 분석 함수
const performCCTVAnalysis = async (cctvData) => {
    try {
        console.log('🔍 CCTV AI 분석 시작:', cctvData);

        // CCTV 정보를 Python AI 서버로 전송
//        const aiServerUrl =  'http://218.149.60.128:8000';
// import.meta.env.VITE_AI_SERVER_URL || 'http://0.0.0.0:8000';
// 'http://localhost:8000'
        const response = await fetch('/api/analyze-cctv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cctv_idx: cctvData.cctv_idx || cctvData.control_idx, // cctv_idx 또는 control_idx 사용
                cctv_url: cctvData.cctv_url,
                cctv_name: cctvData.cctv_name,
                lat: cctvData.lat,
                lon: cctvData.lon || cctvData.lng,
                analysis_type: 'cctv_realtime'
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ AI 분석 완료:', result);

            // 분석 결과를 상태에 저장하여 UI에 표시
            return result;
        } else {
            console.error('AI 분석 실패:', response.status);
            throw new Error(`AI 분석 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('AI 분석 오류:', error);
        throw error;
    }
};

// 침수 분석 함수
const performFloodAnalysis = async (cctvData) => {
    try {
        console.log('🌊 침수 분석 시작:', cctvData);

        // CCTV 정보를 침수 분석 서버로 전송
//        const floodServerUrl = 'http://218.149.60.128:8002'
// 'http://localhost:8002' 
// import.meta.env.VITE_FLOOD_SERVER_URL || 'http://0.0.0.0:8002';
//        const response = await fetch(`${floodServerUrl}/api/analyze-flood`, {
      const response = await fetch('/api/analyze-flood', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cctv_idx: cctvData.cctv_idx || cctvData.control_idx,
                cctv_url: cctvData.cctv_url,
                lat: cctvData.lat,
                lon: cctvData.lon || cctvData.lng
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ 침수 분석 완료:', result);
            return result;
        } else {
            console.error('침수 분석 실패:', response.status);
            throw new Error(`침수 분석 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('침수 분석 오류:', error);
        throw error;
    }
};

// 시민 제보 이미지 침수 분석 함수
const performComplaintFloodAnalysis = async (complaintData) => {
    try {
        console.log('🌊 시민 제보 이미지 침수 분석 시작:', complaintData);

        if (!complaintData.c_report_file1) {
            throw new Error('분석할 이미지가 없습니다.');
        }

        // 시민 제보 이미지 정보를 침수 분석 서버로 전송
//        const response = await fetch('http://218.149.60.128:8002/api/analyze-complaint-flood', {
        const response = await fetch('/api/analyze-complaint-flood', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                c_report_idx: complaintData.c_report_idx,
                image_url: complaintData.c_report_file1,
                lat: complaintData.lat,
                lon: complaintData.lon,
                c_report_detail: complaintData.c_report_detail,
                c_reporter_name: complaintData.c_reporter_name,
                c_reporter_phone: complaintData.c_reporter_phone,
                analysis_type: 'complaint_flood'
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ 침수 분석 완료:', result);
            return result;
        } else {
            console.error('침수 분석 실패:', response.status);
            throw new Error(`침수 분석 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('침수 분석 오류:', error);
        throw error;
    }
};

// 시민 제보 이미지 분석 함수
const performComplaintImageAnalysis = async (complaintData) => {
    try {
        console.log('📸 시민 제보 이미지 AI 분석 시작:', complaintData);

        if (!complaintData.c_report_file1) {
            throw new Error('분석할 이미지가 없습니다.');
        }

        // 시민 제보 이미지 정보를 Python AI 서버로 전송
      //  const response = await fetch('http://218.149.60.128:8000/api/analyze-complaint-image', {
        const response = await fetch('/api/analyze-complaint-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                c_report_idx: complaintData.c_report_idx,
                image_url: complaintData.c_report_file1,
                lat: complaintData.lat,
                lon: complaintData.lon,
                c_report_detail: complaintData.c_report_detail,
                c_reporter_name: complaintData.c_reporter_name,
                c_reporter_phone: complaintData.c_reporter_phone,
                analysis_type: 'complaint_image'
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ 시민 제보 이미지 AI 분석 완료:', result);
            return result;
        } else {
            console.error('시민 제보 이미지 AI 분석 실패:', response.status);
            throw new Error(`시민 제보 이미지 AI 분석 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('시민 제보 이미지 AI 분석 오류:', error);
        throw error;
    }
};


const Modals = ({ isOpen, onClose, markerType, markerData, isEditMode: initialEditMode = false, onUpdateComplete }) => {
    const { citizenReportData } = useContext(InfoContext);
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isEditMode, setIsEditMode] = useState(initialEditMode);
    const [editFormData, setEditFormData] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
    const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
    const [cctvRiskData, setCctvRiskData] = useState(null);
    const [cctvRiskLoading, setCctvRiskLoading] = useState(false);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [floodAnalysisResult, setFloodAnalysisResult] = useState(null);
    const [floodAnalysisLoading, setFloodAnalysisLoading] = useState(false);
    const [complaintAnalysisResult, setComplaintAnalysisResult] = useState(null);
    const [complaintAnalysisLoading, setComplaintAnalysisLoading] = useState(false);
    const [complaintFloodResult, setComplaintFloodResult] = useState(null);
    const [complaintFloodLoading, setComplaintFloodLoading] = useState(false);

    // CCTV 보고서 생성 함수
    const generateCCTVReport = async (markerData) => {
        try {
            console.log('🔍 generateCCTVReport 함수 실행됨');
            console.log('🔍 markerData:', markerData);
            
            // 현재 로그인한 사용자 정보 가져오기
            const currentUser = getUser();
            console.log('🔍 현재 로그인한 사용자:', currentUser);
            
            // 손상 데이터 가져오기 (t_total 테이블에서 cctv_idx 기준 최신 데이터)
            let damageData = { breakCnt: 0, aliCrackCnt: 0, weatherScore: 0, roadScore: 0, totalScore: 0 };
            try {
                console.log('🔍 CCTV 정보:', { cctv_idx: markerData?.cctv_idx });
                
                // CCTV idx를 기준으로 가장 최근 데이터 조회
//                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://0.0.0.0:3001/api';
 //       const response = await fetch(`${apiBaseUrl}/cctv/risk/${markerData?.cctv_idx}`, {

                const response = await fetch(`/api/cctv/risk/${markerData?.cctv_idx}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                console.log('🔍 API 응답 상태:', response.status);
                
                if (response.ok) {
                    const totalData = await response.json();
                    console.log('🔍 서버에서 받은 데이터:', totalData);
                    
                    damageData = {
                        breakCnt: totalData?.break_cnt || 0,
                        aliCrackCnt: totalData?.ali_crack_cnt || 0,
                        weatherScore: totalData?.weather_score || 0,
                        roadScore: totalData?.road_score || 0,
                        totalScore: totalData?.total_score || 0
                    };
                    
                    console.log('🔍 파싱된 손상 데이터:', damageData);
                } else {
                    console.log('❌ API 응답 실패:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.log('❌ 에러 내용:', errorText);
                }
            } catch (error) {
                console.log('❌ 손상 데이터 조회 실패, 기본값 사용:', error);
                console.log('❌ 에러 상세:', error.message);
            }
            
            // 보고서 데이터 준비
            const reportData = {
                cctvId: markerData?.cctv_idx || 'CCTV-001',
                location: markerData?.name || '광주공항사거리',
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
                department: currentUser?.dept_addr || '도로관리과',
                author: currentUser?.admin_name || '관리자',
                phone: currentUser?.admin_phone || '010-1234-5678',
                position: '대리',
                description: `${markerData?.name || 'CCTV'}에서 도로상태 이상이 감지되었습니다. 즉시 현장 확인 및 조치가 필요합니다.`,
                totalScore: damageData.totalScore,
                breakCnt: damageData.breakCnt,
                aliCrackCnt: damageData.aliCrackCnt,
                weatherScore: damageData.weatherScore,
                roadScore: damageData.roadScore,
                cctv_name: markerData?.name || 'CCTV' // CCTV 이름 추가
            };

            console.log('🔍 준비된 reportData:', reportData);
            console.log('🔍 showReportPreview 상태 변경 전:', showReportPreview);

            // 미리보기 창 표시
            setReportData(reportData);
            setShowReportPreview(true);
            
            console.log('🔍 showReportPreview 상태 변경 후:', true);
            console.log('🔍 reportData 상태 변경 후:', reportData);
            
        } catch (error) {
            console.error('보고서 생성 오류:', error);
            alert('보고서 생성 중 오류가 발생했습니다.');
        }
    };


        // 종합점수와 도로점수용 색상 반환 함수 (10점 만점)
    const getTotalRoadScoreColor = (score) => {
        // console.log(`🚀 getTotalRoadScoreColor 함수 호출됨! 입력값: ${score}, 타입: ${typeof score}`);
        
        if (typeof score !== 'number' || isNaN(score)) {
            // console.log(`❌ 숫자가 아님: ${score} (${typeof score})`);
            return '#ccc';
         }
        
        // console.log(`🔍 종합/도로 점수 색상 계산: 점수=${score}`);
        
        if (score >= 0 && score < 2) {
            // console.log(`✅ 초록색 적용: ${score} >= 0 && ${score} < 2`);
            return '#4CAF50'; // 초록색
        }
        if (score >= 2 && score < 5) {
            // console.log(`✅ 노란색 적용: ${score} >= 2 && ${score} < 5`);
            return '#FFC107'; // 노란색
        }
        if (score >= 5 && score < 8) {
            // console.log(`✅ 주황색 적용: ${score} >= 5 && ${score} < 8`);
            return '#FF9800'; // 주황색
        }
        if (score >= 8) {
            // console.log(`✅ 빨간색 적용: ${score} >= 8`);
            return '#F44336'; // 빨간색
        }
        
        // console.log(`❌ 기본색 적용: ${score}는 어떤 범위에도 속하지 않음`);
        return '#ccc'; // 기본색
    };

    // 기상점수용 색상 반환 함수 (5점 만점, 2배로 계산)
    const getWeatherScoreColor = (score) => {
        if (typeof score !== 'number' || isNaN(score)) return '#ccc';
        
        // 기상 점수는 2배로 계산 (5점 → 10점으로 변환)
        const normalizedScore = score * 2;
        
        // console.log(`🔍 기상 점수 색상 계산: 원본 점수=${score}, 정규화된 점수=${normalizedScore}`);
        
        if (normalizedScore >= 0 && normalizedScore < 2) {
            // console.log(`✅ 초록색 적용: ${normalizedScore} >= 0 && ${normalizedScore} < 2`);
            return '#4CAF50'; // 초록색
        }
        if (normalizedScore >= 2 && normalizedScore < 5) {
            // console.log(`✅ 노란색 적용: ${normalizedScore} >= 2 && ${normalizedScore} < 5`);
            return '#FFC107'; // 노란색
        }
        if (normalizedScore >= 5 && normalizedScore < 8) {
            // console.log(`✅ 주황색 적용: ${normalizedScore} >= 5 && ${normalizedScore} < 8`);
            return '#FF9800'; // 주황색
        }
        if (normalizedScore >= 8) {
            // console.log(`✅ 빨간색 적용: ${normalizedScore} >= 8`);
            return '#F44336'; // 빨간색
        }
        
        // console.log(`❌ 기본색 적용: ${normalizedScore}는 어떤 범위에도 속하지 않음`);
        return '#ccc'; // 기본색
    };

    // CCTV 위험도 데이터 가져오기
    const fetchCCTVRiskData = async (cctvIdx) => {
        if (!cctvIdx) return;
        
        setCctvRiskLoading(true);
        try {
            console.log('🚀 CCTV 위험도 데이터 요청 시작:', cctvIdx);
//            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://0.0.0.0:3001/api';
  //      const response = await fetch(`${apiBaseUrl}/cctv/risk/${cctvIdx}`);
            const response = await fetch(`/api/cctv/risk/${cctvIdx}`);
            console.log('📡 API 응답 상태:', response.status, response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 CCTV 위험도 데이터 수신:', data);
                console.log('📊 데이터 타입 확인:', {
                    total_score: typeof data.total_score,
                    road_score: typeof data.road_score,
                    weather_score: typeof data.weather_score,
                    total_score_value: data.total_score,
                    road_score_value: data.road_score,
                    weather_score_value: data.weather_score
                });
                
                // 점수 데이터를 숫자로 변환
                const processedData = {
                    ...data,
                    total_score: parseFloat(data.total_score) || 0,
                    road_score: parseFloat(data.road_score) || 0,
                    weather_score: parseFloat(data.weather_score) || 0
                };
                
                console.log('🔄 변환된 데이터:', {
                    total_score: typeof processedData.total_score,
                    road_score: typeof processedData.road_score,
                    weather_score: typeof processedData.weather_score,
                    total_score_value: processedData.total_score,
                    road_score_value: processedData.road_score,
                    weather_score_value: processedData.weather_score
                });
                
                // 데이터 유효성 검사
                if (processedData.total_score === 0 && processedData.road_score === 0 && processedData.weather_score === 0) {
                    console.warn('⚠️ 모든 점수가 0입니다. 데이터베이스에 데이터가 없을 수 있습니다.');
                }
                
                setCctvRiskData(processedData);
            } else {
                console.error('❌ CCTV 위험도 데이터 조회 실패:', response.status);
                const errorText = await response.text();
                console.error('❌ 에러 상세:', errorText);
            }
        } catch (error) {
            console.error('❌ CCTV 위험도 데이터 조회 오류:', error);
        } finally {
            setCctvRiskLoading(false);
        }
    };

   // 마커 상세 정보 가져오기
    useEffect(() => {
        if (!isOpen || !markerData?.marker_id) {
            setDetailData(null);
            setLoading(false);
            return;
        }

        console.log('🔍 Modals useEffect 실행:', { isOpen, markerData, isEditMode });

        // 모달이 열릴 때마다 AI 분석 결과 초기화
        setAiAnalysisResult(null);

        // CCTV 모달인 경우 위험도 데이터 가져오기
        if (markerType === 'cctv' && markerData.cctv_idx) {
            fetchCCTVRiskData(markerData.cctv_idx);
        }

        // ✅ 항상 API 호출하여 상세 정보 가져오기
        console.log('✅ API 호출하여 상세 정보 요청:', markerData.marker_id);
        fetchMarkerDetail(markerData.marker_id, markerData.type || markerType);

        // CCTV 마커인 경우 iframe 로딩 상태 초기화
        if (markerData.type === 'cctv' || markerType === 'cctv') {
            setVideoLoading(true);
            setVideoError(false);
        }
    }, [isOpen, markerData]); // markerData가 변경될 때마다 실행

    // ✅ isEditMode prop이 변경될 때 상태 업데이트
    useEffect(() => {
        setIsEditMode(initialEditMode);
        // 수정 모드가 활성화되면, 현재 상세 데이터로 폼 상태 초기화
        if (initialEditMode && detailData?.detail) {
            if (markerType === 'complaint') {
                setEditFormData({
                    c_report_status: detailData.detail.c_report_status || 'R',
                    c_report_detail: detailData.detail.c_report_detail || '',
                    addr: detailData.detail.addr || ''
                });
            } else {
                setEditFormData({
                    control_desc: detailData.detail.control_desc || '',
                    control_st_tm: detailData.detail.control_st_tm ? detailData.detail.control_st_tm.slice(0, 16) : '',
                    control_ed_tm: detailData.detail.control_ed_tm ? detailData.detail.control_ed_tm.slice(0, 16) : '',
                    control_addr: detailData.detail.control_addr || '',
                    control_type: detailData.detail.control_type || 'construction'
                });
            }
        }
    }, [initialEditMode, detailData, markerType]);

    // ✅ Context의 citizenReportData가 변경될 때 detailData 설정
    useEffect(() => {
        if (citizenReportData) {
            console.log('🔔 Context에서 시민 제보 데이터 변경됨:', citizenReportData);
            
            const notificationData = citizenReportData.notification;
            const detailData = citizenReportData.detail;
            
            // detailData 설정 (기존 로직과 호환성을 위해)
            setDetailData({
                marker: {
                    marker_id: notificationData.reportId,
                    lat: notificationData.lat,
                    lon: notificationData.lon,
                    icon: '📝'
                },
                detail: detailData || {
                    c_report_idx: notificationData.reportId,
                    addr: notificationData.addr,
                    c_report_detail: notificationData.c_report_detail,
                    lat: notificationData.lat,
                    lon: notificationData.lon,
                    c_reported_at: notificationData.timestamp
                }
            });
        }
    }, [citizenReportData]);

    // 시민 제보 모달이 열릴 때 분석 결과 조회
    useEffect(() => {
        if (isOpen && markerType === 'complaint' && detailData?.detail?.c_report_idx) {
            const fetchAnalysisResult = async () => {
                try {
                    console.log('🔍 시민 제보 분석 결과 조회 시작:', detailData.detail.c_report_idx);
                    const result = await getComplaintAnalysisResult(detailData.detail.c_report_idx);
                    
                    if (result.success) {
                        console.log('✅ 시민 제보 분석 결과 조회 성공:', result.result);
                        setComplaintAnalysisResult(result.result);
                    } else {
                        console.log('📋 분석 결과 없음:', result.message);
                        setComplaintAnalysisResult(null);
                    }
                } catch (error) {
                    console.error('❌ 시민 제보 분석 결과 조회 실패:', error);
                    setComplaintAnalysisResult(null);
                }
            };
            
            fetchAnalysisResult();
        }
    }, [isOpen, markerType, detailData]);

    // 시민 제보 모달이 열릴 때 침수 분석 결과 조회
    useEffect(() => {
        if (isOpen && markerType === 'complaint' && detailData?.detail?.c_report_idx) {
            const fetchFloodResult = async () => {
                try {
                    console.log('🌊 시민 제보 침수 분석 결과 조회 시작:', detailData.detail.c_report_idx);
                    const result = await getComplaintFloodResult(detailData.detail.c_report_idx);
                    
                    if (result.success) {
                        console.log('✅ 시민 제보 침수 분석 결과 조회 성공:', result.result);
                        setComplaintFloodResult(result.result);
                    } else {
                        console.log('📋 침수 분석 결과 없음:', result.message);
                        setComplaintFloodResult(null);
                    }
                } catch (error) {
                    console.error('❌ 시민 제보 침수 분석 결과 조회 실패:', error);
                    setComplaintFloodResult(null);
                }
            };
            
            fetchFloodResult();
        }
    }, [isOpen, markerType, detailData]);


    const fetchMarkerDetail = async (markerId, markerType) => {
        console.log('🚀 fetchMarkerDetail 시작:', { markerId, markerType });
        setLoading(true);

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://0.0.0.0:3001/api';
            let apiUrl;

            // ✅ 마커 타입에 따라 다른 API 엔드포인트 사용
            if (markerType === 'construction' || markerType === 'flood') {
                // 도로 통제 마커: road-control API 사용
//            apiUrl = `${apiBaseUrl}/road-control/detail/${markerId}`;
                apiUrl = `/api/road-control/detail/${markerId}`;
                console.log('🚧 도로 통제 API 호출:', apiUrl);
            } else if (markerType === 'complaint') {
                // 시민 제보 마커: complaint API 사용
//                apiUrl = `${apiBaseUrl}/complaint/${markerId}`;
//                apiUrl = `/api/complaint/${markerId}`;
                apiUrl = `/api/complaint/detail/${markerId}`;
                console.log('📝 시민 제보 API 호출:', apiUrl);
            } else {
                // CCTV 마커: marker API 사용 (기존 방식)
//                apiUrl = `${apiBaseUrl}/marker/detail/${markerId}`;
                apiUrl = `/api/marker/detail/${markerId}`;
                console.log('📹 CCTV API 호출:', apiUrl);
            }

            const response = await fetch(apiUrl);
            console.log('📡 API 응답:', response.status, response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('📊 받은 데이터:', data);

                // 시민 제보 데이터 구조 맞추기
                if (markerType === 'complaint') {
                    setDetailData({
                        marker: {
                            marker_id: data.complaint.c_report_idx,
                            marker_type: 'complaint',
                            lat: data.complaint.lat,
                            lon: data.complaint.lon
                        },
                        detail: data.complaint
                    });
                } else {
                    setDetailData(data);
                }
            } else {
                console.error('❌ 마커 상세 정보 조회 실패:', response.status);
                setDetailData(null);
            }
        } catch (error) {
            console.error('❌ 마커 상세 정보 조회 오류:', error);
            setDetailData(null);
        } finally {
            setLoading(false);
        }
    };

    // 비디오 로딩 핸들러
    const handleVideoLoadStart = () => {
        setVideoLoading(true);
        setVideoError(false);
    };

    const handleVideoCanPlay = () => {
        setVideoLoading(false);
        setVideoError(false);
    };

    const handleVideoError = () => {
        setVideoLoading(false);
        setVideoError(true);
    };

    // 수정 모드 전환
    const handleEditMode = () => {
        if (detailData?.detail) {
            if (markerType === 'complaint') {
                // 시민 제보 수정 모드
                setEditFormData({
                    c_report_status: detailData.detail.c_report_status || 'R',
                    c_report_detail: detailData.detail.c_report_detail || '',
                    addr: detailData.detail.addr || ''
                });
            } else {
                // 기존 도로 통제 수정 모드
                setEditFormData({
                    control_desc: detailData.detail.control_desc || '',
                    control_st_tm: detailData.detail.control_st_tm ? detailData.detail.control_st_tm.split('T')[0] : '',
                    control_ed_tm: detailData.detail.control_ed_tm ? detailData.detail.control_ed_tm.split('T')[0] : '',
                    control_addr: detailData.detail.control_addr || '',
                    control_type: detailData.detail.control_type || 'construction'
                });
            }
        }
        setIsEditMode(true);
    };

    // 전역 함수로 편집 모드로 모달 열기
    useEffect(() => {
        window.openComplaintModalInEditMode = () => {
            console.log('🔄 편집 모드로 모달 열기');
            if (detailData?.detail) {
                handleEditMode();
            }
        };

        return () => {
            window.openComplaintModalInEditMode = null;
        };
    }, [detailData]);

    // 수정 모드 취소
    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditFormData({});
    };

    // 폼 데이터 변경 핸들러
    const handleFormChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 데이터 업데이트
    const handleUpdate = async () => {
        setUpdateLoading(true);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://0.0.0.0:3001/api';
            let response;

            if (markerType === 'complaint') {
                // 시민 제보 업데이트
                const reportIdx = detailData?.detail?.c_report_idx ||
                    markerData?.c_report_idx ||
                    detailData?.detail?.marker_id ||
                    markerData?.marker_id;

                if (!reportIdx) {
                    alert('업데이트할 시민 제보를 찾을 수 없습니다. c_report_idx가 필요합니다.');
                    return;
                }

//                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://0.0.0.0:3001/api';
//            response = await fetch(`${apiBaseUrl}/complaint/update`, {
                response = await fetch('/api/complaint/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        c_report_idx: reportIdx,
                        ...editFormData
                    }),
                });
            } else {
                // 기존 도로 통제 업데이트
                const controlIdx = detailData?.detail?.control_idx ||
                    markerData?.control_idx ||
                    detailData?.detail?.marker_id ||
                    markerData?.marker_id;

                if (!controlIdx) {
                    alert('업데이트할 데이터를 찾을 수 없습니다. control_idx가 필요합니다.');
                    return;
                }

//                response = await fetch(`${apiBaseUrl}/update/road-control`, {
                response = await fetch('/api/update/road-control', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        control_idx: controlIdx,
                        ...editFormData
                    }),
                });
            }

            if (response.ok) {
                const result = await response.json();
                alert('성공적으로 업데이트되었습니다.');
                setIsEditMode(false);
                setEditFormData({});

                // 시민 제보 업데이트 완료 시 부모 컴포넌트에 알림
                if (markerType === 'complaint' && onUpdateComplete) {
                    console.log('✅ 시민 제보 업데이트 완료 - 부모 컴포넌트에 알림');
                    onUpdateComplete();
                }
                // 수정된 부분: fetchMarkerDetail에 markerType 전달
                if (markerType === 'complaint') {
                   fetchMarkerDetail(markerData?.c_report_idx || markerData?.marker_id, markerType);
                } else {
                   fetchMarkerDetail(markerData.marker_id, markerType);
                }

            } else {
                const errorData = await response.json();
                alert(`업데이트 실패: ${errorData.message || '알 수 없는 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error('업데이트 오류:', error);
            alert('업데이트 중 오류가 발생했습니다.');
        } finally {
            setUpdateLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderCCTVModal = () => {
        const cctvData = detailData?.detail;

        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? (fallback ? parseFloat(fallback) : null) : num;
        };

        const cctvLat = safeCoordinate(cctvData?.lat, markerData?.lat);
        const cctvLon = safeCoordinate(cctvData?.lon, markerData?.lng);

        return (
            <>
                <div className="modal-header cctv">
                    <h2>{markerData?.icon || '📹'} CCTV 모니터링 - {cctvData?.cctv_name || 'CCTV'}</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            <div className="cctv-feed" style={{
                                width: '100%',
                                height: '470px',
                                position: 'relative',
                                marginBottom: '20px'
                            }}>
                                <div className="feed-overlay" style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    background: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    zIndex: 5
                                }}>실시간 스트리밍</div>
                                {cctvData?.cctv_url ? (
                                    <div className="video-player-container" style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%'
                                    }}>
                                        {/* iframe으로 CCTV 페이지 임베드 */}
                                        <iframe
                                            src={cctvData.cctv_url}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                border: 'none',
                                                borderRadius: '8px',
                                                backgroundColor: '#000',
                                                transform: 'scale(2.0)',
                                                transformOrigin: 'center center',
                                                marginTop: '140px'
                                            }}
                                            title="CCTV 스트리밍"
                                            allowFullScreen
                                            sandbox="allow-scripts allow-same-origin allow-forms"
                                            onLoad={() => {
                                                console.log('✅ CCTV iframe 로딩 완료');
                                                setVideoLoading(false);
                                                setVideoError(false);
                                            }}
                                            onError={() => {
                                                console.error('❌ CCTV iframe 로딩 실패');
                                                setVideoLoading(false);
                                                setVideoError(true);
                                            }}
                                        />
                                        {videoLoading && (
                                            <div className="video-loading" style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 10
                                            }}>
                                                <div className="spinner"></div>
                                                <span>스트리밍 연결 중...</span>
                                            </div>
                                        )}
                                        {videoError && (
                                            <div className="video-loading" style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 10,
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                padding: '20px',
                                                borderRadius: '8px'
                                            }}>
                                                <div style={{ fontSize: '48px', marginBottom: '10px' }}>❌</div>
                                                <span>스트리밍 연결 실패</span>
                                                <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                                                    새 창에서 열어보세요
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
                                        <p>CCTV 피드 연결 중...</p>
                                        <small>위치: {cctvLat?.toFixed(6) || 'N/A'}, {cctvLon?.toFixed(6) || 'N/A'}</small>
                                        <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                                            스트리밍 URL이 설정되지 않았습니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                            {/* {cctvData?.cctv_url && (
                                <div className="streaming-link-container">
                                    <a
                                        href={cctvData.cctv_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="streaming-link"
                                    >
                                        📺 새 창에서 스트리밍 보기
                                    </a>
                                </div>
                            )} */}

                            <div className="risk-score">

                                {cctvRiskLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                                        <p>점수를 불러오는 중...</p>
                                    </div>
                                ) : cctvRiskData ? (
                                    <>
                                        {/* <div className="risk-gauge">
                                            <div className="risk-value">
                                                {typeof cctvRiskData.total_score === 'number'
                                                    ? cctvRiskData.total_score.toFixed(1)
                                                    : cctvRiskData.total_score || 'N/A'}
                                            </div>
                                        </div> */}
                                        <p>종합 위험도 점수 </p><p>탐지 일시 : {cctvRiskData.detected_at ? new Date(cctvRiskData.detected_at).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }) : 'N/A'}</p>
                                                                                   <div className="score-circles">
                                              <div className="score-circle-container">
                                                  <div className="score-circle total-score" 
                                                       style={{
                                                           backgroundColor: getTotalRoadScoreColor(cctvRiskData.total_score),
                                                           '--dynamic-bg': getTotalRoadScoreColor(cctvRiskData.total_score)
                                                       }}>
                                                     <span className="score-number">
                                                         {typeof cctvRiskData.total_score === 'number'
                                                             ? cctvRiskData.total_score.toFixed(1)
                                                             : cctvRiskData.total_score || 'N/A'}
                                                     </span>
                                                  </div>
                                                  <span className="score-label">종합 점수</span>
                                              </div>
                                              <div className="score-circle-container">
                                                  <div className="score-circle road-score"
                                                       style={{
                                                           backgroundColor: getTotalRoadScoreColor(cctvRiskData.road_score),
                                                           '--dynamic-bg': getTotalRoadScoreColor(cctvRiskData.road_score)
                                                       }}>
                                                     <span className="score-number">
                                                         {typeof cctvRiskData.road_score === 'number'
                                                             ? cctvRiskData.road_score.toFixed(1)
                                                             : cctvRiskData.road_score || 'N/A'}
                                                     </span>
                                                  </div>
                                                  <span className="score-label">도로 점수</span>
                                              </div>
                                              <div className="score-circle-container">
                                                  <div className="score-circle weather-score"
                                                       style={{
                                                           backgroundColor: getWeatherScoreColor(cctvRiskData.weather_score),
                                                           '--dynamic-bg': getWeatherScoreColor(cctvRiskData.weather_score)
                                                       }}>
                                                     <span className="score-number">
                                                         {typeof cctvRiskData.weather_score === 'number'
                                                             ? cctvRiskData.weather_score.toFixed(1)
                                                             : cctvRiskData.weather_score || 'N/A'}
                                                     </span>
                                                  </div>
                                                  <span className="score-label">기상 점수</span>
                                              </div>
                                          </div>
                                
                                    </>
                                ) : (
                                    <>
                                        <div className="risk-gauge">
                                            <div className="risk-value">-</div>
                                        </div>
                                        <p>데이터 없음</p>
                                    </>
                                )}
                            </div>

                            <div className="analysis-results">
                                <div className="analysis-card">
                                    <h4>🚨 위험 감지 현황</h4>
                                    {cctvRiskLoading ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                                            <p>위험도 데이터를 불러오는 중...</p>
                                        </div>
                                    ) : cctvRiskData ? (
                                    <div className="detections">
                                        <div className="detection-item">
                                                <span>균열 개수</span>
                                                <span className="marker-type-cctv">{cctvRiskData.crack_cnt || 0}건</span>
                                        </div>
                                        <div className="detection-item">
                                                <span>포트홀 개수</span>
                                                <span className="marker-type-cctv">{cctvRiskData.break_cnt || 0}건</span>
                                        </div>
                                        <div className="detection-item">
                                                <span>거북등 균열 개수</span>
                                                <span className="marker-type-cctv">{cctvRiskData.ali_crack_cnt || 0}건</span>
                                        </div>
                                    </div>
                                    ) : (
                                        <div className="detections">
                                            <div className="detection-item">
                                                <span>균열 개수</span>
                                                <span className="marker-type-cctv">-</span>
                                </div>
                                            <div className="detection-item">
                                                <span>포트홀 개수</span>
                                                <span className="marker-type-cctv">-</span>
                                </div>
                                            <div className="detection-item">
                                                <span>거북등 균열 개수</span>
                                                <span className="marker-type-cctv">-</span>
                            </div>
                                </div>
                                    )}
                            </div>

                                {/* 침수 분석 결과 */}
                                    <div className="analysis-card">
                                    <h4>🌊 침수 분석 결과</h4>
                                    {floodAnalysisLoading ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                                            <p>침수 분석 중...</p>
                                        </div>
                                    ) : floodAnalysisResult ? (
                                        <div className="detections">
                                            <div className="detection-item">
                                                <span>침수 여부</span>
                                                <span className={`marker-type-${floodAnalysisResult.flood_result === 'Y' ? 'flood' : 'cctv'}`}>
                                                    {floodAnalysisResult.flood_result === 'Y' ? '침수 감지' : '침수 없음'}
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>신뢰도</span>
                                                        <span className="marker-type-cctv">
                                                    {(floodAnalysisResult.confidence * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                            {/*{floodAnalysisResult.image_path && (
                                                <div className="detection-item">
                                                    <span>분석 이미지</span>
                                                    <span className="marker-type-cctv">
                                                        <a href={floodAnalysisResult.image_path} target="_blank" rel="noopener noreferrer">
                                                            이미지 보기
                                                        </a>
                                                    </span>
                                                </div>
                                            )}*/}
                                        </div>
                                    ) : (
                                        <div className="detections">
                                            <div className="detection-item">
                                                <span>침수 여부</span>
                                                <span className="marker-type-cctv">-</span>
                                    </div>
                                            <div className="detection-item">
                                                <span>신뢰도</span>
                                                <span className="marker-type-cctv">-</span>
                                                </div>
                                        </div>
                                    )}
                                    </div>
                            <div className="recommendations-card">
                                <h4>💡 권장사항</h4>
                                <ul>
                                    <li>교통 신호 개선 필요</li>
                                    <li>보행자 횡단보도 안전장치 설치 검토</li>
                                    <li>정기적인 CCTV 점검 및 유지보수</li>
                                </ul>
                                </div>
                            </div>








                        </>
                    )}
                </div>
            </>
        );
    };

    const renderConstructionModal = () => {
        const controlData = detailData?.detail;

        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? (fallback ? parseFloat(fallback) : null) : num;
        };

        const controlLat = safeCoordinate(controlData?.lat, markerData?.lat);
        const controlLon = safeCoordinate(controlData?.lon, markerData?.lng);

        return (
            <>
                <div className="modal-header construction">
                    <h2>{markerData?.icon || '🚧'} 공사 현황 - {controlData?.control_type === 'construction' ? '공사중' : '통제중'}</h2>
                    <div className="header-actions">
                        {!isEditMode && controlData && (
                            <button
                                className="edit-btn"
                                onClick={handleEditMode}
                                style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginRight: '10px'
                                }}
                            >
                                ✏️ 수정
                            </button>
                        )}
                        <span className="close" onClick={onClose}>&times;</span>
                    </div>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : !controlData ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                            <p>상세 정보가 설정되지 않았습니다.</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                이 마커는 기본 정보만 포함하고 있습니다.
                            </p>
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <p><strong>마커 타입:</strong> {markerData?.type || 'construction'}</p>
                                <p><strong>위치:</strong> {typeof controlLat === 'number' ? controlLat.toFixed(6) : 'N/A'}, {typeof controlLon === 'number' ? controlLon.toFixed(6) : 'N/A'}</p>
                                <p><strong>상태:</strong> 기본 정보만 표시</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditMode ? (
                                <div className="edit-form">
                                    <h4>✏️ 공사 정보 수정</h4>
                                    <div className="form-group">
                                        <label>공사 종류:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_desc || ''}
                                            onChange={(e) => handleFormChange('control_desc', e.target.value)}
                                            placeholder="공사 종류를 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>시작일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_st_tm || ''}
                                            onChange={(e) => handleFormChange('control_st_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>예상 완료일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_ed_tm || ''}
                                            onChange={(e) => handleFormChange('control_ed_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>통제 주소:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_addr || ''}
                                            onChange={(e) => handleFormChange('control_addr', e.target.value)}
                                            placeholder="통제 주소를 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>통제 타입:</label>
                                        <select
                                            value={editFormData.control_type || 'construction'}
                                            onChange={(e) => handleFormChange('control_type', e.target.value)}
                                        >
                                            <option value="construction">공사중</option>
                                            <option value="flood">홍수 통제</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={handleCancelEdit}
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                marginRight: '10px'
                                            }}
                                        >
                                            ❌ 취소
                                        </button>
                                        <button
                                            className="update-btn"
                                            onClick={handleUpdate}
                                            disabled={updateLoading}
                                            style={{
                                                background: updateLoading ? '#ccc' : '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: updateLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {updateLoading ? '⏳ 업데이트 중...' : '✅ 수정 완료'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="construction-status" >
                                    {/* <h4 style={{ whiteSpace: 'nowrap' }}>🏗️ 공사 진행 상황</h4><br></br> */}
                                    <p><strong>공사 종류</strong><br></br> {controlData?.control_desc || '도로 포장 공사'}</p>
                                    <p><strong>시작일</strong><br></br> {controlData?.control_st_tm ? new Date(controlData.control_st_tm).toLocaleDateString('ko-KR') : '2024년 1월 15일'}</p>
                                    <p style={{ whiteSpace: 'nowrap' }}><strong>예상 완료일</strong><br></br> {controlData?.control_ed_tm ? new Date(controlData.control_ed_tm).toLocaleDateString('ko-KR') : '2024년 3월 20일'}</p>
                                    <p><strong>현재 단계</strong> <br></br>포장층 시공 중</p>
                                    {controlData?.control_addr && (
                                        <p><strong>통제 주소</strong><br></br> {controlData.control_addr}</p>
                                    )}
                                    <p><strong>위치</strong><br></br> {typeof controlLat === 'number' ? controlLat.toFixed(6) : 'N/A'}, {typeof controlLon === 'number' ? controlLon.toFixed(6) : 'N/A'}</p>
                                </div>
                            )}

                            {!isEditMode && (
                                <div className="construction-progress">
                                    <h4>📈 공사 진행률</h4>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: '65%' }}></div>
                                    </div>
                                    <p>65% 완료 (예상 35일 남음)</p>
                                </div>
                            )}

                            {!isEditMode && (
                                <>
                                    <div className="analysis-results">
                                        <div className="analysis-card">
                                            <h4>⚠️ 안전 관리 현황</h4>
                                            <div className="detection-item">
                                                <span>안전장비 착용률</span>
                                                <span className="marker-type-construction">98%</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>안전사고 발생</span>
                                                <span className="marker-type-construction">0건</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>교통 통제 준수</span>
                                                <span className="marker-type-construction">100%</span>
                                            </div>
                                        </div>
                                        <div className="analysis-card">
                                            <h4>🚦 교통 영향</h4>
                                            <p>차선 축소: 2차선 → 1차선</p>
                                            <p>제한속도: 30km/h</p>
                                            <p>우회로: 북쪽 500m 지점</p>
                                        </div>
                                    </div>

                                    <div className="recommendations-card">
                                        <h4>💡 주의사항</h4>
                                        <ul>
                                            <li>공사 구간 진입 시 속도 감속 필수</li>
                                            <li>안전 표지판 및 신호 준수</li>
                                            <li>공사 차량 우선 통행</li>
                                            <li>야간 운전 시 주의</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    const renderFloodModal = () => {
        const controlData = detailData?.detail;

        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? (fallback ? parseFloat(fallback) : null) : num;
        };

        const controlLat = safeCoordinate(controlData?.lat, markerData?.lat);
        const controlLon = safeCoordinate(controlData?.lon, markerData?.lng);

        return (
            <>
                <div className="modal-header flood">
                    <h2>{markerData?.icon || '🌊'} 침수 현황 - {controlData?.control_type === 'flood' ? '침수' : '통제중'}</h2>
                    <div className="header-actions">
                        {!isEditMode && controlData && (
                            <button
                                className="edit-btn"
                                onClick={handleEditMode}
                                style={{
                                    background: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginRight: '10px'
                                }}
                            >
                                ✏️ 수정
                            </button>
                        )}
                        <span className="close" onClick={onClose}>&times;</span>
                    </div>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : !controlData ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                            <p>상세 정보가 설정되지 않았습니다.</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                이 마커는 기본 정보만 포함하고 있습니다.
                            </p>
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <p><strong>마커 타입:</strong> {markerData?.type || 'flood'}</p>
                                <p><strong>위치:</strong> {typeof controlLat === 'number' ? controlLat.toFixed(6) : 'N/A'}, {typeof controlLon === 'number' ? controlLon.toFixed(6) : 'N/A'}</p>
                                <p><strong>상태:</strong> 기본 정보만 표시</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditMode ? (
                                <div className="edit-form">
                                    <h4>✏️ 침수 정보 수정</h4>
                                    <div className="form-group">
                                        <label>침수 원인/설명:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_desc || ''}
                                            onChange={(e) => handleFormChange('control_desc', e.target.value)}
                                            placeholder="침수 원인이나 상세 설명을 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>침수 시작일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_st_tm || ''}
                                            onChange={(e) => handleFormChange('control_st_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>예상 완료일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_ed_tm || ''}
                                            onChange={(e) => handleFormChange('control_ed_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>침수 주소:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_addr || ''}
                                            onChange={(e) => handleFormChange('control_addr', e.target.value)}
                                            placeholder="침수 주소를 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>통제 타입:</label>
                                        <select
                                            value={editFormData.control_type || 'flood'}
                                            onChange={(e) => handleFormChange('control_type', e.target.value)}
                                        >
                                            <option value="construction">공사중</option>
                                            <option value="flood">홍수 통제</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={handleCancelEdit}
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                marginRight: '10px'
                                            }}
                                        >
                                            ❌ 취소
                                        </button>
                                        <button
                                            className="update-btn"
                                            onClick={handleUpdate}
                                            disabled={updateLoading}
                                            style={{
                                                background: updateLoading ? '#ccc' : '#2196F3',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: updateLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {updateLoading ? '⏳ 업데이트 중...' : '✅ 수정 완료'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flood-info">
                                    <h4>💧 침수 정보</h4>
                                    <p><strong>침수 원인:</strong> {controlData?.control_desc || '집중 호우'}</p>
                                    <p><strong>침수 시작:</strong> {controlData?.control_st_tm ? new Date(controlData.control_st_tm).toLocaleString('ko-KR') : '2024년 1월 20일 14:30'}</p>
                                    <p><strong>현재 상태:</strong> 침수 지속 중</p>
                                    <p><strong>영향 구간:</strong> 150m 구간</p>
                                    {controlData?.control_addr && (
                                        <p><strong>침수 주소:</strong> {controlData.control_addr}</p>
                                    )}
                                    <p><strong>위치:</strong> {typeof controlLat === 'number' ? controlLat.toFixed(6) : 'N/A'}, {typeof controlLon === 'number' ? controlLon.toFixed(6) : 'N/A'}</p>
                                </div>
                            )}

                            {!isEditMode && (
                                <>
                                    <div className="water-level">
                                        <h4>📊 수위 현황</h4>
                                        <div className="water-gauge">
                                            <div className="water-level-value">85</div>
                                        </div>
                                        <p>수위: 85cm (위험 수위: 100cm)</p>
                                        <p>예상 완료: 2시간 후</p>
                                    </div>

                                    <div className="analysis-results">
                                        <div className="analysis-card">
                                            <h4>🚨 위험도 분석</h4>
                                            <div className="detection-item">
                                                <span>차량 통행 가능</span>
                                                <span className="marker-type-flood">불가</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>보행자 통행</span>
                                                <span className="marker-type-flood">위험</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>하수도 상태</span>
                                                <span className="marker-type-flood">포화</span>
                                            </div>
                                        </div>
                                        <div className="analysis-card">
                                            <h4>🌧️ 기상 정보</h4>
                                            <p>강수량: 45mm/시간</p>
                                            <p>습도: 95%</p>
                                            <p>풍속: 8m/s</p>
                                            <p>예보: 2시간 후 개선 예상</p>
                                        </div>
                                    </div>

                                    <div className="recommendations-card">
                                        <h4>💡 긴급 조치사항</h4>
                                        <ul>
                                            <li>해당 구간 진입 금지</li>
                                            <li>우회로 이용 권장</li>
                                            <li>긴급 상황 시 119 신고</li>
                                            <li>침수 완료까지 대기</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    const renderComplaintModal = () => {
        const complaintData = detailData?.detail;

        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? (fallback ? parseFloat(fallback) : null) : num;
        };

        const complaintLat = safeCoordinate(complaintData?.lat, markerData?.lat);
        const complaintLon = safeCoordinate(complaintData?.lon, markerData?.lon);

        return (
            <>
                <div className="modal-header complaint">
                    <h2>{markerData?.icon || '📝'} 시민 제보 상세</h2>
                    <div className="header-actions">
                        {!isEditMode && complaintData && (
                            <button
                                className="edit-btn"
                                onClick={handleEditMode}
                                style={{
                                    background: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginRight: '10px'
                                }}
                            >
                                ✏️ 수정
                            </button>
                        )}
                        <span className="close" onClick={onClose}>&times;</span>
                    </div>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : !complaintData ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                            <p>상세 정보가 설정되지 않았습니다.</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                이 마커는 기본 정보만 포함하고 있습니다.
                            </p>
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <p><strong>마커 타입:</strong> {markerData?.type || 'complaint'}</p>
                                <p><strong>위치:</strong> {typeof complaintLat === 'number' ? complaintLat.toFixed(6) : 'N/A'}, {typeof complaintLon === 'number' ? complaintLon.toFixed(6) : 'N/A'}</p>
                                <p><strong>상태:</strong> 기본 정보만 표시</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditMode ? (
                                <div className="edit-form">
                                    <h4>✏️ 시민 제보 정보 수정</h4>
                                    <div className="form-group">
                                        <label>처리 상태:</label>
                                        <select
                                            value={editFormData.c_report_status || ''}
                                            onChange={(e) => handleFormChange('c_report_status', e.target.value)}
                                        >
                                            <option value="R">접수 완료</option>
                                            <option value="P">처리 중</option>
                                            <option value="C">처리 완료</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: '#999' }}>상세 설명: (편집 불가)</label>
                                        <textarea
                                            value={editFormData.c_report_detail || ''}
                                            onChange={(e) => handleFormChange('c_report_detail', e.target.value)}
                                            placeholder="상세 설명을 입력하세요"
                                            rows="4"
                                            disabled
                                            style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: '#999' }}>주소: (편집 불가)</label>
                                        <input
                                            type="text"
                                            value={editFormData.addr || ''}
                                            onChange={(e) => handleFormChange('addr', e.target.value)}
                                            placeholder="주소를 입력하세요"
                                            disabled
                                            style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={handleCancelEdit}
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                marginRight: '10px'
                                            }}
                                        >
                                            ❌ 취소
                                        </button>
                                        <button
                                            className="update-btn"
                                            onClick={handleUpdate}
                                            disabled={updateLoading}
                                            style={{
                                                background: updateLoading ? '#ccc' : '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: updateLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {updateLoading ? '⏳ 업데이트 중...' : '✅ 수정 완료'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="complaint-info">
                                    <h4>📝 제보 정보</h4>
                                    <p><strong>제보 번호:</strong> #{complaintData?.c_report_idx}</p>
                                    <p><strong>처리 상태:</strong> {getComplaintStatusText(complaintData?.c_report_status)}</p>
                                    <p><strong>제보 일시:</strong> {complaintData?.c_reported_at ? new Date(complaintData.c_reported_at).toLocaleString('ko-KR') : 'N/A'}</p>
                                    <p><strong>위치:</strong> {complaintData?.addr || '주소 정보 없음'}</p>
                                    <p><strong>상세 내용:</strong> {complaintData?.c_report_detail || '상세 정보가 없습니다.'}</p>
                                    <p><strong>제보자:</strong> {complaintData?.c_reporter_name}</p>
                                    <p><strong>연락처:</strong> {complaintData?.c_reporter_phone}</p>
                                    <p><strong>좌표:</strong> {typeof complaintLat === 'number' ? complaintLat.toFixed(6) : 'N/A'}, {typeof complaintLon === 'number' ? complaintLon.toFixed(6) : 'N/A'}</p>

                                    {/* 첨부 파일 정보 */}
                                    {(complaintData?.c_report_file1 || complaintData?.c_report_file2 || complaintData?.c_report_file3) && (
                                        <div className="attachment-info">
                                            <h4>📎제보 사진 </h4>
                                            {complaintData?.c_report_file1 && (
                                                <img src={complaintData.c_report_file1} alt="제보 파일 1" style={{ maxWidth: '300px', maxHeight: '300px', marginRight: '10px' }} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isEditMode && (
                                <>
                                    <div className="analysis-results">
                                        <div className="analysis-card">
                                            <h4>📊 처리 현황</h4>
                                            <div className="detection-item">
                                                <span>접수 일시</span>
                                                <span className="marker-type-complaint">
                                                    {complaintData?.c_reported_at ? new Date(complaintData.c_reported_at).toLocaleDateString('ko-KR') : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>처리 담당자</span>
                                                <span className="marker-type-complaint">
                                                    {complaintData?.admin_id || '미배정'}
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>우선순위</span>
                                                <span className="marker-type-complaint">
                                                    {complaintData?.c_report_status === 'C' ? '완료' :
                                                        complaintData?.c_report_status === 'P' ? '높음' : '보통'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="analysis-card">
                                            <h4>📍 위치 정보</h4>
                                            <p>주소: {complaintData?.addr || '주소 정보 없음'}</p>
                                            <p>좌표: {typeof complaintLat === 'number' ? complaintLat.toFixed(6) : 'N/A'}, {typeof complaintLon === 'number' ? complaintLon.toFixed(6) : 'N/A'}</p>
                                            <p>제보자: {complaintData?.c_reporter_name}</p>
                                            <p>연락처: {complaintData?.c_reporter_phone}</p>
                                        </div>
                                    </div>

                                    {/* AI 분석 결과 표시 */}
                                    {complaintAnalysisResult ? (
                                        <div className="analysis-card">
                                            <h4>🤖 AI 분석 결과</h4>
                                            <div className="detection-item">
                                                <span>종합 위험도 점수</span>
                                                <span className={`risk-score ${
                                                    complaintAnalysisResult.total_score >= 7 ? 'high' :
                                                    complaintAnalysisResult.total_score >= 4 ? 'medium' : 'low'
                                                }`}>
                                                    {complaintAnalysisResult.total_score}점
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>도로 위험도 점수</span>
                                                <span className={`risk-score ${
                                                    complaintAnalysisResult.road_score >= 7 ? 'high' :
                                                    complaintAnalysisResult.road_score >= 4 ? 'medium' : 'low'
                                                }`}>
                                                    {complaintAnalysisResult.road_score}점
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>날씨 점수</span>
                                                <span>{complaintAnalysisResult.weather_score}점</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>탐지된 손상</span>
                                                <span>
                                                    {[
                                                        complaintAnalysisResult.crack_cnt > 0 ? `균열: ${complaintAnalysisResult.crack_cnt}개` : '',
                                                        complaintAnalysisResult.break_cnt > 0 ? `포트홀: ${complaintAnalysisResult.break_cnt}개` : '',
                                                        complaintAnalysisResult.ali_crack_cnt > 0 ? `거북등 균열: ${complaintAnalysisResult.ali_crack_cnt}개` : ''
                                                    ].filter(Boolean).join(', ') || '손상 없음'}
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>날씨 정보</span>
                                                <span>
                                                    {complaintAnalysisResult.wh_type} / {complaintAnalysisResult.temp}°C / 
                                                    강수량: {complaintAnalysisResult.precipitation}mm / 
                                                    적설량: {complaintAnalysisResult.snowfall}mm
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>분석 일시</span>
                                                <span>
                                                    {new Date(complaintAnalysisResult.detected_at).toLocaleString('ko-KR')}
                                                </span>
                                            </div>
                                            {complaintAnalysisResult.image_path && (
                                                <div className="detection-item">
                                                    <span>분석 이미지</span>
                                                    <img 
                                                        src={complaintAnalysisResult.image_path} 
                                                        alt="분석 결과" 
                                                        style={{ 
                                                            maxWidth: '100%', 
                                                            maxHeight: '200px', 
                                                            borderRadius: '4px',
                                                            marginTop: '5px'
                                                        }} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="analysis-card">
                                            <h4>🤖 AI 분석 결과</h4>
                                            <div style={{ 
                                                textAlign: 'center', 
                                                padding: '20px', 
                                                color: '#666',
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: '4px'
                                            }}>
                                                📋 분석 전입니다.
                                            </div>
                                        </div>
                                    )}


                                    <div className="recommendations-card">
                                        <h4>💡 처리 가이드</h4>
                                        <ul>
                                            <li>접수 완료 상태: 담당자 배정 및 현장 확인</li>
                                            <li>처리 중 상태: 진행 상황 업데이트 및 소통</li>
                                            <li>처리 완료 상태: 결과 확인 및 민원인 통보</li>
                                            <li>긴급 민원: 즉시 현장 출동 및 조치</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    // CCTV AI 분석 핸들러
    const handleCCTVAnalysis = async () => {
        if (!detailData?.detail) {
            alert('CCTV 정보를 불러올 수 없습니다.');
            return;
        }

        try {
            setAiAnalysisLoading(true);
            setAiAnalysisResult(null);

            console.log('🚀 CCTV AI 분석 시작');
            const result = await performCCTVAnalysis(detailData.detail);

            // AI 분석 완료 후 모달 새로고침
            alert('AI 분석이 완료되었습니다!');
            
            // CCTV 위험도 데이터 다시 가져오기
            if (markerData?.cctv_idx) {
                await fetchCCTVRiskData(markerData.cctv_idx);
            }
            
            // AI 분석 결과 설정
            setAiAnalysisResult(result);

        } catch (error) {
            console.error('CCTV AI 분석 실패:', error);
            alert(`AI 분석 실패: ${error.message}`);
        } finally {
            setAiAnalysisLoading(false);
        }
    };

    // 침수 분석 핸들러
    const handleFloodAnalysis = async () => {
        if (!detailData?.detail) {
            alert('CCTV 정보를 불러올 수 없습니다.');
            return;
        }

        try {
            setFloodAnalysisLoading(true);
            setFloodAnalysisResult(null);

            console.log('🌊 침수 분석 시작');
            const result = await performFloodAnalysis(detailData.detail);

            // 침수 분석 완료 후 알림
            const resultText = result.flood_result === 'Y' ? '침수 감지' : '침수 없음';
            alert(`침수 분석이 완료되었습니다! 결과: ${resultText}`);
            
            // 침수 분석 결과 설정
            setFloodAnalysisResult(result);

        } catch (error) {
            console.error('침수 분석 실패:', error);
            alert(`침수 분석 실패: ${error.message}`);
        } finally {
            setFloodAnalysisLoading(false);
        }
    };


    // 주소 조회 함수 (WeatherDisplay.jsx에서 가져옴)
    const fetchAddressData = async (lat, lon) => {
        try {
            console.log(`주소 API 호출 중: 위도=${lat} 경도=${lon}`);
            
            const response = await fetch(`/api/weather/reverse?lat=${lat}&lon=${lon}`);
            const result = await response.json();
            
            console.log('🔍 API 전체 응답:', result);

            if (result.success) {
                console.log('주소 데이터:', result.data);
                console.log('🔍 받은 주소:', result.data.address.full);
                return result.data.address.full;
            } else {
                console.log('주소 변환 실패:', result.error);
                return null;
            }
        } catch (error) {
            console.error('주소 API 호출 실패:', error);
            return null;
        }
    };

    // 통제 추가 핸들러
    const handleAddControl = async () => {
        if (!detailData?.detail) {
            alert('제보 정보를 불러올 수 없습니다.');
            return;
        }

        const complaintData = detailData.detail;
        
        // 필수 데이터 확인
        if (!complaintData.c_report_detail || !complaintData.lat || !complaintData.lon) {
            alert('제보 상세 내용과 위치 정보가 필요합니다.');
            return;
        }

        try {
            // 주소 조회
            const address = await fetchAddressData(complaintData.lat, complaintData.lon);
            
            // 통제 타입 결정
            const controlType = complaintData.c_report_detail.includes('도로 파손') ? 'construction' : 'flood';
            
            // 통제 데이터 구성
            const controlData = {
                control_desc: complaintData.c_report_detail,
                control_addr: address || '주소 정보 없음',
                control_type: controlType,
                c_report_idx: complaintData.c_report_idx,
                lat: complaintData.lat,
                lon: complaintData.lon
            };

            console.log('🚧 통제 추가 요청:', controlData);

            // 서버에 통제 데이터 전송
            const response = await fetch('/api/road-control/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(controlData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ 통제 추가 성공:', result);
                alert('통제 구역이 성공적으로 추가되었습니다!');
            } else {
                console.error('통제 추가 실패:', response.status);
                const errorData = await response.json();
                alert(`통제 추가 실패: ${errorData.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('통제 추가 오류:', error);
            alert(`통제 추가 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    // 시민 제보 이미지 AI 분석 핸들러
    const handleComplaintImageAnalysis = async () => {
        if (!detailData?.detail) {
            alert('제보 정보를 불러올 수 없습니다.');
            return;
        }

        if (!detailData.detail.c_report_file1) {
            alert('분석할 이미지가 없습니다.');
            return;
        }

        try {
            setComplaintAnalysisLoading(true);
            setComplaintAnalysisResult(null);

            console.log('📸 시민 제보 이미지 AI 분석 시작');
            const result = await performComplaintImageAnalysis(detailData.detail);
            // AI 분석 완료 후 분석 결과 다시 조회
            if (detailData.detail.c_report_idx) {
                try {
                    const analysisResult = await getComplaintAnalysisResult(detailData.detail.c_report_idx);
                    if (analysisResult.success) {
                        setComplaintAnalysisResult(analysisResult.result);
                    }
                } catch (error) {
                    console.error('분석 결과 조회 실패:', error);
                }
            }

     

        } catch (error) {
            console.error('시민 제보 이미지 AI 분석 실패:', error);
            alert(`시민 제보 이미지 AI 분석 실패: ${error.message}`);
        } finally {
            setComplaintAnalysisLoading(false);
        }
    };

    // 시민 제보 침수 분석 핸들러
    const handleComplaintFloodAnalysis = async () => {
        if (!detailData?.detail) {
            alert('제보 정보를 불러올 수 없습니다.');
            return;
        }

        if (!detailData.detail.c_report_file1) {
            alert('분석할 이미지가 없습니다.');
            return;
        }

        try {
            setComplaintFloodLoading(true);
            setComplaintFloodResult(null);

            console.log('🌊 시민 제보 침수 분석 시작');
            const result = await performComplaintFloodAnalysis(detailData.detail);

            // 침수 분석 완료 후 분석 결과 다시 조회
            if (detailData.detail.c_report_idx) {
                try {
                    const floodResult = await getComplaintFloodResult(detailData.detail.c_report_idx);
                    if (floodResult.success) {
                        setComplaintFloodResult(floodResult.result);
                    }
                } catch (error) {
                    console.error('침수 분석 결과 조회 실패:', error);
                }
            }

        } catch (error) {
            console.error('시민 제보 침수 분석 실패:', error);
            alert(`시민 제보 침수 분석 실패: ${error.message}`);
        } finally {
            setComplaintFloodLoading(false);
        }
    };



    // 시민 제보 상태 텍스트 반환 함수
    const getComplaintStatusText = (status) => {
        switch (status) {
            case 'C': return '처리 완료';
            case 'P': return '처리 중';
            case 'R': return '접수 완료';
            default: return '접수 완료';
        }
    };

    const renderModalContent = () => {
        switch (markerType) {
            case 'cctv':
                return renderCCTVModal();
            case 'construction':
                return renderConstructionModal();
            case 'flood':
                return renderFloodModal();
            case 'complaint':
                return renderComplaintModal();
            default:
                return renderCCTVModal();
        }
    };

    return (
        <>
            <div className="modal" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    {renderModalContent()}
                    <div className="modal-footer">
                        <button className="btn btn-primary" onClick={onClose}>
                            확인
                        </button>
                        {markerType === 'cctv' && (
                            <button
                                className="btn btn-success"
                                onClick={() => generateCCTVReport(markerData)}
                            >
                                📄 보고서 생성
                            </button>
                        )}
                        {markerType === 'cctv' && (
                        <button
                            className="btn btn-warning"
                            onClick={markerType === 'cctv' ? () => handleCCTVAnalysis() : undefined}
                            disabled={markerType === 'cctv' && aiAnalysisLoading}
                        >
                            {markerType === 'cctv' && (aiAnalysisLoading ? '분석 중...' : '상세 분석')}
                           {/* {markerType === 'construction' && '공사 일정'}
                            {markerType === 'flood' && '긴급 신고'}
                            {markerType === 'complaint' && '긴급 출동'}*/}
                        </button>
                        )}
                        {markerType === 'complaint' && (
                            <>
                                {detailData?.detail?.c_report_detail === '도로 파손' && (
                                    <button className="btn btn-warning"
                                            onClick = { () => handleComplaintImageAnalysis() }
                                            disabled = {complaintAnalysisLoading}
                                     >
                                       { complaintAnalysisLoading ? '분석중...' : '상세 분석'}
                                    </button>
                                )}
                                <button 
                                    className="btn btn-danger"
                                    onClick={() => handleAddControl()}
                                    style={{
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        marginLeft: '10px'
                                    }}
                                >
                                    🚧 통제 추가
                                </button>

                            </>
                        )}

                        {markerType === 'cctv' && (
                            <button
                                className="btn btn-info"
                                onClick={() => handleFloodAnalysis()}
                                disabled={floodAnalysisLoading}
                            >
                                {floodAnalysisLoading ? '침수 분석 중...' : '침수 분석'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <ReportPreview
                isOpen={showReportPreview}
                onClose={() => setShowReportPreview(false)}
                reportData={reportData}
            />
        </>
    );
};

export default Modals;
