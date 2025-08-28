import React, { useEffect, useRef, useState } from "react";
import { InfoContext } from "./context/InfoContext";
import { useContext } from "react";

const AlertMap = ({ alertData = [] }) => {
    const mapRef = useRef(null);
    const alertMarkersRef = useRef([]);
    const currentInfoWindowRef = useRef(null);
    const { lat, setLat, lon, setLon } = useContext(InfoContext);

    // 알림 심각도에 따른 색상 반환
    const getAlertLevelColor = (alertLevel) => {
        switch (alertLevel) {
            case '매우 위험': return '#e74c3c'; // 빨간색 (가장 위험)
            case '위험': return '#f39c12';      // 주황색
            case '경고': return '#f1c40f';      // 노란색
            case '안전': return '#27ae60';      // 초록색
            default: return '#95a5a6';          // 회색
        }
    };

    // 알림 심각도 텍스트 반환
    const getAlertLevelText = (alertLevel) => {
        switch (alertLevel) {
            case '매우 위험': return '매우 위험';
            case '위험': return '위험';
            case '경고': return '경고';
            case '안전': return '안전';
            default: return '기타';
        }
    };

    // 알림 수신자 유형 텍스트 반환
    const getRecipientText = (recipientType) => {
        switch (recipientType) {
            case 'admin': return '관리자';
            case 'citizen': return '시민';
            case 'all': return '전체';
            default: return '기타';
        }
    };

    // 알림 마커 생성 및 표시 함수
    const createAlertMarkers = async () => {
        console.log('🚨 createAlertMarkers 함수 시작');
        console.log('📊 입력 데이터:', {
            mapRef: !!mapRef.current,
            alertDataLength: alertData.length,
            alertData: alertData
        });
        
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }

        try {
            console.log('🚨 알림 마커 생성 시작');
            
            // 기존 알림 마커 제거
            if (alertMarkersRef.current.length > 0) {
                alertMarkersRef.current.forEach(marker => {
                    if (marker.getMap()) {
                        marker.setMap(null);
                    }
                });
                alertMarkersRef.current = [];
                console.log('✅ 기존 알림 마커 제거 완료');
            }

            if (alertData.length === 0) {
                console.log('ℹ️ 표시할 알림 데이터가 없습니다.');
                return;
            }

            console.log('📊 알림 데이터:', alertData.length, '건');
            console.log('📋 첫 번째 알림 데이터 샘플:', alertData[0]);

            // 각 알림에 대해 직접 lat, lon 데이터를 사용하여 마커 생성
            for (const alert of alertData) {
                try {
                    console.log('🔍 알림 데이터 처리 중:', {
                        alert_idx: alert.alert_idx,
                        lat: alert.lat,
                        lon: alert.lon,
                        addr: alert.addr
                    });
                    
                    // lat, lon이 있는 경우에만 마커 생성
                    if (alert.lat && alert.lon) {
                        console.log('✅ 위치 정보 확인됨, 마커 생성 시작');
                        const position = new window.naver.maps.LatLng(alert.lat, alert.lon);
                        console.log('📍 생성된 위치:', position);
                        
                        // 알림 마커 생성
                        const marker = new window.naver.maps.Marker({
                            position: position,
                            map: mapRef.current,
                            icon: {
                                content: `
                                    <div style="
                                        background-color: ${getAlertLevelColor(alert.alert_level)};
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
                                        🚨
                                    </div>
                                `,
                                size: new window.naver.maps.Size(30, 30),
                                anchor: new window.naver.maps.Point(15, 15)
                            }
                        });
                        
                        console.log('🎯 마커 객체 생성 완료:', marker);

                                                // 알림 정보 윈도우 생성 (주소 정보 포함)
                        const infoWindow = new window.naver.maps.InfoWindow({
                            content: `
                                <div style="
                                    padding: 15px;
                                    min-width: 200px;
                                    font-family: Arial, sans-serif;
                                ">
                                    <h3 style="margin: 0 0 10px 0; color: #333;">🚨 알림 정보</h3>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>메시지:</strong> ${alert.alert_msg || '메시지 없음'}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>심각도:</strong> 
                                        <span style="
                                            color: ${getAlertLevelColor(alert.alert_level)};
                                            font-weight: bold;
                                        ">${getAlertLevelText(alert.alert_level)}</span>
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>수신자:</strong> ${getRecipientText(alert.recepient_type)}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>주소:</strong> ${alert.addr || '주소 정보 없음'}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>좌표:</strong> ${alert.lat?.toFixed(6)}, ${alert.lon?.toFixed(6)}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>전송시간:</strong> ${new Date(alert.sented_at).toLocaleString()}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 14px;">
                                        <strong>상태:</strong> ${alert.is_read === 'Y' ? '✅ 읽음' : '📬 안읽음'}
                                    </p>
                                </div>
                            `,
                            maxWidth: 300,
                            backgroundColor: '#fff',
                            borderColor: getAlertLevelColor(alert.alert_level),
                            borderWidth: 2,
                            anchorSize: new window.naver.maps.Size(10, 10),
                            anchorColor: '#fff',
                            pixelOffset: new window.naver.maps.Point(0, -10)
                        });

                        // 마커 클릭 이벤트
                        window.naver.maps.Event.addListener(marker, 'click', () => {
                            console.log('🎯 알림 마커 클릭:', alert);
                            
                            // 다른 정보 윈도우 닫기
                            if (currentInfoWindowRef.current) {
                                currentInfoWindowRef.current.close();
                            }
                            
                            // 현재 정보 윈도우 열기
                            infoWindow.open(mapRef.current, marker);
                            currentInfoWindowRef.current = infoWindow;
                            
                            // 마커에 정보 윈도우 참조 저장
                            marker.infoWindow = infoWindow;
                        });

                        // 마커를 배열에 저장
                        alertMarkersRef.current.push(marker);
                        
                        console.log('✅ 알림 마커 생성 완료:', { 
                            alert_idx: alert.alert_idx, 
                            position: { lat: alert.lat, lon: alert.lon },
                            addr: alert.addr
                        });
                    } else {
                        console.log('⚠️ 위치 정보가 없는 알림:', alert.alert_idx);
                    }
                } catch (error) {
                    console.error('❌ 알림 마커 생성 중 오류:', error);
                }
            }

            console.log('🎯 총', alertMarkersRef.current.length, '개의 알림 마커가 생성되었습니다.');
            
        } catch (error) {
            console.error('❌ 알림 마커 생성 중 오류:', error);
        }
    };

    // 지도 초기화
    useEffect(() => {
        const script = document.createElement("script");
        const newClientId = "se9uk5m3m9"; // NaverMap.jsx와 동일한 API 키
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${newClientId}&submodules=geocoder`;
        script.async = true;

        script.onload = () => {
            console.log('📜 네이버 지도 스크립트 로드 완료');
            
            const mapOptions = {
                center: new window.naver.maps.LatLng(35.146667, 126.888667), // NaverMap.jsx와 동일한 중심점
                zoom: 13,
                mapTypeControl: true,
                maxBounds: new window.naver.maps.LatLngBounds(
                    new window.naver.maps.LatLng(35.0, 126.6),
                    new window.naver.maps.LatLng(35.2, 127.0)
                ),
                minZoom: 11
            };

            console.log('🗺️ 지도 옵션 설정 완료:', mapOptions);
            
            const map = new window.naver.maps.Map('alertMap', mapOptions);
            mapRef.current = map;

            console.log('🚨 알림 전용 지도 초기화 완료');
            console.log('📍 지도 객체:', map);
            console.log('📍 지도 DOM 요소:', document.getElementById('alertMap'));

            // 지도 클릭 이벤트
            window.naver.maps.Event.addListener(map, 'click', (e) => {
                console.log('지도 클릭됨:', e.coord.y, e.coord.x);
                setLat(e.coord.y);
                setLon(e.coord.x);
            });

            // 지도 초기화 완료 후 마커 생성 시도
            if (alertData.length > 0) {
                console.log('🗺️ 지도 초기화 완료 후 마커 생성 시도');
                setTimeout(() => {
                    createAlertMarkers();
                }, 100);
            }

        };

        script.onerror = () => {
            console.error('네이버 지도 스크립트 로드 실패');
        };

        document.head.appendChild(script);

        return () => {
            // 컴포넌트 언마운트 시 마커 정리
            if (alertMarkersRef.current.length > 0) {
                alertMarkersRef.current.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
            }
        };
    }, []);

    // alertData가 변경될 때마다 마커 업데이트
    useEffect(() => {
        console.log('🔄 AlertMap useEffect - alertData 변경 감지:', {
            mapRef: !!mapRef.current,
            alertDataLength: alertData.length,
            alertData: alertData
        });
        
        if (mapRef.current && alertData.length > 0) {
            console.log('🔄 알림 데이터 변경 감지, 마커 업데이트 시작');
            createAlertMarkers();
        } else {
            console.log('⚠️ 마커 업데이트 조건 불충족:', {
                mapRef: !!mapRef.current,
                alertDataLength: alertData.length
            });
        }
    }, [alertData]);

    // 컴포넌트 마운트 시점 로깅
    useEffect(() => {
        console.log('🚀 AlertMap 컴포넌트 마운트됨');
        console.log('📊 초기 alertData:', {
            length: alertData.length,
            data: alertData
        });
    }, []);

    // alertData prop 변경 감지 (디버깅용)
    useEffect(() => {
        console.log('📡 AlertMap prop 변경 감지:', {
            alertDataLength: alertData.length,
            alertData: alertData,
            timestamp: new Date().toISOString()
        });
    }, [alertData]);

    // 특정 알림 마커로 지도 이동하는 함수
    const moveToAlertMarker = (lat, lon, alertData) => {
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }

        try {
            console.log('🎯 AlertMap에서 알림 마커 위치로 이동:', { lat, lon, alertData });
            
            // 해당 위치로 지도 이동
            const position = new window.naver.maps.LatLng(lat, lon);
            mapRef.current.setCenter(position);
            mapRef.current.setZoom(16); // 확대
            
            console.log('✅ AlertMap에서 알림 위치로 지도 이동 완료');
            
            // 해당 마커의 정보 윈도우 열기 (있는 경우)
            const targetMarker = alertMarkersRef.current.find(marker => {
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
                console.log('✅ 해당 알림 마커의 정보 윈도우 열기 완료');
            }
            
        } catch (error) {
            console.error('❌ AlertMap에서 알림 마커 이동 중 오류:', error);
        }
    };

    // moveToAlertMarker 함수를 전역으로 노출
    useEffect(() => {
        window.moveToAlertMarker = moveToAlertMarker;
        console.log('✅ AlertMap의 moveToAlertMarker 함수를 전역으로 노출');
        
        return () => {
            delete window.moveToAlertMarker;
            console.log('✅ AlertMap의 moveToAlertMarker 함수 전역 노출 해제');
        };
    }, []);

    return (
        <div 
            id="alertMap" 
            style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '500px'
            }}
        />
    );
};

export default AlertMap;
