import React, { useEffect, useRef, useState } from "react";
import axios from 'axios';

const ConstructionFloodMap = ({ onMarkerClick }) => {
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const currentInfoWindowRef = useRef(null);
    const [constructionData, setConstructionData] = useState([]);
    const [floodData, setFloodData] = useState([]);
    const [loading, setLoading] = useState(true);

    // 공사/침수 마커 생성 및 표시 함수
    const createMarkers = async () => {
        console.log('🚧🌊 createMarkers 함수 시작');
        console.log('📊 입력 데이터:', {
            mapRef: !!mapRef.current,
            constructionDataLength: constructionData.length,
            floodDataLength: floodData.length
        });
        
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }

        try {
            console.log('🚧🌊 마커 생성 시작');
            
            // 기존 마커 제거
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => {
                    if (marker.getMap()) {
                        marker.setMap(null);
                    }
                });
                markersRef.current = [];
                console.log('✅ 기존 마커 제거 완료');
            }

            const allData = [...constructionData, ...floodData];
            if (allData.length === 0) {
                console.log('ℹ️ 표시할 데이터가 없습니다.');
                return;
            }

            console.log('📊 전체 데이터:', allData.length, '건');

            // 각 데이터에 대해 마커 생성
            for (const item of allData) {
                try {
                    console.log('🔍 데이터 처리 중:', {
                        control_idx: item.control_idx,
                        lat: item.lat,
                        lon: item.lon,
                        control_type: item.control_type
                    });
                    
                    // lat, lon이 있는 경우에만 마커 생성
                    if (item.lat && item.lon) {
                        console.log('✅ 위치 정보 확인됨, 마커 생성 시작');
                        const position = new window.naver.maps.LatLng(item.lat, item.lon);
                        console.log('📍 생성된 위치:', position);
                        
                        // 마커 아이콘 설정
                        let iconContent;
                        let iconColor;
                        let iconText;
                        
                        if (item.control_type === 'construction') {
                            iconColor = '#ff6b35'; // 주황색
                            iconText = '🚧';
                        } else if (item.control_type === 'flood') {
                            iconColor = '#3498db'; // 파란색
                            iconText = '🌊';
                        } else {
                            iconColor = '#95a5a6'; // 회색
                            iconText = '📍';
                        }
                        
                        // 마커 생성
                        const marker = new window.naver.maps.Marker({
                            position: position,
                            map: mapRef.current,
                            icon: {
                                content: `
                                    <div style="
                                        background-color: ${iconColor};
                                        color: white;
                                        border-radius: 50%;
                                        width: 30px;
                                        height: 30px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 16px;
                                        font-weight: bold;
                                        border: 3px solid white;
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                        cursor: pointer;
                                    ">
                                        ${iconText}
                                    </div>
                                `,
                                size: new window.naver.maps.Size(30, 30),
                                anchor: new window.naver.maps.Point(15, 15)
                            }
                        });
                        
                        console.log('🎯 마커 객체 생성 완료:', marker);

                        // 정보 윈도우 생성
                        const infoWindow = new window.naver.maps.InfoWindow({
                            content: `
                                <div style="
                                    padding: 15px;
                                    min-width: 200px;
                                    font-family: Arial, sans-serif;
                                ">
                                    <h3 style="margin: 0 0 10px 0; color: #333;">
                                        ${item.control_type === 'construction' ? '🚧 공사 통제' : '🌊 침수 통제'}
                                    </h3>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>설명:</strong> ${item.control_desc || '설명 없음'}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>주소:</strong> ${item.control_addr || '주소 정보 없음'}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>좌표:</strong> ${item.lat?.toFixed(6)}, ${item.lon?.toFixed(6)}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>시작:</strong> ${new Date(item.control_st_tm).toLocaleString()}
                                    </p>
                                    ${item.control_ed_tm ? `
                                        <p style="margin: 5px 0; font-size: 14px;">
                                            <strong>종료:</strong> ${new Date(item.control_ed_tm).toLocaleString()}
                                        </p>
                                    ` : ''}
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>상태:</strong> ${item.control_ed_tm ? '✅ 완료' : '⏳ 진행 중'}
                                    </p>
                                </div>
                            `,
                            maxWidth: 300,
                            backgroundColor: '#fff',
                            borderColor: iconColor,
                            borderWidth: 2,
                            anchorSize: new window.naver.maps.Size(10, 10),
                            anchorColor: '#fff',
                            pixelOffset: new window.naver.maps.Point(0, -10)
                        });

                        // 마커 클릭 이벤트
                        window.naver.maps.Event.addListener(marker, 'click', () => {
                            console.log('🎯 마커 클릭:', item);
                            
                            // 다른 정보 윈도우 닫기
                            if (currentInfoWindowRef.current) {
                                currentInfoWindowRef.current.close();
                            }
                            
                            // 현재 정보 윈도우 열기
                            infoWindow.open(mapRef.current, marker);
                            currentInfoWindowRef.current = infoWindow;
                            
                            // 외부 클릭 핸들러 호출
                            if (onMarkerClick) {
                                onMarkerClick(item.control_type, item);
                            }
                            
                            // 마커에 정보 윈도우 참조 저장
                            marker.infoWindow = infoWindow;
                        });

                        // 마커를 배열에 저장
                        markersRef.current.push(marker);
                        
                        console.log('✅ 마커 생성 완료:', { 
                            control_idx: item.control_idx, 
                            position: { lat: item.lat, lon: item.lon },
                            control_type: item.control_type
                        });
                    } else {
                        console.log('⚠️ 위치 정보가 없는 데이터:', item.control_idx);
                    }
                } catch (error) {
                    console.error('❌ 마커 생성 중 오류:', error);
                }
            }

            console.log('🎯 총', markersRef.current.length, '개의 마커가 생성되었습니다.');
            
        } catch (error) {
            console.error('❌ 마커 생성 중 오류:', error);
        }
    };

    // 데이터 로드 함수
    const loadData = async () => {
        try {
            setLoading(true);
            console.log('📡 데이터 로드 시작...');
            
            console.log('🔍 API 요청 URL 확인:', {
                construction: '/api/construction/list',
                flood: '/api/road-control/all'
            });
            
            const [constructionResponse, floodResponse] = await Promise.all([
                axios.get('/api/construction/list'),
                axios.get('/api/road-control/all')
            ]);
            
            console.log('📊 API 응답 상태:', {
                construction: constructionResponse.status,
                flood: floodResponse.status
            });
            
            console.log('📋 API 응답 데이터:', {
                construction: constructionResponse.data,
                flood: floodResponse.data
            });
            
            // 공사 데이터 처리
            let constructions = [];
            console.log('🔍 공사 데이터 처리 시작:', constructionResponse.data);
            
            if (constructionResponse.data && constructionResponse.data.constructions) {
                console.log('✅ 공사 데이터 구조 확인됨:', constructionResponse.data.constructions);
                constructions = Array.isArray(constructionResponse.data.constructions) 
                    ? constructionResponse.data.constructions.map(item => ({
                        ...item,
                        control_type: 'construction'
                    }))
                    : [];
            } else {
                console.log('⚠️ 공사 데이터 구조가 예상과 다름:', constructionResponse.data);
            }
            setConstructionData(constructions);
            console.log('🚧 공사 데이터 로드:', constructions.length, '개');
            console.log('🚧 공사 데이터 샘플:', constructions[0]);
            
            // 침수 데이터 처리
            let floods = [];
            console.log('🔍 침수 데이터 처리 시작:', floodResponse.data);
            
            if (floodResponse.data) {
                const allData = Array.isArray(floodResponse.data) ? floodResponse.data : [];
                console.log('📊 전체 통제 데이터:', allData.length, '개');
                console.log('📋 전체 통제 데이터 샘플:', allData[0]);
                
                floods = allData
                    .filter(item => item.control_type === 'flood')
                    .map(item => ({
                        ...item,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon)
                    }));
                console.log('🌊 침수 필터링 결과:', floods.length, '개');
            } else {
                console.log('⚠️ 침수 데이터가 없음:', floodResponse.data);
            }
            setFloodData(floods);
            console.log('🌊 침수 데이터 로드:', floods.length, '개');
            console.log('🌊 침수 데이터 샘플:', floods[0]);
            
            // 데이터 로드 완료 후 마커 생성 시도 (지도가 준비되어 있으면)
            if (mapRef.current && (constructions.length > 0 || floods.length > 0)) {
                console.log('📊 데이터 로드 완료 후 마커 생성 시도');
                setTimeout(() => {
                    createMarkers();
                }, 100);
            }
            
        } catch (error) {
            console.error('❌ 데이터 로드 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    // 지도 초기화
    useEffect(() => {
        const script = document.createElement("script");
        const clientId = "se9uk5m3m9";
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
        script.async = true;

        script.onload = () => {
            console.log('📜 네이버 지도 스크립트 로드 완료');
            
            // DOM 요소가 준비될 때까지 재시도
            let retryCount = 0;
            const maxRetries = 20; // 최대 2초 대기 (20 * 100ms)
            
            const tryInitMap = () => {
                retryCount++;
                const mapContainer = document.getElementById('constructionFloodMap');
                
                if (mapContainer) {
                    console.log('✅ constructionFloodMap 컨테이너 발견:', mapContainer);
                    
                    const mapOptions = {
                        center: new window.naver.maps.LatLng(35.159983, 126.8513092), // 광주 중심
                        zoom: 12,
                        mapTypeControl: true,
                        mapTypeControlOptions: {
                            style: window.naver.maps.MapTypeControlStyle.BUTTON,
                            position: window.naver.maps.Position.TOP_RIGHT
                        }
                    };

                    console.log('🗺️ 지도 옵션 설정 완료:', mapOptions);
                    
                    const map = new window.naver.maps.Map('constructionFloodMap', mapOptions);
                    mapRef.current = map;

                    console.log('🚧🌊 공사/침수 지도 초기화 완료');
                    console.log('📍 지도 객체:', map);
                    console.log('📍 지도 DOM 요소:', document.getElementById('constructionFloodMap'));

                    // 지도 초기화 완료 후 데이터 로드 시작
                    console.log('📊 지도 초기화 완료, 데이터 로드 시작...');
                    setTimeout(() => {
                        loadData();
                    }, 100);
                } else if (retryCount < maxRetries) {
                    console.log(`⏳ constructionFloodMap 컨테이너 대기 중... (${retryCount}/${maxRetries})`);
                    setTimeout(tryInitMap, 100);
                } else {
                    console.error('❌ constructionFloodMap 컨테이너를 찾을 수 없습니다. 최대 재시도 횟수 초과');
                }
            };
            
            setTimeout(tryInitMap, 100);
        };

        script.onerror = () => {
            console.error('네이버 지도 스크립트 로드 실패');
        };

        document.head.appendChild(script);

        return () => {
            // 컴포넌트 언마운트 시 마커 정리
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
            }
        };
    }, []);

    // 데이터가 변경될 때마다 마커 업데이트
    useEffect(() => {
        console.log('🔄 ConstructionFloodMap useEffect - 데이터 변경 감지:', {
            mapRef: !!mapRef.current,
            constructionDataLength: constructionData.length,
            floodDataLength: floodData.length,
            loading: loading
        });
        
        // 로딩이 완료되고 지도가 준비되어 있을 때만 마커 생성
        if (!loading && mapRef.current && (constructionData.length > 0 || floodData.length > 0)) {
            console.log('🔄 데이터 변경 감지, 마커 업데이트 시작');
            setTimeout(() => {
                createMarkers();
            }, 100);
        } else {
            console.log('⚠️ 마커 업데이트 조건 불충족:', {
                loading: loading,
                mapRef: !!mapRef.current,
                constructionDataLength: constructionData.length,
                floodDataLength: floodData.length
            });
        }
    }, [constructionData, floodData, loading]);

    // 특정 마커로 지도 이동하는 함수
    const moveToMarker = (lat, lon, data) => {
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }

        try {
            console.log('🎯 ConstructionFloodMap에서 마커 위치로 이동:', { lat, lon, data });
            
            // 해당 위치로 지도 이동
            const position = new window.naver.maps.LatLng(lat, lon);
            mapRef.current.setCenter(position);
            mapRef.current.setZoom(16); // 확대
            
            console.log('✅ ConstructionFloodMap에서 위치로 지도 이동 완료');
            
            // 해당 마커의 정보 윈도우 열기 (있는 경우)
            const targetMarker = markersRef.current.find(marker => {
                const markerPos = marker.getPosition();
                return markerPos.lat() === lat && markerPos.lng() === lon;
            });
            
            if (targetMarker && targetMarker.infoWindow) {
                // 다른 정보 윈도우 닫기
                if (currentInfoWindowRef.current && currentInfoWindowRef.current !== targetMarker.infoWindow) {
                    currentInfoWindowRef.current.close();
                }
                
                // 해당 마커의 정보 윈도우 열기
                targetMarker.infoWindow.open(mapRef.current, targetMarker);
                currentInfoWindowRef.current = targetMarker.infoWindow;
                console.log('✅ 해당 마커의 정보 윈도우 열기 완료');
            }
            
        } catch (error) {
            console.error('❌ ConstructionFloodMap에서 마커 이동 중 오류:', error);
        }
    };

    // moveToMarker 함수를 전역으로 노출
    useEffect(() => {
        window.moveToConstructionMarker = moveToMarker;
        console.log('✅ ConstructionFloodMap의 moveToConstructionMarker 함수를 전역으로 노출');
        
        return () => {
            delete window.moveToConstructionMarker;
            console.log('✅ ConstructionFloodMap의 moveToConstructionMarker 함수 전역 노출 해제');
        };
    }, []);

    if (loading) {
        return (
            <div style={{ 
                width: '100%', 
                height: '500px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                    <p>지도 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            id="constructionFloodMap" 
            style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '500px'
            }}
        />
    );
};

export default ConstructionFloodMap;
