import React, { useEffect, useRef, useState } from 'react';

const AddMap = ({ onLocationSelect, initialCenter = { lat: 35.192764, lng: 126.864441 } }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [selectedMarker, setSelectedMarker] = useState(null);

    // 지도에서 클릭한 위치의 좌표를 부모 컴포넌트로 전달
    const handleMapClick = (event) => {
        const lat = event.coord.lat();
        const lng = event.coord.lng();
        
        console.log('📍 지도에서 선택된 좌표:', { lat, lng });
        
        // 기존 마커 제거
        if (selectedMarker) {
            selectedMarker.setMap(null);
        }
        
        // 새로운 마커 생성
        const newMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(lat, lng),
            map: mapInstanceRef.current,
            icon: {
                content: `
                    <div style="
                        background: #4CAF50; 
                        width: 20px; 
                        height: 20px; 
                        border-radius: 50%; 
                        border: 2px solid white; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            top: -25px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: #333;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            white-space: nowrap;
                            z-index: 1000;
                        ">
                            📍 CCTV 위치
                        </div>
                    </div>
                `,
                anchor: new window.naver.maps.Point(10, 10)
            }
        });
        
        setSelectedMarker(newMarker);
        
        // 부모 컴포넌트로 좌표 전달
        onLocationSelect({ lat, lng });
    };

    // 지도 초기화
    useEffect(() => {
        const script = document.createElement("script");
        const clientId = "se9uk5m3m9";
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
        script.async = true;

        script.onload = () => {
            if (mapRef.current && !mapInstanceRef.current) {
                const map = new window.naver.maps.Map(mapRef.current, {
                    center: new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
                    zoom: 15,
                    mapTypeControl: false,
                    scaleControl: false,
                    logoControl: false,
                    mapDataControl: false,
                    zoomControl: true,
                    minZoom: 10,
                    maxZoom: 18
                });

                mapInstanceRef.current = map;

                // 지도 클릭 이벤트
                window.naver.maps.Event.addListener(map, 'click', handleMapClick);

                // 초기 위치에 참고용 마커 추가 (URL에서 추출한 좌표)
                const referenceMarker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
                    map: map,
                    icon: {
                        content: `
                            <div style="
                                background: #FF9800; 
                                width: 20px; 
                                height: 20px; 
                                border-radius: 50%; 
                                border: 2px solid white; 
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                position: relative;
                            ">
                                <div style="
                                    position: absolute;
                                    top: -25px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    background: #333;
                                    color: white;
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                    font-size: 12px;
                                    white-space: nowrap;
                                    z-index: 1000;
                                ">
                                    📍 URL 추출 좌표
                                </div>
                            </div>
                        `,
                        anchor: new window.naver.maps.Point(10, 10)
                    }
                });

                console.log('✅ AddMap 초기화 완료 - 초기 중심점:', initialCenter);
            }
        };

        script.onerror = () => {
            console.error('❌ 네이버 지도 스크립트 로드 실패');
        };

        document.head.appendChild(script);

        return () => {
            // 컴포넌트 언마운트 시 마커 정리
            if (selectedMarker) {
                selectedMarker.setMap(null);
            }
        };
    }, [initialCenter.lat, initialCenter.lng]);

    return (
        <div className="add-map-container">
            <div 
                ref={mapRef} 
                className="naver-map"
                style={{ 
                    width: '100%', 
                    height: '500px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0'
                }}
            ></div>
        </div>
    );
};

export default AddMap;
