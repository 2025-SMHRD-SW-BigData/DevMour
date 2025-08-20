import React, { useEffect, useState, useRef, useContext } from "react";
import { InfoContext } from "./context/InfoContext";

const NaverMap = ({ onMarkerClick }) => {
  const mapRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(isEditing);
  const [selectedMarkerType, setSelectedMarkerType] = useState('cctv');
  const selectedMarkerTypeRef = useRef(selectedMarkerType);
  const [markers, setMarkers] = useState([]);
  const markersRef = useRef([]);

  // useContext를 사용하여 lat, lon 상태와 setter 함수를 가져옵니다.
  // 이 값들은 컴포넌트가 렌더링될 때마다 최신 값으로 업데이트됩니다.
  const { lat, setLat, lon, setLon } = useContext(InfoContext);
  
  // lat, lon의 최신 값을 useRef에 저장하여 클로저 문제를 해결합니다.
  const latRef = useRef(lat);
  const lonRef = useRef(lon);
  
  // lat, lon 상태가 변경될 때마다 ref를 업데이트합니다.
  useEffect(() => {
    latRef.current = lat;
    lonRef.current = lon;
  }, [lat, lon]);

  // isEditing 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    selectedMarkerTypeRef.current = selectedMarkerType;
  }, [selectedMarkerType]);

  // 마커 타입별 설정
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

  // 커스텀 마커 HTML 생성
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

  // 마커 추가 함수
  const addMarker = (lat, lng, type) => {
    if (!mapRef.current) return;

    const newMarkerData = {
      id: Date.now(),
      lat,
      lng,
      type,
      name: markerTypes[type].name
    };

    // 네이버 지도에 마커 추가
    const naverMarker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map: mapRef.current,
      icon: {
        content: createMarkerContent(type),
        anchor: new window.naver.maps.Point(15, 15)
      }
    });

    // 마커 클릭 이벤트
    window.naver.maps.Event.addListener(naverMarker, 'click', () => {
      alert(`${newMarkerData.name} 마커\n위치: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    });

    // 상태 업데이트
    setMarkers(prev => [...prev, newMarkerData]);
    markersRef.current.push(naverMarker);

    console.log(`마커 추가됨: ${type} at ${lat}, ${lng}`);
  };

  // 마커 삭제 함수
  const removeMarker = (markerId) => {
    const markerIndex = markers.findIndex(m => m.id === markerId);
    if (markerIndex !== -1) {
      // 네이버 지도에서 마커 제거
      if (markersRef.current[markerIndex]) {
        markersRef.current[markerIndex].setMap(null);
        markersRef.current.splice(markerIndex, 1);
      }
      // 상태에서 마커 제거
      setMarkers(prev => prev.filter(marker => marker.id !== markerId));
    }
  };

  // 모든 마커 삭제
  const clearAllMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    setMarkers([]);
  };

  // 지도 스크립트 로드 및 초기화
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

      // 기본 마커
      const defaultMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(35.146667, 126.888667),
        map: map,
      });

      window.naver.maps.Event.addListener(defaultMarker, 'click', () => {
        if (onMarkerClick) {
          onMarkerClick();
        }
      });

      // 지도 클릭 이벤트 리스너 등록
      window.naver.maps.Event.addListener(map, 'click', (e) => {
        console.log('지도 클릭됨:', e.coord.y, e.coord.x, '편집모드:', isEditingRef.current);
        
        // Context 상태 업데이트
        setLat(e.coord.y);
        setLon(e.coord.x);
        
        // 최신 lat, lon 값은 바로 업데이트되지 않으므로 log에서는 ref를 사용하거나, 다음 렌더링에서 확인
        console.log("업데이트 요청 완료. 다음 렌더링 시 반영될 값:", e.coord.y, e.coord.x);
        
        // ref를 사용해서 최신 isEditing 값 참조
        if (isEditingRef.current) {
          console.log('마커 추가 시도:', selectedMarkerTypeRef.current);
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
  }, []); // 빈 배열로 한 번만 실행

  // 편집 모드 토글
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
      
      {/* 편집 모드 토글 버튼 */}
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

      {/* 마커 타입 선택 패널 */}
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

      {/* 마커 목록 */}
      {isEditing && markers.length > 0 && (
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
          <h4 style={{ margin: '0 0 10px 0' }}>추가된 마커 ({markers.length}개)</h4>
          {markers.map((marker, index) => (
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

      {/* 편집 모드 안내 */}
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

      {/* 디버그 정보 */}
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