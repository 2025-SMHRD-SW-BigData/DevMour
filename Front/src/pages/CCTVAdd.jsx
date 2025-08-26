import React, { useState, useRef, useEffect } from 'react';
import './DetailPages.css';
import AddMap from '../AddMap';

const CCTVAdd = () => {
    const [cctvUrl, setCctvUrl] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [manualLat, setManualLat] = useState('');
    const [manualLon, setManualLon] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [selectedCoordinates, setSelectedCoordinates] = useState(null);

    // URL에서 CCTV 정보 추출 (기존 로직 유지)
    const extractCCTVInfo = (url) => {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);

            const cctvName = decodeURIComponent(params.get('cctvname') || '');
            const cctvId = params.get('cctvid') || '';
            
            // 좌표 정보 추출 (참고용으로만 사용)
            const minX = parseFloat(params.get('minX') || '0');
            const minY = parseFloat(params.get('minY') || '0');
            const maxX = parseFloat(params.get('maxX') || '0');
            const maxY = parseFloat(params.get('maxY') || '0');

            // 중앙 좌표 계산 (참고용)
            const lat = ((minY + maxY) / 2).toFixed(14);
            const lon = ((minX + maxX) / 2).toFixed(14);

            return {
                cctv_name: cctvName,
                cctv_id: cctvId,
                lat: lat,
                lon: lon,
                cctv_url: url,
                cctv_status: 'A'
            };
        } catch (error) {
            console.error('URL 파싱 오류:', error);
            throw new Error('올바른 CCTV URL 형식이 아닙니다.');
        }
    };

    // 지도에서 좌표 선택
    const handleLocationSelect = (coordinates) => {
        const { lat, lng } = coordinates;
        
        setSelectedCoordinates({ lat, lng });
        setManualLat(lat.toFixed(6));
        setManualLon(lng.toFixed(6));
        
        console.log('📍 지도에서 선택된 좌표:', { lat, lng });
    };

    // 정보 추출 버튼 클릭
    const handleExtract = () => {
        if (!cctvUrl.trim()) {
            setError('CCTV URL을 입력해주세요.');
            return;
        }

        try {
            const data = extractCCTVInfo(cctvUrl);
            setExtractedData(data);
            setManualLat(data.lat);
            setManualLon(data.lon);
            setError('');
            setSuccess(false);
            // 지도 갱신을 위해 showMap 상태 변경
            setShowMap(prev => !prev);
            setTimeout(() => setShowMap(true), 100);
        } catch (error) {
            setError(error.message);
            setExtractedData(null);
        }
    };

    // 데이터베이스에 추가
    const handleAddToDatabase = async () => {
        if (!extractedData) {
            setError('추출된 데이터가 없습니다.');
            return;
        }

        // 수동 입력된 좌표 사용
        const finalData = {
            ...extractedData,
            lat: manualLat || extractedData.lat,
            lon: manualLon || extractedData.lon
        };

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/cctv/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalData),
            });

            if (response.ok) {
                const result = await response.json();
                setSuccess(true);
                setCctvUrl('');
                setExtractedData(null);
                setManualLat('');
                setManualLon('');
                setSelectedCoordinates(null);
                console.log('✅ CCTV 추가 성공:', result);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'CCTV 추가에 실패했습니다.');
            }
        } catch (error) {
            setError(error.message);
            console.error('❌ CCTV 추가 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    // 입력 필드 초기화
    const handleReset = () => {
        setCctvUrl('');
        setExtractedData(null);
        setManualLat('');
        setManualLon('');
        setSelectedCoordinates(null);
        setError('');
        setSuccess(false);
        // 지도는 계속 표시되도록 유지
    };

    return (
        <div className="detail-container">
            
            {/* 메인 컨텐츠 - 좌우 패널 구조 */}
            <div className="detail-main-content">
                {/* 왼쪽 패널 */}
                <div className="detail-left-panel">
                    {/* URL 입력 섹션 */}
                    <div className="summary-card">
                        <h2>🔗 CCTV URL 입력</h2>
                        <div className="input-group">
                            <label htmlFor="cctvUrl">CCTV 스트리밍 URL:</label>
                            <input
                                type="url"
                                id="cctvUrl"
                                value={cctvUrl}
                                onChange={(e) => setCctvUrl(e.target.value)}
                                placeholder="https://www.utic.go.kr/jsp/map/cctvStream.jsp?..."
                                className="url-input"
                            />
                        </div>
                        
                        <div className="button-group">
                            <button 
                                onClick={handleExtract}
                                className="btn btn-primary"
                                disabled={!cctvUrl.trim()}
                            >
                                🔍 정보 추출
                            </button>
                            <button 
                                onClick={handleReset}
                                className="btn btn-secondary"
                            >
                                🔄 초기화
                            </button>
                        </div>
                    </div>

                    {/* 추출된 정보 표시 */}
                    {extractedData && (
                        <div className="summary-card">
                            <h2>📊 추출된 CCTV 정보</h2> 
                            <button 
                                onClick={handleAddToDatabase}
                                className="btn btn-success"
                                disabled={loading || (!manualLat && !manualLon)}
                            >
                                {loading ? '⏳ 추가 중...' : '💾 데이터베이스에 추가'}
                            </button>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>카메라 이름:</label>
                                    <span>{extractedData.cctv_name}</span>
                                </div>
                                <div className="info-item">
                                    <label>CCTV ID:</label>
                                    <span>{extractedData.cctv_id}</span>
                                </div>
                                <div className="info-item">
                                    <label>상태:</label>
                                    <span className="status-active">정상</span>
                                </div>
                            </div>
                            
                            <div className="url-preview">
                                <label>스트리밍 URL:</label>
                                <div className="url-display">
                                    {extractedData.cctv_url}
                                </div>
                            </div>

                            {/* 좌표 입력 섹션 */}
                            <div className="coordinates-section">
                                <h4>📍 정확한 위치 좌표 입력</h4>
                                <div className="coordinates-inputs">
                                    <div className="input-group">
                                        <label htmlFor="cctvLat">위도:</label>
                                        <input
                                            type="number"
                                            id="cctvLat"
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            placeholder="35.192764"
                                            step="0.000001"
                                            className="coordinate-input"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="cctvLon">경도:</label>
                                        <input
                                            type="number"
                                            id="cctvLon"
                                            value={manualLon}
                                            onChange={(e) => setManualLon(e.target.value)}
                                            placeholder="126.864441"
                                            step="0.000001"
                                            className="coordinate-input"
                                        />
                                    </div>
                                </div>
                                
                                {selectedCoordinates && (
                                    <div className="selected-coordinates">
                                        <span>✅ 선택된 좌표: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}</span>
                                    </div>
                                )}
                            </div>

                            
                        </div>
                    )}
                </div>

                {/* 오른쪽 패널 */}
                <div className="detail-right-panel">
                    {/* 지도 표시 */}
                    <div className="summary-card">
                        <h2>🗺️ CCTV 위치 선택</h2>
                        <div className="map-container">
                            <AddMap 
                                onLocationSelect={handleLocationSelect}
                                initialCenter={{ 
                                    lat: parseFloat(extractedData?.lat) || 35.192764, 
                                    lng: parseFloat(extractedData?.lon) || 126.864441 
                                }}
                                key={showMap ? 'updated' : 'initial'} // 지도 갱신을 위한 key
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 성공 메시지 */}
            {success && (
                <div className="success-message">
                    <div className="success-icon">✅</div>
                    <h3>CCTV가 성공적으로 추가되었습니다!</h3>
                    <p>이제 지도에서 해당 CCTV를 확인할 수 있습니다.</p>
                </div>
            )}

            {/* 에러 메시지 */}
            {error && (
                <div className="error-message">
                    <div className="error-icon">❌</div>
                    <h3>오류가 발생했습니다</h3>
                    <p>{error}</p>
                </div>
            )}

            {/* 사용 예시 */}
            <div className="usage-example">
                <h3>💡 사용 방법</h3>
                <ol>
                    <li>CCTV 스트리밍 URL을 입력하고 "정보 추출" 버튼 클릭</li>
                    <li>지도가 URL에서 추출한 좌표로 자동 이동</li>
                    <li>지도에서 정확한 CCTV 위치 클릭하여 좌표 선택</li>
                    <li>선택된 좌표 확인 후 "데이터베이스에 추가" 버튼 클릭</li>
                </ol>
            </div>
        </div>
    );
};

export default CCTVAdd;