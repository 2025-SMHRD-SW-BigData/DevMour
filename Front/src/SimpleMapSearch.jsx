import React, { useState, useContext } from 'react';
import { InfoContext } from './context/InfoContext';

const SimpleMapSearch = ({ mapRef }) => {
    const [searchAddress, setSearchAddress] = useState('');
    const { setLat, setLon } = useContext(InfoContext);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchAddress.trim() || !mapRef.current) return;

        // 네이버 지도 geocoder 서비스를 사용하여 주소 검색
        window.naver.maps.Service.geocode({
            query: searchAddress.trim()
        }, function(status, response) {
            if (status === window.naver.maps.Service.Status.ERROR) {
                alert('주소 검색 중 오류가 발생했습니다.');
                return;
            }

            if (response.v2.meta.totalCount === 0) {
                alert('검색된 주소가 없습니다.');
                return;
            }

            const item = response.v2.addresses[0];
            const newLat = parseFloat(item.y);
            const newLon = parseFloat(item.x);

            // InfoContext의 lat, lon 값 갱신
            setLat(newLat);
            setLon(newLon);

            // 지도를 해당 위치로 이동 (애니메이션 효과 포함)
            const position = new window.naver.maps.LatLng(newLat, newLon);
            
            // 부드러운 이동을 위해 애니메이션 적용
            mapRef.current.panTo(position, {
                duration: 1000,
                easing: 'easeOutCubic'
            });

            // 줌 레벨 조정
            setTimeout(() => {
                mapRef.current.setZoom(14);
            }, 500);

            console.log('검색 완료:', { address: searchAddress, lat: newLat, lon: newLon });
        });
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '15px 20px',
            borderRadius: '25px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            minWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        }}>
            <div style={{ flex: 1 }}>
                <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    placeholder="주소를 입력하세요 (예: 광주광역시 서구)"
                    style={{
                        width: '100%',
                        padding: '10px 15px',
                        border: '1px solid #ddd',
                        borderRadius: '20px',
                        fontSize: '14px',
                        outline: 'none',
                        borderColor: '#4CAF50'
                    }}
                />
            </div>
            <button
                onClick={handleSearch}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                }}
            >
                🔍 검색
            </button>
        </div>
    );
};

export default SimpleMapSearch;
