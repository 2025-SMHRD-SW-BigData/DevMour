import React, { useEffect, useState, useRef, useContext } from "react";
import { InfoContext } from "./context/InfoContext";

const NaverMap = ({ onMarkerClick }) => {
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(isEditing); // isEditing 상태를 위한 ref
  
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

  // 1. 지도 초기화 및 이벤트 리스너 등록 (컴포넌트 마운트 시 단 한 번만 실행)
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

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(35.146667, 126.888667),
        map: map,
      });
      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (onMarkerClick) {
          onMarkerClick();
        }
      });
      
      // 📍 지도 클릭 이벤트 리스너 등록
      window.naver.maps.Event.addListener(map, 'click', (e) => {
        // ref를 사용해 최신 isEditing 값을 참조합니다.
        
          setPath(prevPath => [...prevPath, e.coord]);
          setDisplayedCoords(prevCoords => [...prevCoords, e.coord]);

          setLat?.(e.coord.y);
          setLon?.(e.coord.x);
          console.log(lat)
          console.log(lon)
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [onMarkerClick]); // 의존성 배열에서 isEditing을 제거하여 마운트 시에만 실행되도록 합니다.

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

export default NaverMap;