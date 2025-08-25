import React from 'react';

interface ModalsProps {
  isOpen: boolean;
  onClose: () => void;
  markerType: string;
  markerData: any;
}

const Modals: React.FC<ModalsProps> = ({ isOpen, onClose, markerType, markerData }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>마커 정보</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="modal-body">
          <p>마커 타입: {markerType}</p>
          <p>마커 데이터: {JSON.stringify(markerData)}</p>
        </div>
      </div>
    </div>
  );
};

export default Modals;
