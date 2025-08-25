import React, { useEffect, useState, useRef, useContext } from "react";
import { InfoContext } from "./context/InfoContext";
import axios from 'axios';

const NaverMap = ({ onMarkerClick, riskData, showRiskMarkers, filterType: initialFilterType = 'all', hideFilterButtons = false, complaintData, showComplaintMarkers = false }) => {
    const mapRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const isEditingRef = useRef(isEditing);
    const [selectedMarkerType, setSelectedMarkerType] = useState('cctv');
    const selectedMarkerTypeRef = useRef(selectedMarkerType);
    const [markers, setMarkers] = useState([]);
    const markersRef = useRef([]);
    const [filterType, setFilterType] = useState(initialFilterType);
    const [alertMarker, setAlertMarker] = useState(null);
    const alertMarkerRef = useRef(null);
    const [riskMarkers, setRiskMarkers] = useState([]);
    const [complaintMarkers, setComplaintMarkers] = useState([]);
    const alertMarkersRef = useRef([]);
    const currentInfoWindowRef = useRef(null);




    const { lat, setLat, lon, setLon } = useContext(InfoContext);

    const latRef = useRef(lat);
    const lonRef = useRef(lon);

    useEffect(() => {
        latRef.current = lat;
        lonRef.current = lon;
    }, [lat, lon]);

    useEffect(() => {
        isEditingRef.current = isEditing;
    }, [isEditing]);

    useEffect(() => {
        selectedMarkerTypeRef.current = selectedMarkerType;
    }, [selectedMarkerType]);

    // 초기 필터 타입이 변경될 때 filterType 상태 업데이트
    useEffect(() => {
        console.log('🔄 초기 필터 타입 변경:', initialFilterType);
        setFilterType(initialFilterType);
    }, [initialFilterType]);

    // 위험도 데이터가 변경될 때 마커 업데이트
    useEffect(() => {
        const riskDataLength = riskData?.length;
        console.log('🔄 위험도 데이터/모드 변경 감지:', { showRiskMarkers, riskDataLength });
        if (showRiskMarkers && riskData && riskData.length > 0) {
            console.log('✅ 위험도 마커 추가 실행');
            // 지도가 준비되었는지 확인하고 마커 추가
            if (mapRef.current) {
                addRiskMarkers(riskData);
            } else {
                console.log('⏳ 지도가 아직 준비되지 않음, 잠시 후 재시도');
                // 지도가 준비되지 않았다면 잠시 후 재시도
                setTimeout(() => {
                    if (mapRef.current) {
                        addRiskMarkers(riskData);
                    }
                }, 1000);
            }
        } else {
            console.log('❌ 위험도 마커 숨김 또는 데이터 없음');
            // Hide risk markers if not showing or no data
            if (riskMarkers.length > 0) {
                riskMarkers.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
                setRiskMarkers([]);
            }
        }
    }, [riskData, showRiskMarkers]);

    // 필터 타입 변경 시 위험도 마커도 함께 필터링
    useEffect(() => {
        if (!mapRef.current) return;
        
        console.log('🔄 필터 타입 변경:', filterType);
        console.log('🔄 showRiskMarkers 상태:', showRiskMarkers);
        console.log('🔄 현재 위험도 마커 개수:', riskMarkers.length);
        
        // 위험도 마커 필터링 - showRiskMarkers와 filterType 모두 고려
        if (riskMarkers.length > 0) {
            riskMarkers.forEach((marker, index) => {
                if (marker && marker.setMap) {
                    // showRiskMarkers가 true이고, filterType이 'all' 또는 'risk'일 때만 표시
                    if (showRiskMarkers && (filterType === 'all' || filterType === 'risk')) {
                        console.log(`✅ 위험도 마커 ${index + 1} 표시 (showRiskMarkers: ${showRiskMarkers}, filterType: ${filterType})`);
                        marker.setMap(mapRef.current);
                    } else {
                        console.log(`❌ 위험도 마커 ${index + 1} 숨김 (showRiskMarkers: ${showRiskMarkers}, filterType: ${filterType})`);
                        marker.setMap(null);
                        // 숨김 후 상태 확인
                        setTimeout(() => {
                            const currentMap = marker.getMap();
                            console.log(`🔍 마커 ${index + 1} 숨김 후 상태 확인: map=${currentMap ? '표시됨' : '숨겨짐'}`);
                        }, 100);
                    }
                }
            });
        }
    }, [filterType, showRiskMarkers, riskMarkers]);

    // 시민 제보 데이터가 변경될 때 마커 업데이트
    useEffect(() => {
        const complaintDataLength = complaintData?.length;
        console.log('🔄 시민 제보 데이터/모드 변경 감지:', { showComplaintMarkers, complaintDataLength });
        if (showComplaintMarkers && complaintData && complaintData.length > 0) {
            console.log('✅ 시민 제보 마커 추가 실행');
            // 지도가 준비되었는지 확인하고 마커 추가
            if (mapRef.current) {
                addComplaintMarkers(complaintData);
            } else {
                console.log('⏳ 지도가 아직 준비되지 않음, 잠시 후 재시도');
                // 지도가 준비되지 않았다면 잠시 후 재시도
                setTimeout(() => {
                    if (mapRef.current) {
                        addComplaintMarkers(complaintData);
                    }
                }, 1000);
            }
        } else {
            console.log('❌ 시민 제보 마커 숨김 또는 데이터 없음');
            // Hide complaint markers if not showing or no data
            if (complaintMarkers.length > 0) {
                complaintMarkers.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
                setComplaintMarkers([]);
            }
        }
    }, [complaintData, showComplaintMarkers]);

    // 필터 타입이 'alert' 또는 'risk'일 때 마커 처리
    useEffect(() => {
        if (filterType === 'alert' && mapRef.current) {
            console.log('🚨 알림 마커 생성 시작 (filterType: alert)');
            
            // 기존 일반 마커들 제거
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
                markersRef.current = [];
                console.log('✅ 기존 일반 마커 제거 완료');
            }
            
            createAlertMarkers();
        } else if (filterType === 'risk' && mapRef.current) {
            console.log('🚨 위험도 모드: 일반 마커 숨김 (filterType: risk)');
            
            // 기존 일반 마커들 제거
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
                markersRef.current = [];
                console.log('✅ 위험도 모드에서 일반 마커 제거 완료');
            }
        } else if (filterType !== 'alert' && filterType !== 'risk' && alertMarkersRef.current.length > 0) {
            console.log('🚨 알림 마커 숨김 (filterType:', filterType, ')');
            // 알림 마커 숨기기
            alertMarkersRef.current.forEach(marker => {
                if (marker && marker.setMap) {
                    marker.setMap(null);
                }
            });
            
            // filterType이 'alert'나 'risk'가 아닐 때는 일반 마커 다시 로드
            if (mapRef.current) {
                console.log('🔄 일반 마커 다시 로드 시작');
                fetchMarkers(mapRef.current);
            }
        }
    }, [filterType]);

    // 필터 타입 변경 시 시민 제보 마커도 함께 필터링
    useEffect(() => {
        if (!mapRef.current) return;
        
        console.log('🔄 시민 제보 마커 필터링:', filterType);
        console.log('🔄 showComplaintMarkers 상태:', showComplaintMarkers);
        console.log('🔄 현재 시민 제보 마커 개수:', complaintMarkers.length);
        
        // 시민 제보 마커 필터링 - showComplaintMarkers와 filterType 모두 고려
        if (complaintMarkers.length > 0) {
            complaintMarkers.forEach((marker, index) => {
                if (marker && marker.setMap) {
                    // showComplaintMarkers가 true이고, filterType이 'all' 또는 'complaint'일 때만 표시
                    if (showComplaintMarkers && (filterType === 'all' || filterType === 'complaint')) {
                        console.log(`✅ 시민 제보 마커 ${index + 1} 표시 (showComplaintMarkers: ${showComplaintMarkers}, filterType: ${filterType})`);
                        marker.setMap(mapRef.current);
                    } else {
                        console.log(`❌ 시민 제보 마커 ${index + 1} 숨김 (showComplaintMarkers: ${showComplaintMarkers}, filterType: ${filterType})`);
                        marker.setMap(null);
                    }
                }
            });
        }
    }, [filterType, showComplaintMarkers, complaintMarkers]);

    // 위험도 마커가 추가된 후 필터 상태 확인
    useEffect(() => {
        if (!mapRef.current || riskMarkers.length === 0) return;
        
        console.log('🔄 위험도 마커 상태 확인, 현재 필터:', filterType);
        console.log('🔄 showRiskMarkers 상태:', showRiskMarkers);
        
        riskMarkers.forEach((marker, index) => {
            if (marker && marker.setMap) {
                // showRiskMarkers가 true이고, filterType이 'all' 또는 'risk'일 때만 표시
                if (showRiskMarkers && (filterType === 'all' || filterType === 'risk')) {
                    console.log(`✅ 위험도 마커 ${index + 1} 상태 확인 - 표시 (showRiskMarkers: ${showRiskMarkers}, filterType: ${filterType})`);
                    if (marker.getMap() !== mapRef.current) {
                        marker.setMap(mapRef.current);
                    }
                } else {
                    console.log(`❌ 위험도 마커 ${index + 1} 상태 확인 - 숨김 (showRiskMarkers: ${showRiskMarkers}, filterType: ${filterType})`);
                    if (marker.getMap() !== null) {
                        marker.setMap(null);
                        // 숨김 후 상태 확인
                        setTimeout(() => {
                            const currentMap = marker.getMap();
                            console.log(`🔍 마커 ${index + 1} 상태 확인 후 숨김 결과: map=${currentMap ? '표시됨' : '숨겨짐'}`);
                        }, 100);
                    }
                }
            }
        });
        
    }, [riskMarkers, filterType, showRiskMarkers]);

    // showRiskMarkers가 false일 때 위험도 마커 숨김
    useEffect(() => {
        if (!mapRef.current || riskMarkers.length === 0) return;
        
        if (!showRiskMarkers) {
            console.log('🔄 showRiskMarkers가 false - 모든 위험도 마커 숨김');
            riskMarkers.forEach(marker => {
                if (marker && marker.setMap) {
                    console.log('🔄 위험도 마커 숨김:', marker);
                    marker.setMap(null);
                }
            });
        }
    }, [showRiskMarkers, riskMarkers]);

    // 외부에서 호출할 수 있도록 함수 노출
    useEffect(() => {
        if (mapRef.current) {
            // 전역 함수로 노출 (Dashboard.jsx에서 호출 가능)
            window.moveToRiskMarker = moveToRiskMarker;
            window.moveToComplaintMarker = moveToComplaintMarker;
            window.moveToConstructionMarker = moveToConstructionMarker;
            window.moveToAlertMarker = moveToAlertMarker;
            console.log('✅ moveToRiskMarker, moveToComplaintMarker, moveToConstructionMarker, moveToAlertMarker 함수를 전역으로 노출');
        }
    }, [mapRef.current]);



    // ✅ 마커 타입별 설정 (markerTypes 객체 제거, 직접 설정으로 변경)
    const getMarkerConfig = (type) => {
        switch (type) {
            case 'cctv':
                return {
                    name: 'CCTV',
                    color: '#4CAF50',
                    icon: '📹',
                    size: { width: 30, height: 30 }
                };
            case 'construction':
                return {
                    name: '공사중',
                    color: '#FF9800',
                    icon: '🚧',
                    size: { width: 30, height: 30 }
                };
            case 'flood':
                return {
                    name: '침수',
                    color: '#2196F3',
                    icon: '🌊',
                    size: { width: 30, height: 30 }
                };
            case 'risk':
                return {
                    name: '위험도',
                    color: '#FF5722',
                    icon: '🚨',
                    size: { width: 30, height: 30 }
                };
            default:
                return {
                    name: '마커',
                    color: '#9B59B6',
                    icon: '📍',
                    size: { width: 30, height: 30 }
                };
        }
    };

    const riskMarkerTypes = {
        high: {
            name: '고위험',
            color: '#e74c3c',
            icon: '🔴',
            size: { width: 30, height: 30 }
        },
        medium: {
            name: '주의',
            color: '#f39c12',
            icon: '🟠',
            size: { width: 30, height: 30 }
        },
        low: {
            name: '안전',
            color: '#27ae60',
            icon: '🟢',
            size: { width: 30, height: 30 }
        }
    };



    const createMarkerContent = (type) => {
        const config = getMarkerConfig(type);
        return `
      <div style="
        background-color: ${config.color};
        border-radius: 50%;
        width: ${config.size.width}px;
        height: ${config.size.height}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        ${config.icon}
      </div>
    `;
    };

    const createRiskMarkerContent = (riskLevel) => {
        const config = riskMarkerTypes[riskLevel];
        console.log(`🎨 위험도 마커 HTML 생성: ${riskLevel} 레벨, 설정:`, config);
        
        const htmlContent = `
      <div style="
        width: 14px;
        height: 18px;
        position: relative;
        margin: 0 auto;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid ${config.color};
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        clip-path: polygon(5% 0%, 95% 0%, 85% 100%, 15% 100%);
      " onmouseover="this.style.transform='scale(1.2)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.2)'">
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
          color: ${config.color};
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          pointer-events: auto;
          cursor: pointer;
        ">
          !
        </div>
      </div>
    `;
        
        console.log(`🎨 생성된 HTML:`, htmlContent);
        return htmlContent;
    };

    // 시민 제보 마커 HTML 생성
    const createComplaintMarkerContent = (status) => {
        let color, icon;
        
        switch (status) {
            case 'C': // 처리 완료
                color = '#27ae60';
                icon = '✅';
                break;
            case 'P': // 처리 중
                color = '#f39c12';
                icon = '🔄';
                break;
            case 'R': // 접수 완료
                color = '#3498db';
                icon = '📝';
                break;
            default:
                color = '#95a5a6';
                icon = '📋';
        }
        
        const htmlContent = `
            <div style="
                width: 30px;
                height: 30px;
                position: relative;
                margin: 0 auto;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border: 2px solid ${color};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            " onmouseover="this.style.transform='scale(1.2)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.2)'">
                <div style="
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: ${color};
                    pointer-events: auto;
                    cursor: pointer;
                ">
                    ${icon}
                </div>
            </div>
        `;
        
        return htmlContent;
    };

    // 시민 제보 상태 텍스트 반환
    const getComplaintStatusText = (status) => {
        switch (status) {
            case 'C': return '처리 완료';
            case 'P': return '처리 중';
            case 'R': return '접수 완료';
            default: return '접수 완료';
        }
    };









    // 위험도 점수에 따른 레벨 반환
    const getRiskLevel = (score) => {
        if (score >= 8.0) return 'high';
        if (score >= 6.0) return 'medium';
        return 'low';
    };

    // 직접 위험도 InfoWindow 표시 (마커 클릭 이벤트 트리거 실패 시 대안)
    const showRiskInfoWindowDirectly = (marker, riskData) => {
        if (!mapRef.current || !marker || !riskData) {
            console.log('❌ InfoWindow 직접 표시 실패: 조건 불충족');
            return;
        }
        
        console.log('🔄 InfoWindow 직접 표시 시도:', riskData);
        
        try {
            const riskLevel = getRiskLevel(riskData.totalRiskScore);
            const infoWindow = new window.naver.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; min-width: 200px;">
                        <h4 style="margin: 0 0 10px 0; color: ${riskMarkerTypes[riskLevel].color};">${riskMarkerTypes[riskLevel].icon} ${riskMarkerTypes[riskLevel].name}</h4>
                        <p style="margin: 5px 0;"><strong>위험도 점수:</strong> ${riskData.totalRiskScore.toFixed(1)}/20.0</p>
                        <p style="margin: 5px 0;"><strong>위치:</strong> ${riskData.address || '주소 정보 없음'}</p>
                        <p style="margin: 5px 0;"><strong>상세:</strong> ${riskData.riskDetail || '상세 정보가 없습니다.'}</p>
                    </div>
                `,
                backgroundColor: "#fff",
                borderColor: riskMarkerTypes[riskLevel].color,
                borderWidth: 2,
                anchorSize: new window.naver.maps.Size(20, 20),
                anchorColor: "#fff",
                pixelOffset: new window.naver.maps.Point(0, -9) // 마커 높이의 절반만큼 위로
            });
            
            // 기존 InfoWindow가 있다면 닫기
            if (window.currentRiskInfoWindow) {
                window.currentRiskInfoWindow.close();
            }
            
            // 새 InfoWindow 표시
            infoWindow.open(mapRef.current, marker);
            window.currentRiskInfoWindow = infoWindow;
            
            console.log('✅ InfoWindow 직접 표시 완료');
        } catch (error) {
            console.error('❌ InfoWindow 직접 표시 실패:', error);
        }
    };

    // 위험도 마커를 찾아서 해당 위치로 이동하고 상세정보창 띄우기
    const moveToRiskMarker = (lat, lon, riskData) => {
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }
        
        console.log('🎯 위험도 마커 위치로 이동:', { lat, lon, riskData });
        console.log('🔍 현재 위험도 마커 개수:', riskMarkers.length);
        
        // 지도 중심을 해당 위치로 이동
        const position = new window.naver.maps.LatLng(lat, lon);
        mapRef.current.setCenter(position);
        mapRef.current.setZoom(16); // 적절한 줌 레벨로 설정
        
        // 해당 위치의 위험도 마커 찾기 (더 정확한 좌표 비교)
        const targetMarker = riskMarkers.find(marker => {
            if (marker && marker.riskData) {
                const markerLat = marker.riskData.coordinates?.lat || marker.riskData.lat;
                const markerLon = marker.riskData.coordinates?.lon || marker.riskData.lon;
                
                console.log('🔍 마커 좌표 비교:', {
                    marker: { lat: markerLat, lon: markerLon },
                    target: { lat, lon },
                    diff: { 
                        lat: Math.abs(markerLat - lat), 
                        lon: Math.abs(markerLon - lon) 
                    }
                });
                
                // 좌표 차이가 매우 작은 경우 (약 10미터 이내)
                return Math.abs(markerLat - lat) < 0.0001 && Math.abs(markerLon - lon) < 0.0001;
            }
            return false;
        });
        
        if (targetMarker) {
            console.log('✅ 해당 위치의 위험도 마커 찾음, 상세정보창 표시');
            console.log('🎯 찾은 마커:', targetMarker);
            console.log('🎯 마커의 위험도 데이터:', targetMarker.riskData);
            
            // 마커가 지도에 표시되어 있는지 확인하고, 없다면 표시
            if (!targetMarker.getMap()) {
                console.log('🔄 마커를 지도에 표시');
                targetMarker.setMap(mapRef.current);
            }
            
            // 약간의 지연 후 마커 클릭 이벤트 트리거 (지도 이동 완료 후)
            setTimeout(() => {
                try {
                    console.log('🚀 마커 클릭 이벤트 트리거 시도');
                    window.naver.maps.Event.trigger(targetMarker, 'click');
                    console.log('✅ 마커 클릭 이벤트 트리거 완료');
                } catch (error) {
                    console.error('❌ 마커 클릭 이벤트 트리거 실패:', error);
                    // 대안: 직접 InfoWindow 생성하여 표시
                    showRiskInfoWindowDirectly(targetMarker, targetMarker.riskData);
                }
            }, 800); // 지연 시간을 늘려서 지도 이동 완료 보장
        } else {
            console.log('⚠️ 해당 위치의 위험도 마커를 찾을 수 없음');
            console.log('🔍 현재 위험도 마커들:', riskMarkers.map(marker => ({
                hasData: !!marker.riskData,
                coordinates: marker.riskData ? {
                    lat: marker.riskData.coordinates?.lat || marker.riskData.lat,
                    lon: marker.riskData.coordinates?.lon || marker.riskData.lon
                } : null
            })));
            
            // 마커를 찾지 못했을 때도 직접 InfoWindow 표시 시도
            console.log('🔄 마커를 찾지 못했지만 직접 InfoWindow 표시 시도');
            const dummyMarker = {
                getMap: () => mapRef.current,
                getPosition: () => new window.naver.maps.LatLng(lat, lon)
            };
            showRiskInfoWindowDirectly(dummyMarker, riskData);
        }
    };

    // 시민 제보 마커를 찾아서 해당 위치로 이동하고 상세정보창 띄우기
    const moveToComplaintMarker = (lat, lon, complaintData) => {
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }
        
        console.log('🎯 시민 제보 마커 위치로 이동:', { lat, lon, complaintData });
        console.log('🔍 현재 시민 제보 마커 개수:', complaintMarkers.length);
        
        // 지도 중심을 해당 위치로 이동
        const position = new window.naver.maps.LatLng(lat, lon);
        mapRef.current.setCenter(position);
        mapRef.current.setZoom(16); // 적절한 줌 레벨로 설정
        
        // 해당 위치의 시민 제보 마커 찾기
        const targetMarker = complaintMarkers.find(marker => {
            if (marker && marker.complaintData) {
                const markerLat = marker.complaintData.lat;
                const markerLon = marker.complaintData.lon;
                
                console.log('🔍 시민 제보 마커 좌표 비교:', {
                    marker: { lat: markerLat, lon: markerLon },
                    target: { lat, lon },
                    diff: { 
                        lat: Math.abs(markerLat - lat), 
                        lon: Math.abs(markerLon - lon) 
                    }
                });
                
                // 좌표 차이가 매우 작은 경우 (약 10미터 이내)
                return Math.abs(markerLat - lat) < 0.0001 && Math.abs(markerLon - lon) < 0.0001;
            }
            return false;
        });
        
        if (targetMarker) {
            console.log('✅ 해당 위치의 시민 제보 마커 찾음, 상세정보창 표시');
            console.log('🎯 찾은 마커:', targetMarker);
            console.log('🎯 마커의 시민 제보 데이터:', targetMarker.complaintData);
            
            // 마커가 지도에 표시되어 있는지 확인하고, 없다면 표시
            if (!targetMarker.getMap()) {
                console.log('🔄 마커를 지도에 표시');
                targetMarker.setMap(mapRef.current);
            }
            
            // 약간의 지연 후 마커 클릭 이벤트 트리거 (지도 이동 완료 후)
            setTimeout(() => {
                try {
                    console.log('🚀 시민 제보 마커 클릭 이벤트 트리거 시도');
                    window.naver.maps.Event.trigger(targetMarker, 'click');
                    console.log('✅ 시민 제보 마커 클릭 이벤트 트리거 완료');
                } catch (error) {
                    console.error('❌ 시민 제보 마커 클릭 이벤트 트리거 실패:', error);
                }
            }, 800); // 지연 시간을 늘려서 지도 이동 완료 보장
        } else {
            console.log('⚠️ 해당 위치의 시민 제보 마커를 찾을 수 없음');
            console.log('🔍 현재 시민 제보 마커들:', complaintMarkers.map(marker => ({
                hasData: !!marker.complaintData,
                coordinates: marker.complaintData ? {
                    lat: marker.complaintData.lat,
                    lon: marker.complaintData.lon
                } : null
            })));
        }
    };

    // 공사 통제 마커로 이동하는 함수
    const moveToConstructionMarker = (lat, lon, constructionData) => {
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }
        
        console.log('🎯 공사 통제 마커 위치로 이동:', { lat, lon, constructionData });
        
        // 지도 중심을 해당 위치로 이동
        const position = new window.naver.maps.LatLng(lat, lon);
        mapRef.current.setCenter(position);
        mapRef.current.setZoom(16); // 적절한 줌 레벨로 설정
        
        // 공사중 마커는 이미 NaverMap에 표시되므로, 해당 위치로 이동만 수행
        console.log('✅ 공사 통제 위치로 지도 이동 완료');
        console.log('ℹ️ 공사중 마커는 이미 지도에 표시되어 있음 (construction 필터링 모드)');
    };

    // 알림 마커로 이동하는 함수
    const moveToAlertMarker = (lat, lon, alertData) => {
        if (!mapRef.current) {
            console.log('❌ 지도가 아직 준비되지 않음');
            return;
        }
        
        console.log('🎯 알림 마커 위치로 이동:', { lat, lon, alertData });
        
        // 지도 중심을 해당 위치로 이동
        const position = new window.naver.maps.LatLng(lat, lon);
        mapRef.current.setCenter(position);
        mapRef.current.setZoom(16); // 적절한 줌 레벨로 설정
        
        // 알림 마커는 이미 NaverMap에 표시되므로, 해당 위치로 이동만 수행
        console.log('✅ 알림 위치로 지도 이동 완료');
        console.log('ℹ️ 알림 마커는 이미 지도에 표시되어 있음 (alert 필터링 모드)');
    };

    // 알림 마커 생성 및 표시 함수
    const createAlertMarkers = async () => {
        if (!mapRef.current || filterType !== 'alert') {
            console.log('❌ 알림 마커 생성 조건 불충족:', { mapRef: !!mapRef.current, filterType });
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

            // 알림 데이터 가져오기
            const response = await fetch('http://localhost:3001/api/alert/monthly');
            if (!response.ok) {
                console.error('❌ 알림 데이터 조회 실패:', response.status);
                return;
            }

            const data = await response.json();
            const alerts = data.alerts || [];
            console.log('📊 서버에서 받은 알림 데이터:', alerts.length, '건');

            if (alerts.length === 0) {
                console.log('ℹ️ 표시할 알림 데이터가 없습니다.');
                return;
            }

            // 각 알림에 대해 위치 정보를 가져와서 마커 생성
            for (const alert of alerts) {
                try {
                    const locationResponse = await fetch(`http://localhost:3001/api/alert/location/${alert.alert_idx}`);
                    if (locationResponse.ok) {
                        const locationData = await locationResponse.json();
                        
                        if (locationData.lat && locationData.lon) {
                            const position = new window.naver.maps.LatLng(locationData.lat, locationData.lon);
                            
                            // 알림 마커 생성 (Dashboard.jsx와 동일한 스타일)
                            const marker = new window.naver.maps.Marker({
                                position: position,
                                map: mapRef.current,
                                icon: {
                                    content: `
                                        <div style="
                                            background-color: #ff4757;
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

                            // 알림 정보 윈도우 생성
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
                                            <strong>전송시간:</strong> ${new Date(alert.sented_at).toLocaleString()}
                                        </p>
                                        <p style="margin: 5px 0; font-size: 14px;">
                                            <strong>상태:</strong> ${alert.is_read === 'Y' ? '✅ 읽음' : '📬 안읽음'}
                                        </p>
                                    </div>
                                `,
                                maxWidth: 300,
                                backgroundColor: '#fff',
                                borderColor: '#ff4757',
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
                                position: { lat: locationData.lat, lon: locationData.lon } 
                            });
                        }
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

    // 알림 심각도에 따른 색상 반환
    const getAlertLevelColor = (alertLevel) => {
        switch (alertLevel) {
            case 'high': return '#e74c3c'; // 빨간색
            case 'medium': return '#f39c12'; // 주황색
            case 'low': return '#27ae60'; // 초록색
            default: return '#95a5a6'; // 회색
        }
    };

    // 알림 심각도 텍스트 반환
    const getAlertLevelText = (alertLevel) => {
        switch (alertLevel) {
            case 'high': return '높음';
            case 'medium': return '보통';
            case 'low': return '낮음';
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

    // 위험도 마커 추가 함수
    const addRiskMarkers = (riskData) => {
        console.log('🔍 위험도 마커 추가 시작:', riskData);
        console.log('🔍 mapRef.current 상태:', !!mapRef.current);
        console.log('🔍 riskData 상태:', !!riskData, riskData?.length);
        
        // 지도가 준비되지 않았다면 재시도
        if (!mapRef.current) {
            console.log('⏳ 지도가 아직 준비되지 않음, 1초 후 재시도');
            setTimeout(() => {
                addRiskMarkers(riskData);
            }, 1000);
            return;
        }
        
        if (!riskData || riskData.length === 0) {
            console.log('❌ 위험도 마커 추가 실패: 데이터 없음');
            console.log('❌ riskData:', !!riskData);
            console.log('❌ riskData.length:', riskData?.length);
            return;
        }

        // 기존 위험도 마커 제거
        riskMarkers.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });

        const newRiskMarkers = [];

        riskData.forEach((item, index) => {
            console.log(`🔍 아이템 ${index + 1} 전체 데이터:`, item);
            
            // coordinates.lat, coordinates.lon 또는 직접 lat, lon 사용
            const lat = item.coordinates?.lat || item.lat;
            const lon = item.coordinates?.lon || item.lon;
            
            console.log(`📍 마커 ${index + 1}: lat=${lat}, lon=${lon}, score=${item.totalRiskScore}`);
            console.log(`📍 coordinates 객체:`, item.coordinates);
            
            if (lat && lon) {
                let riskLevel = 'low';
                if (item.totalRiskScore >= 8.0) riskLevel = 'high';
                else if (item.totalRiskScore >= 6.0) riskLevel = 'medium';

                console.log(`🎯 마커 생성 시작: ${riskLevel} 레벨, 위치: (${lat}, ${lon})`);
                
                const marker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(lat, lon),
                    map: null, // 초기에는 숨김 상태로 생성
                    zIndex: 1000, // 위험도 마커를 다른 마커들 위에 표시
                    icon: {
                        content: createRiskMarkerContent(riskLevel),
                        anchor: new window.naver.maps.Point(7, 9) // 마커 중앙점 (14x18 크기의 중앙)
                    }
                });
                
                // 마커 생성 시 즉시 필터 상태에 따라 표시/숨김 결정
                if (showRiskMarkers && (filterType === 'all' || filterType === 'risk')) {
                    marker.setMap(mapRef.current);
                } else {
                    marker.setMap(null);
                }
                
                console.log(`✅ 마커 생성 완료:`, marker);
                console.log(`🗺️ 마커가 지도에 추가됨: map=${mapRef.current}, position=(${lat}, ${lon})`);

                // 마커에 위험도 데이터 저장 (외부에서 접근 가능하도록)
                marker.riskData = item;
                
                // 마커 클릭 시 위험도 정보 표시 (토글 기능)
                window.naver.maps.Event.addListener(marker, 'click', () => {
                    // 현재 마커에 InfoWindow가 열려있는지 확인
                    if (marker.infoWindow && marker.infoWindow.getMap()) {
                        // 같은 마커의 InfoWindow가 열려있다면 닫기
                        console.log('🔄 같은 마커 클릭 - InfoWindow 닫기');
                        marker.infoWindow.close();
                        marker.infoWindow = null;
                        return;
                    }
                    
                    // 기존 InfoWindow가 있다면 닫기
                    if (window.currentRiskInfoWindow) {
                        window.currentRiskInfoWindow.close();
                    }
                    
                    const infoWindow = new window.naver.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; min-width: 200px;">
                                <h4 style="margin: 0 0 10px 0; color: ${riskMarkerTypes[riskLevel].color};">${riskMarkerTypes[riskLevel].icon} ${riskMarkerTypes[riskLevel].name}</h4>
                                <p style="margin: 5px 0;"><strong>순위:</strong> #${index + 1}</p>
                                <p style="margin: 5px 0;"><strong>위험도 점수:</strong> ${item.totalRiskScore.toFixed(1)}/20.0</p>
                                <p style="margin: 5px 0;"><strong>위치:</strong> ${item.address || '주소 정보 없음'}</p>
                                <p style="margin: 5px 0;"><strong>상세:</strong> ${item.riskDetail || '상세 정보가 없습니다.'}</p>
                            </div>
                        `,
                        backgroundColor: "#fff",
                        borderColor: riskMarkerTypes[riskLevel].color,
                        borderWidth: 2,
                        anchorSize: new window.naver.maps.Size(20, 20),
                        anchorColor: "#fff",
                        pixelOffset: new window.naver.maps.Point(0, -9) // 마커 높이의 절반만큼 위로
                    });
                    
                    // 새 InfoWindow 표시하고 마커와 전역 변수에 저장
                    infoWindow.open(mapRef.current, marker);
                    marker.infoWindow = infoWindow; // 마커에 직접 InfoWindow 참조 저장
                    window.currentRiskInfoWindow = infoWindow;
                });

                newRiskMarkers.push(marker);
                console.log(`📌 마커 ${index + 1} 배열에 추가됨`);
            } else {
                console.log(`❌ 마커 ${index + 1} 좌표 없음: lat=${lat}, lon=${lon}`);
            }
        });

        console.log(`✅ 위험도 마커 생성 완료: ${newRiskMarkers.length}개`);
        console.log(`🗺️ 지도에 표시될 마커들:`, newRiskMarkers);
        setRiskMarkers(newRiskMarkers);

        // 마커 생성 완료 후 상태 업데이트
        console.log(`✅ 위험도 마커 생성 완료: ${newRiskMarkers.length}개`);
        console.log(`🗺️ 지도에 표시될 마커들:`, newRiskMarkers);
        setRiskMarkers(newRiskMarkers);
    };

    // 시민 제보 마커 추가 함수
    const addComplaintMarkers = (complaintData) => {
        console.log('🔍 시민 제보 마커 추가 시작:', complaintData);
        console.log('🔍 mapRef.current 상태:', !!mapRef.current);
        console.log('🔍 complaintData 상태:', !!complaintData, complaintData?.length);
        
        // 지도가 준비되지 않았다면 재시도
        if (!mapRef.current) {
            console.log('⏳ 지도가 아직 준비되지 않음, 1초 후 재시도');
            setTimeout(() => {
                addComplaintMarkers(complaintData);
            }, 1000);
            return;
        }
        
        if (!complaintData || complaintData.length === 0) {
            console.log('❌ 시민 제보 마커 추가 실패: 데이터 없음');
            return;
        }

        // 기존 시민 제보 마커 제거
        complaintMarkers.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });

        const newComplaintMarkers = [];

        complaintData.forEach((item, index) => {
            console.log(`🔍 시민 제보 아이템 ${index + 1} 전체 데이터:`, item);
            
            const lat = item.lat;
            const lon = item.lon;
            
            console.log(`📍 시민 제보 마커 ${index + 1}: lat=${lat}, lon=${lon}, status=${item.c_report_status}`);
            
            if (lat && lon) {
                console.log(`🎯 시민 제보 마커 생성 시작: 위치: (${lat}, ${lon})`);
                
                const marker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(lat, lon),
                    map: null, // 초기에는 숨김 상태로 생성
                    zIndex: 900, // 위험도 마커보다 아래에 표시
                    icon: {
                        content: createComplaintMarkerContent(item.c_report_status),
                        anchor: new window.naver.maps.Point(15, 15) // 마커 중앙점
                    }
                });
                
                // 마커 생성 시 즉시 필터 상태에 따라 표시/숨김 결정
                if (showComplaintMarkers && (filterType === 'all' || filterType === 'complaint')) {
                    marker.setMap(mapRef.current);
                } else {
                    marker.setMap(null);
                }
                
                console.log(`✅ 시민 제보 마커 생성 완료:`, marker);

                // 마커에 시민 제보 데이터 저장
                marker.complaintData = item;
                
                // 마커 클릭 시 시민 제보 정보 표시 (토글 기능)
                window.naver.maps.Event.addListener(marker, 'click', () => {
                    // 현재 마커에 InfoWindow가 열려있는지 확인
                    if (marker.infoWindow && marker.infoWindow.getMap()) {
                        console.log('🔄 같은 시민 제보 마커 클릭 - InfoWindow 닫기');
                        marker.infoWindow.close();
                        marker.infoWindow = null;
                        return;
                    }
                    
                    // 기존 InfoWindow가 있다면 닫기
                    if (window.currentComplaintInfoWindow) {
                        window.currentComplaintInfoWindow.close();
                    }
                    
                    const infoWindow = new window.naver.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; min-width: 250px;">
                                <h4 style="margin: 0 0 10px 0; color: #3498db;">📝 시민 제보</h4>
                                <p style="margin: 5px 0;"><strong>제보 번호:</strong> #${item.c_report_idx}</p>
                                <p style="margin: 5px 0;"><strong>처리 상태:</strong> ${getComplaintStatusText(item.c_report_status)}</p>
                                <p style="margin: 5px 0;"><strong>제보 일시:</strong> ${new Date(item.c_reported_at).toLocaleString('ko-KR')}</p>
                                <p style="margin: 5px 0;"><strong>위치:</strong> ${item.addr || '주소 정보 없음'}</p>
                                <p style="margin: 5px 0;"><strong>상세 내용:</strong> ${item.c_report_detail || '상세 정보가 없습니다.'}</p>
                                <p style="margin: 5px 0;"><strong>제보자:</strong> ${item.c_reporter_name}</p>
                                <p style="margin: 5px 0;"><strong>연락처:</strong> ${item.c_reporter_phone}</p>
                            </div>
                        `,
                        backgroundColor: "#fff",
                        borderColor: "#3498db",
                        borderWidth: 2,
                        anchorSize: new window.naver.maps.Size(20, 20),
                        anchorColor: "#fff",
                        pixelOffset: new window.naver.maps.Point(0, -15)
                    });
                    
                    // 새 InfoWindow 표시하고 마커와 전역 변수에 저장
                    infoWindow.open(mapRef.current, marker);
                    marker.infoWindow = infoWindow;
                    window.currentComplaintInfoWindow = infoWindow;
                });

                newComplaintMarkers.push(marker);
                console.log(`📌 시민 제보 마커 ${index + 1} 배열에 추가됨`);
            } else {
                console.log(`❌ 시민 제보 마커 ${index + 1} 좌표 없음: lat=${lat}, lon=${lon}`);
            }
        });

        console.log(`✅ 시민 제보 마커 생성 완료: ${newComplaintMarkers.length}개`);
        setComplaintMarkers(newComplaintMarkers);
    };

    // ✅ 수정된 addMarker 함수
    const addMarker = async (lat, lng, type) => {
        if (!mapRef.current) return;

        try {
            const response = await axios.post('http://localhost:3001/api/marker/updatemarker', {
                lat: lat,
                lon: lng,
                marker_type: type
            });

            console.log('✅ 서버 통신 성공:', response.data);

            // 서버 응답에서 marker_id 추출 (실제 DB에 저장된 ID)
            const serverMarkerId = response.data.marker_id || response.data.id || Date.now();

            const newMarkerData = {
                id: serverMarkerId,
                marker_id: serverMarkerId, // ✅ Modals에서 사용할 marker_id
                lat,
                lng,
                type,
                name: getMarkerConfig(type).name,
                icon: getMarkerConfig(type).icon,
                color: getMarkerConfig(type).color
            };

            const naverMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(lat, lng),
                map: mapRef.current,
                icon: {
                    content: createMarkerContent(type),
                    anchor: new window.naver.maps.Point(15, 15)
                }
            });

            // ✅ 마커 클릭 이벤트를 즉시 등록
            window.naver.maps.Event.addListener(naverMarker, 'click', () => {
                console.log("마커클릭:", type, "marker_id:", serverMarkerId);
                
                // ✅ InfoContext의 lat, lon 값 업데이트
                setLat(lat);
                setLon(lng);
                
                if (onMarkerClick) {
                    onMarkerClick(type, newMarkerData);
                }
            });

            // ✅ 한 번만 추가하고 상태 동기화
            setMarkers(prev => [...prev, newMarkerData]);
            markersRef.current.push(naverMarker);

            console.log(`📍 마커가 지도에 추가됨: ${type} at ${lat}, ${lng} (ID: ${serverMarkerId})`);

        } catch (error) {
            console.error('❌ 마커 추가 실패:', error.response ? error.response.data : error.message);
        }
    };

    // ✅ 수정된 removeMarker 함수
    const removeMarker = (markerId) => {
        const markerIndex = markers.findIndex(m => m.id === markerId);
        if (markerIndex !== -1 && markerIndex < markersRef.current.length) {
            if (markersRef.current[markerIndex]) {
                markersRef.current[markerIndex].setMap(null);
                markersRef.current.splice(markerIndex, 1);
            }
            setMarkers(prev => prev.filter(marker => marker.id !== markerId));
        }
    };

    const clearAllMarkers = () => {
        markersRef.current.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });
        markersRef.current = [];
        setMarkers([]);
    };

    // 알림 클릭 시 지도 이동 이벤트 핸들러
    const handleMoveToLocation = (event) => {
        const { lat, lon, message, level } = event.detail;
        console.log('🎯 지도 이동 이벤트 수신:', lat, lon, message, level);
        
        if (mapRef.current) {
            const newPosition = new window.naver.maps.LatLng(lat, lon);
            mapRef.current.setCenter(newPosition);
            mapRef.current.setZoom(15); // 줌 레벨을 15로 설정하여 상세 보기
            
            // 기존 알림 마커 제거
            removeAlertMarker();
            
            // 새로운 알림 마커 생성
            createAlertMarker(lat, lon, message, level);
            
            console.log('✅ 지도 이동 및 알림 마커 생성 완료:', lat, lon);
        } else {
            console.warn('⚠️ 지도 객체가 아직 초기화되지 않았습니다.');
        }
    };

    // 위험도 랭킹 클릭 시 지도 이동 이벤트 핸들러
    const handleMoveToRiskLocation = (event) => {
        const { lat, lon, message, level, riskDetail, totalRiskScore } = event.detail;
        console.log('🎯 위험도 위치 이동 이벤트 수신:', lat, lon, message, level);
        
        if (mapRef.current) {
            const newPosition = new window.naver.maps.LatLng(lat, lon);
            mapRef.current.setCenter(newPosition);
            mapRef.current.setZoom(15); // 줌 레벨을 15로 설정하여 상세 보기
            
            // 기존 알림 마커 제거
            removeAlertMarker();
            
            // 새로운 위험도 정보 마커 생성
            createRiskInfoMarker(lat, lon, message, level, riskDetail, totalRiskScore);
            
            console.log('✅ 위험도 위치 이동 및 정보 마커 생성 완료:', lat, lon);
        } else {
            console.warn('⚠️ 지도 객체가 아직 초기화되지 않았습니다.');
        }
    };

    // 알림 마커 생성 함수
    const createAlertMarker = (lat, lon, message, level) => {
        if (!mapRef.current) return;

        // 알림 마커 HTML 생성
        const alertMarkerContent = `
            <div style="
                background: linear-gradient(135deg, ${getAlertMarkerColor(level)});
                border-radius: 8px;
                padding: 8px 12px;
                color: white;
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 2px solid white;
                max-width: 200px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: center;
                position: relative;
                margin-bottom: 15px;
            ">
                <div style="margin-bottom: 4px;">${getAlertIcon(level)}</div>
                <div style="font-size: 10px; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${message}</div>
                <div style="
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid ${getAlertMarkerColor(level)};
                "></div>
            </div>
            <div style="
                width: 20px;
                height: 20px;
                background: ${getAlertMarkerColor(level).split(',')[0]};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                position: relative;
                margin: 0 auto;
            ">
                <div style="
                    position: absolute;
                    bottom: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 15px solid ${getAlertMarkerColor(level).split(',')[0]};
                "></div>
            </div>
            <style>
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            </style>
        `;

        // 알림 마커 생성
        const newAlertMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(lat, lon),
            map: mapRef.current,
            icon: {
                content: alertMarkerContent,
                anchor: new window.naver.maps.Point(100, 35) // 마커 중앙 하단에 위치 (앵커 마커 고려)
            }
        });

        // 알림 마커 상태 업데이트
        setAlertMarker(newAlertMarker);
        alertMarkerRef.current = newAlertMarker;

        // 10초 후 자동으로 알림 마커 제거
        setTimeout(() => {
            if (alertMarkerRef.current === newAlertMarker) {
                removeAlertMarker();
                console.log('⏰ 알림 마커 자동 제거 완료');
            }
        }, 10000);

        console.log('✅ 알림 마커 생성 완료:', message);
    };

    // 위험도 정보 마커 생성 함수
    const createRiskInfoMarker = (lat, lon, message, level, riskDetail, totalRiskScore) => {
        if (!mapRef.current) return;

        // 위험도 정보 마커 HTML 생성
        const riskMarkerContent = `
            <div style="
                background: linear-gradient(135deg, ${getAlertMarkerColor(level)});
                border-radius: 8px;
                padding: 12px 16px;
                color: white;
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 2px solid white;
                max-width: 250px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: center;
                position: relative;
                margin-bottom: 15px;
            ">
                <div style="margin-bottom: 6px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🚨 위험도 정보</div>
                <div style="margin-bottom: 4px; font-size: 11px; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${message}</div>
                <div style="
                    margin-top: 8px;
                    padding: 6px 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    font-size: 10px;
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                ">${riskDetail}</div>
                <div style="
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid ${getAlertMarkerColor(level)};
                "></div>
            </div>
            <div style="
                width: 20px;
                height: 20px;
                background: ${getAlertMarkerColor(level).split(',')[0]};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                position: relative;
                margin: 0 auto;
                animation: pulse 2s infinite;
            ">
                <div style="
                    position: absolute;
                    bottom: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 15px solid ${getAlertMarkerColor(level).split(',')[0]};
                "></div>
            </div>
        `;

        // 위험도 정보 마커 생성
        const newRiskMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(lat, lon),
            map: mapRef.current,
            icon: {
                content: riskMarkerContent,
                anchor: new window.naver.maps.Point(125, 40) // 마커 중앙 하단에 위치
            }
        });

        // 위험도 정보 마커 상태 업데이트
        setAlertMarker(newRiskMarker);
        alertMarkerRef.current = newRiskMarker;

        // 15초 후 자동으로 위험도 정보 마커 제거
        setTimeout(() => {
            if (alertMarkerRef.current === newRiskMarker) {
                removeAlertMarker();
                console.log('⏰ 위험도 정보 마커 자동 제거 완료');
            }
        }, 15000);

        console.log('✅ 위험도 정보 마커 생성 완료:', message);
    };

    // 알림 마커 제거 함수
    const removeAlertMarker = () => {
        if (alertMarkerRef.current) {
            alertMarkerRef.current.setMap(null);
            alertMarkerRef.current = null;
        }
        setAlertMarker(null);
        console.log('✅ 알림 마커 제거 완료');
    };

    // 알림 레벨에 따른 색상 반환
    const getAlertMarkerColor = (level) => {
        switch (level) {
            case '매우 위험':
                return '#ff6b6b, #ee5a24';
            case '위험':
                return '#ff9f43, #f39c12';
            case '경고':
                return '#feca57, #ff9ff3';
            case '안전':
                return '#2ecc71, #27ae60';
            default:
                return '#feca57, #ff9ff3';
        }
    };

    // 앵커 마커 색상 반환 (단일 색상)
    const getAnchorMarkerColor = (level) => {
        switch (level) {
            case '매우 위험':
                return '#e74c3c';
            case '위험':
                return '#e67e22';
            case '경고':
                return '#f39c12';
            case '안전':
                return '#27ae60';
            default:
                return '#f39c12';
        }
    };

    // 알림 레벨에 따른 아이콘 반환
    const getAlertIcon = (level) => {
        switch (level) {
            case '매우 위험':
                return '🚨';
            case '위험':
                return '⚠️';
            case '경고':
                return '⚠️';
            case '안전':
                return '✅';
            default:
                return '⚠️';
        }
    };

    // 이벤트 리스너 등록 함수
    const setupEventListeners = () => {
        // 기존 이벤트 리스너 제거
        window.removeEventListener('moveToLocation', handleMoveToLocation);
        window.removeEventListener('moveToRiskLocation', handleMoveToRiskLocation);
        // 새로운 이벤트 리스너 등록
        window.addEventListener('moveToLocation', handleMoveToLocation);
        window.addEventListener('moveToRiskLocation', handleMoveToRiskLocation);
        console.log('✅ 지도 이동 이벤트 리스너 등록 완료');
    };

    // 이벤트 리스너 정리 함수
    const cleanupEventListeners = () => {
        window.removeEventListener('moveToLocation', handleMoveToLocation);
        window.removeEventListener('moveToRiskLocation', handleMoveToRiskLocation);
        console.log('✅ 지도 이동 이벤트 리스너 정리 완료');
    };

    useEffect(() => {
        const script = document.createElement("script");
        const newClientId = "se9uk5m3m9";
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${newClientId}&submodules=geocoder`;
        script.async = true;

        script.onload = () => {
            const mapOptions = {
                center: new window.naver.maps.LatLng(35.146667, 126.888667),
                zoom: 13,
                mapTypeControl: true,
                maxBounds: new window.naver.maps.LatLngBounds(
                    new window.naver.maps.LatLng(35.0, 126.6),
                    new window.naver.maps.LatLng(35.2, 127.0)
                ),
                minZoom: 11
            };

            const map = new window.naver.maps.Map('naverMap', mapOptions);
            mapRef.current = map;

            fetchMarkers(map);

            // 지도 초기화 완료 후 위험도 마커가 있다면 추가
            if (showRiskMarkers && riskData && riskData.length > 0) {
                console.log('🗺️ 지도 초기화 완료 후 위험도 마커 추가');
                setTimeout(() => {
                    addRiskMarkers(riskData);
                }, 500); // 마커 로딩 후 위험도 마커 추가
            }

            window.naver.maps.Event.addListener(map, 'click', (e) => {
                console.log('지도 클릭됨:', e.coord.y, e.coord.x, '편집모드:', isEditingRef.current);

                setLat(e.coord.y);
                setLon(e.coord.x);

                // 편집 모드일 때 마커 추가 (위험도 마커 모드가 아닐 때만)
                if (isEditingRef.current && !showRiskMarkers) {
                    addMarker(e.coord.y, e.coord.x, selectedMarkerTypeRef.current);
                }
            });

            // 이벤트 리스너 등록
            setupEventListeners();

            console.log('네이버 지도 초기화 완료');
        };

        script.onerror = () => {
            console.error('네이버 지도 스크립트 로드 실패');
        };

        document.head.appendChild(script);

        return () => {
            // 이벤트 리스너 정리
            cleanupEventListeners();
        };
    }, []);

    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    useEffect(() => {
        return () => {
            cleanupEventListeners();
            removeAlertMarker();
        };
    }, []);

    // ✅ 수정된 fetchMarkers 함수 - t_cctv와 t_road_control에서 직접 마커 데이터 가져오기
    const fetchMarkers = async (map) => {
        // filterType이 'alert'일 때는 일반 마커를 로드하지 않음
        if (filterType === 'alert') {
            console.log('🚨 알림 모드: 일반 마커 로드 건너뜀');
            return;
        }
        
        // filterType이 'risk'일 때는 일반 마커를 로드하지 않음
        if (filterType === 'risk') {
            console.log('🚨 위험도 모드: 일반 마커 로드 건너뜀');
            return;
        }
        
        try {
            // ✅ t_cctv와 t_road_control 테이블에서 직접 마커 데이터 가져오기
            const [cctvResponse, roadControlResponse] = await Promise.all([
                axios.get('http://localhost:3001/api/cctv/all'),
                axios.get('http://localhost:3001/api/road-control/all')
            ]);
            
            const cctvDataList = cctvResponse.data || [];
            const roadControlDataList = roadControlResponse.data || [];
            
            // ✅ 배열들을 초기화
            const newMarkers = [];
            const newNaverMarkers = [];

            console.log('✅ 서버에서 마커 데이터 로드 성공:', {
                cctv: cctvDataList.length,
                roadControl: roadControlDataList.length
            });

            // ✅ CCTV 마커 처리
            cctvDataList.forEach(cctvData => {
                const lat = parseFloat(cctvData.lat);
                const lon = parseFloat(cctvData.lon);
                const { cctv_idx, cctv_name } = cctvData;

                if (isNaN(lat) || isNaN(lon)) {
                    console.error('유효하지 않은 CCTV 데이터:', cctvData);
                    return;
                }

                const newMarkerData = {
                    id: cctv_idx,
                    marker_id: cctv_idx, // Modals에서 사용할 marker_id
                    cctv_idx: cctv_idx, // CCTV 상세 정보 조회용
                    lat,
                    lng: lon,
                    type: 'cctv',
                    name: cctv_name || 'CCTV',
                    icon: '📹',
                    color: '#4CAF50'
                };

                const naverMarker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(lat, lon),
                    map: map,
                    icon: {
                        content: createMarkerContent('cctv'),
                        anchor: new window.naver.maps.Point(15, 15)
                    }
                });

                // ✅ 마커 클릭 이벤트 등록
                window.naver.maps.Event.addListener(naverMarker, 'click', () => {
                    console.log("CCTV 마커 클릭:", cctv_idx);
                    
                    // ✅ InfoContext의 lat, lon 값 업데이트
                    setLat(lat);
                    setLon(lon);
                    
                    if (onMarkerClick) {
                        onMarkerClick('cctv', newMarkerData);
                    }
                });

                newMarkers.push(newMarkerData);
                newNaverMarkers.push(naverMarker);
            });

            // ✅ 도로 통제 마커 처리 (공사중, 침수)
            roadControlDataList.forEach(controlData => {
                const lat = parseFloat(controlData.lat);
                const lon = parseFloat(controlData.lon);
                const { control_idx, control_type, control_desc } = controlData;

                if (isNaN(lat) || isNaN(lon) || !control_type) {
                    console.error('유효하지 않은 도로 통제 데이터:', controlData);
                    return;
                }

                // ✅ control_type에 따른 마커 설정
                let markerType, markerIcon, markerColor;
                if (control_type === 'construction') {
                    markerType = 'construction';
                    markerIcon = '🚧';
                    markerColor = '#FF9800';
                } else if (control_type === 'flood') {
                    markerType = 'flood';
                    markerIcon = '🌊';
                    markerColor = '#2196F3';
                } else {
                    console.warn('지원하지 않는 도로 통제 타입:', control_type);
                    return;
                }

                const newMarkerData = {
                    id: control_idx,
                    marker_id: control_idx, // Modals에서 사용할 marker_id
                    control_idx: control_idx, // 도로 통제 상세 정보 조회용
                    lat,
                    lng: lon,
                    type: markerType,
                    name: control_desc || `${markerType === 'construction' ? '공사중' : '침수'}`,
                    icon: markerIcon,
                    color: markerColor
                };

                const naverMarker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(lat, lon),
                    map: map,
                    icon: {
                        content: createMarkerContent(markerType),
                        anchor: new window.naver.maps.Point(15, 15)
                    }
                });

                // ✅ 마커 클릭 이벤트 등록
                window.naver.maps.Event.addListener(naverMarker, 'click', () => {
                    console.log(`${markerType} 마커 클릭:`, control_idx);
                    
                    // ✅ InfoContext의 lat, lon 값 업데이트
                    setLat(lat);
                    setLon(lon);
                    
                    if (onMarkerClick) {
                        onMarkerClick(markerType, newMarkerData);
                    }
                });

                newMarkers.push(newMarkerData);
                newNaverMarkers.push(naverMarker);
            });

            // ✅ 상태를 한 번에 업데이트하여 동기화 보장
            setMarkers(newMarkers);
            markersRef.current = newNaverMarkers;

            console.log(`지도에 총 ${newMarkers.length}개의 마커가 추가되었습니다. (CCTV: ${cctvDataList.length}, 도로통제: ${roadControlDataList.length})`);

        } catch (error) {
            console.error('❌ 마커 데이터 로드 실패:', error.response ? error.response.data : error.message);
        }
    };

    // ✅ 수정된 마커 필터링 useEffect
    useEffect(() => {
        if (!mapRef.current || markersRef.current.length === 0 || markers.length === 0) return;

        // ✅ 배열 길이 체크 및 안전한 접근
        const minLength = Math.min(markersRef.current.length, markers.length);
        
        for (let i = 0; i < minLength; i++) {
            const naverMarker = markersRef.current[i];
            const markerData = markers[i];
            
            // ✅ null 체크 추가
            if (!naverMarker || !markerData) {
                console.warn(`마커 데이터 불일치 감지: index ${i}`);
                continue;
            }

            if (filterType === 'all' || markerData.type === filterType) {
                naverMarker.setMap(mapRef.current);
            } else {
                naverMarker.setMap(null);
            }
        }

    }, [filterType, markers]);

    const filteredMarkers = filterType === 'all'
        ? markers
        : markers.filter(marker => marker.type === filterType);

    const handleToggleEditing = () => {
        setIsEditing(prev => {
            console.log('편집 모드 변경:', !prev);
            return !prev;
        });
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
                id="naverMap"
                style={{ width: "100%", height: "100%", borderRadius: "10px" }}
            ></div>

            {/* 편집 모드 버튼 - 항상 표시
            <button
                onClick={handleToggleEditing}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 100,
                    padding: '10px 15px',
                    backgroundColor: isEditing ? '#FF0000' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>
                {isEditing ? '편집 완료' : '편집 모드'}
            </button> */}

            {/* 마커 타입 필터링 - hideFilterButtons가 false일 때만 표시 */}
            {!hideFilterButtons && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 100,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '10px',
                }}>
                    <button
                        onClick={() => setFilterType('all')}
                        style={{
                            backgroundColor: filterType === 'all' ? '#2196F3' : 'transparent',
                            color: 'white',
                            border: '1px solid white',
                            borderRadius: '5px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        모두 보기
                    </button>
                    {['cctv', 'construction', 'flood'].map((type) => {
                        const config = getMarkerConfig(type);
                        return (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    backgroundColor: filterType === type ? config.color : 'transparent',
                                    color: 'white',
                                    border: `1px solid ${filterType === type ? config.color : 'white'}`,
                                    borderRadius: '5px',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {config.icon} {config.name}
                            </button>
                        );
                    })}
                    {showRiskMarkers && (
                        <button
                            onClick={() => setFilterType('risk')}
                            style={{
                                backgroundColor: filterType === 'risk' ? '#FF5722' : 'transparent',
                                color: 'white',
                                border: `1px solid ${filterType === 'risk' ? '#FF5722' : 'white'}`,
                                borderRadius: '5px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🚨 위험도
                        </button>
                    )}
                </div>
            )}

            {isEditing && !showRiskMarkers && (
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    right: '10px',
                    zIndex: 100,
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: '1px solid #ddd'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>마커 선택</h4>
                    {['cctv', 'construction', 'flood'].map((type) => {
                        const config = getMarkerConfig(type);
                        return (
                            <div key={type} style={{ marginBottom: '8px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}>
                                    <input
                                        type="radio"
                                        name="markerType"
                                        value={type}
                                        checked={selectedMarkerType === type}
                                        onChange={(e) => {
                                            console.log('마커 타입 변경:', e.target.value);
                                            setSelectedMarkerType(e.target.value);
                                        }}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <span style={{ marginRight: '5px', fontSize: '16px' }}>{config.icon}</span>
                                    {config.name}
                                </label>
                            </div>
                        );
                    })}
                    <button
                        onClick={clearAllMarkers}
                        style={{
                            width: '100%',
                            marginTop: '10px',
                            padding: '8px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        모든 마커 삭제
                    </button>
                </div>
            )}

            {isEditing && !showRiskMarkers && filteredMarkers.length > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 100,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    minWidth: '250px'
                }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>추가된 마커 ({filteredMarkers.length}개)</h4>
                    {filteredMarkers.map((marker, index) => (
                        <div key={marker.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                            padding: '5px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px'
                        }}>
                            <div>
                                <span style={{ marginRight: '5px' }}>{getMarkerConfig(marker.type).icon}</span>
                                <span>{marker.name}</span>
                                <br />
                                <small style={{ color: '#ccc' }}>
                                    {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                                </small>
                            </div>
                            <button
                                onClick={() => removeMarker(marker.id)}
                                style={{
                                    backgroundColor: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isEditing && !showRiskMarkers && markers.length === 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 100,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px'
                }}>
                    <p>📍 지도를 클릭하여 마커를 추가하세요</p>
                    <p>현재 선택된 마커: {getMarkerConfig(selectedMarkerType).icon} {getMarkerConfig(selectedMarkerType).name}</p>
                    <p>편집모드 상태: {isEditingRef.current ? 'ON' : 'OFF'}</p>
                </div>
            )}

            {/* 편집 모드 상태 표시 - 위험도 마커 모드가 아닐 때만 표시 */}
            {!showRiskMarkers && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 100,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '11px'
                }}>
                    편집모드: {isEditing ? 'ON' : 'OFF'} | 마커: {markers.length}개
                </div>
            )}

            {/* 위험도 마커 모드일 때 표시할 정보
            {showRiskMarkers && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 100,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    🗺️ 위험도 마커 모드 | 총 {riskData?.length || 0}개 구간
                </div>
            )} */}


        </div>
    );
};

export default React.memo(NaverMap, (prevProps, nextProps) => {
    return prevProps.onMarkerClick === nextProps.onMarkerClick;
});