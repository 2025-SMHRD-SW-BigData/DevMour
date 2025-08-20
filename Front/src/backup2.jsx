import React, { useEffect, useState, useRef, useContext } from "react";
import { InfoContext } from "./context/InfoContext";

const NaverMap = ({ onMarkerClick }) => {
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(isEditing);
  
  const [path, setPath] = useState([]);
  const [displayedCoords, setDisplayedCoords] = useState([]);

  const {lat, setLat, lon, setLon} = useContext(InfoContext);

  // isEditing 상태가 변경될 때마다 ref를 업데이트합니다.
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // 지도 클릭 시 lat, lon에 값을 즉시 갱신하기 위한 초기화 로직
  // 컴포넌트 마운트 시 한 번만 실행되도록 합니다.
  useEffect(() => {
    setLat(35.146667);
    setLon(126.888667);
  }, []); // 빈 의존성 배열로 마운트 시 한 번만 실행됩니다.

  // 지도 초기화 함수
  const initializeMap = (centerLat = 35.146667, centerLon = 126.888667, zoomLevel = 13) => {
    if (window.naver && window.naver.maps) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(centerLat, centerLon),
        zoom: zoomLevel,
        mapTypeControl: true,
        maxBounds: new window.naver.maps.LatLngBounds(
          new window.naver.maps.LatLng(35.0, 126.6),
          new window.naver.maps.LatLng(35.2, 127.0)
        ),
        minZoom: 11
      };
      const map = new window.naver.maps.Map('naverMap', mapOptions);
      mapRef.current = map;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(centerLat, centerLon),
        map: map,
      });
      
      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (onMarkerClick) {
          onMarkerClick();
        }
      });
      
      // 📍 지도 클릭 이벤트 리스너 등록
      window.naver.maps.Event.addListener(map, 'click', (e) => {
        setPath(prevPath => [...prevPath, e.coord]);
        setDisplayedCoords(prevCoords => [...prevCoords, e.coord]);

        // Context 상태 업데이트
        setLat?.(e.coord.y);
        setLon?.(e.coord.x);
        
        // 현재 줌 레벨 가져오기
        const currentZoom = map.getZoom();
        
        // 클릭한 위치와 현재 줌으로 지도 재초기화
        setTimeout(() => {
          initializeMap(e.coord.y, e.coord.x, currentZoom);
        }, 100);
        
        console.log('Updated - Lat:', e.coord.y, 'Lon:', e.coord.x, 'Zoom:', currentZoom);
        console.log(lat,lon)
      });
    }
  };

  // 1. 지도 스크립트 로드 및 초기화 (한 번만 실행되도록 빈 배열)
  useEffect(() => {
    const script = document.createElement("script");
    const newClientId = "se9uk5m3m9";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${newClientId}&submodules=geocoder`;
    script.async = true;

    script.onload = () => {
      initializeMap();
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []); // 빈 배열로 변경해서 한 번만 실행

  // 2. path 상태 변경에 따라 Polyline 동적 업데이트
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (path.length > 0) {
      if (polylineRef.current) {
        polylineRef.current.setPath(path);
      } else {
        const newPolyline = new window.naver.maps.Polyline({
          map: mapRef.current,
          path: path,
          strokeColor: '#FF0000',
          strokeWeight: 6,
          strokeOpacity: 0.8,
        });
        polylineRef.current = newPolyline;
      }
    } else {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    }
  }, [path]);

  const handleToggleEditing = () => {
    setIsEditing(prev => !prev);
    if (!isEditing) { // 편집 모드 시작 시
      setPath([]);
      setDisplayedCoords([]);
    }
  };

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
          cursor: 'pointer' 
        }}>
        {isEditing ? '편집 완료' : '편집 모드 시작'}
      </button>
      {isEditing && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          zIndex: 100,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          <h4>선택된 위치 정보</h4>
          {displayedCoords.length === 0 ? (
            <p>지도를 클릭하여 위치를 추가하세요.</p>
          ) : (
            displayedCoords.map((coord, index) => (
              <p key={index}>
                {index + 1}. Lat: {coord.y.toFixed(6)}, Lng: {coord.x.toFixed(6)}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(NaverMap, (prevProps, nextProps) => {
  // onMarkerClick prop이 바뀌지 않으면 리렌더링 방지
  return prevProps.onMarkerClick === nextProps.onMarkerClick;
});