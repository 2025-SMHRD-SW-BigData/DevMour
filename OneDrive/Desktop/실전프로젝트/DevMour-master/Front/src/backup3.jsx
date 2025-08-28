import React, { useEffect, useState, useRef, useContext } from "react";
import { InfoContext } from "./context/InfoContext";
import axios from 'axios';


const NaverMap = ({ onMarkerClick }) => {
    const mapRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const isEditingRef = useRef(isEditing);
    const [selectedMarkerType, setSelectedMarkerType] = useState('cctv');
    const selectedMarkerTypeRef = useRef(selectedMarkerType);
    const [markers, setMarkers] = useState([]);
    const markersRef = useRef([]);
    // ⭐ 마커 필터링을 위한 상태 추가
    const [filterType, setFilterType] = useState('all');
    

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

    const markerTypes = {
        cctv: {
            name: 'CCTV',
            color: '#FF4444',
            icon: '📹',
            size: { width: 30, height: 30 }
        },
        construction: {
            name: '공사중',
            color: '#FF8800',
            icon: '🚧',
            size: { width: 30, height: 30 }
        },
        flood: {
            name: '침수',
            color: '#4488FF',
            icon: '🌊',
            size: { width: 30, height: 30 }
        }
    };

    const createMarkerContent = (type) => {
        const config = markerTypes[type];
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

    // 마커 추가 및 서버 통신 함수 (async/await 사용)
    const addMarker = async (lat, lng, type) => {
        if (!mapRef.current) return;

        try {
            // 1. 서버로 마커 정보 전송
            const response = await axios.post('http://localhost:3001/api/marker/updatemarker', {
                lat: lat,
                lon: lng,
                marker_type: type
            });

            // 2. 통신 성공 시 로그 출력
            console.log('✅ 서버 통신 성공:', response.data);

            // 3. 네이버 지도에 마커 추가 (서버 통신 성공 후에만 실행)
            const newMarkerData = {
                id: Date.now(),
                lat,
                lng,
                type,
                name: markerTypes[type].name
            };

            const naverMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(lat, lng),
                map: mapRef.current,
                icon: {
                    content: createMarkerContent(type),
                    anchor: new window.naver.maps.Point(15, 15)
                }
            });

            window.naver.maps.Event.addListener(naverMarker, 'click', () => {
                alert(`${newMarkerData.name} 마커\n위치: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            });

            setMarkers(prev => [...prev, newMarkerData]);
            markersRef.current.push(naverMarker);

            console.log(`📍 마커가 지도에 추가됨: ${type} at ${lat}, ${lng}`);
        } catch (error) {
            // 4. 통신 실패 시 오류 로그 출력
            console.error('❌ 서버 통신 실패:', error.response ? error.response.data : error.message);
            alert('마커 정보 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const removeMarker = (markerId) => {
        const markerIndex = markers.findIndex(m => m.id === markerId);
        if (markerIndex !== -1) {
            if (markersRef.current[markerIndex]) {
                markersRef.current[markerIndex].setMap(null);
                markersRef.current.splice(markerIndex, 1);
            }
            setMarkers(prev => prev.filter(marker => marker.id !== markerId));
        }
    };

    const clearAllMarkers = () => {
        markersRef.current.forEach(marker => {
            marker.setMap(null);
        });
        markersRef.current = [];
        setMarkers([]);
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

            const defaultMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(35.146667, 126.888667),
                map: map,
            });

            window.naver.maps.Event.addListener(defaultMarker, 'click', () => {
                if (onMarkerClick) {
                    onMarkerClick();
                }
            });

            // 초기 마커를 불러오는 함수 호출
            fetchMarkers(map);

            window.naver.maps.Event.addListener(map, 'click', (e) => {
                console.log('지도 클릭됨:', e.coord.y, e.coord.x, '편집모드:', isEditingRef.current);

                setLat(e.coord.y);
                setLon(e.coord.x);

                if (isEditingRef.current) {
                    addMarker(e.coord.y, e.coord.x, selectedMarkerTypeRef.current);
                }
            });

            console.log('네이버 지도 초기화 완료');
        };

        script.onerror = () => {
            console.error('네이버 지도 스크립트 로드 실패');
        };

        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    // ⭐ 마커를 불러와 지도에 추가하는 비동기 함수
    const fetchMarkers = async (map) => {
        try {
            const response = await axios.get('http://localhost:3001/api/marker/allmarkers');
            const markerDataList = response.data;

            console.log('✅ 서버에서 마커 데이터 로드 성공:', markerDataList);

            markerDataList.forEach(markerData => {
                // ⭐ lat와 lon을 숫자로 변환합니다.
                const lat = parseFloat(markerData.lat);
                const lon = parseFloat(markerData.lon);
                const { marker_type } = markerData;

                // 만약 변환된 값이 유효하지 않은 숫자(NaN)라면 건너뜁니다.
                if (isNaN(lat) || isNaN(lon)) {
                    console.error('유효하지 않은 위/경도 데이터:', markerData);
                    return;
                }

                const newMarkerData = {
                    id: markerData.id,
                    lat,
                    lng: lon,
                    type: marker_type,
                    name: markerTypes[marker_type].name
                };

                const naverMarker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(lat, lon),
                    map: map,
                    icon: {
                        content: createMarkerContent(marker_type),
                        anchor: new window.naver.maps.Point(15, 15)
                    }
                });

                window.naver.maps.Event.addListener(naverMarker, 'click', () => {
                    alert(`${newMarkerData.name} 마커\n위치: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                });

                setMarkers(prev => [...prev, newMarkerData]);
                markersRef.current.push(naverMarker);
            });
            console.log(`지도에 총 ${markerDataList.length}개의 마커가 추가되었습니다.`);

        } catch (error) {
            console.error('❌ 마커 데이터 로드 실패:', error.response ? error.response.data : error.message);
        }
    };

    const handleToggleEditing = () => {
        setIsEditing(prev => {
            console.log('편집 모드 변경:', !prev);
            return !prev;
        });
    };

    // ⭐ filterType 상태에 따라 마커 가시성을 동적으로 변경
    useEffect(() => {
        if (!mapRef.current || markersRef.current.length === 0) return;

        markersRef.current.forEach((naverMarker, index) => {
            const markerData = markers[index];

            if (filterType === 'all' || markerData.type === filterType) {
                naverMarker.setMap(mapRef.current);
            } else {
                naverMarker.setMap(null);
            }
        });

    }, [filterType, markers]); // markers가 변경될 때도 이펙트 실행

    // ⭐️ 필터링된 마커 리스트 생성
    const filteredMarkers = filterType === 'all'
        ? markers
        : markers.filter(marker => marker.type === filterType);


    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
                id="naverMap"
                style={{ width: "100%", height: "100%", borderRadius: "10px" }}
            ></div>

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
            </button>

            {/* ⭐ 마커 필터링 버튼 패널 */}
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
                {Object.entries(markerTypes).map(([type, config]) => (
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
                ))}
            </div>

            {isEditing && (
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
                    {Object.entries(markerTypes).map(([type, config]) => (
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
                    ))}
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

            {isEditing && filteredMarkers.length > 0 && ( // 필터링된 마커 리스트 사용
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
                    <h4 style={{ margin: '0 0 10px 0' }}>추가된 마커 ({filteredMarkers.length}개)</h4> {/* 필터링된 개수 표시 */}
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
                                <span style={{ marginRight: '5px' }}>{markerTypes[marker.type].icon}</span>
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

            {isEditing && markers.length === 0 && (
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
                    <p>현재 선택된 마커: {markerTypes[selectedMarkerType].icon} {markerTypes[selectedMarkerType].name}</p>
                    <p>편집모드 상태: {isEditingRef.current ? 'ON' : 'OFF'}</p>
                </div>
            )}

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
        </div>
    );
};

export default React.memo(NaverMap, (prevProps, nextProps) => {
    return prevProps.onMarkerClick === nextProps.onMarkerClick;
});