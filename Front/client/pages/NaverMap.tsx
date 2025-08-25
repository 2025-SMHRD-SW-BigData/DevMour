import React from 'react';

const NaverMap: React.FC = () => {
  return (
    <div className="naver-map">
      <div style={{ 
        width: '100%', 
        height: '400px', 
        backgroundColor: '#e0e0e0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '8px',
        border: '2px dashed #ccc'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <h3>네이버 지도</h3>
          <p>지도 컴포넌트가 여기에 표시됩니다</p>
        </div>
      </div>
    </div>
  );
};

export default NaverMap;
