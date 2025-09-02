import React, { useState } from 'react';

const MapSearch = ({ onSearch, onCoordinateSearch }) => {
    const [searchAddress, setSearchAddress] = useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchAddress.trim()) {
            onSearch(searchAddress.trim());
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e);
        }
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
                    onKeyDown={handleSearchKeyDown}
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
                onClick={handleSearchSubmit}
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

export default MapSearch;
