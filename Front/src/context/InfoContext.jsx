import React, { createContext, useState } from "react";

// 위도, 경도 등의 정보를 담아둘 전역 context
export const InfoContext = createContext();

export const InfoProvider = ({ children }) => {
  const [lat, setLat] = useState(35.159983);
  const [lon, setLon] = useState(126.8513092);
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [citizenReportData, setCitizenReportData] = useState(null);

  const updateLocation = (newLat, newLon) => {
    setLat(newLat);
    setLon(newLon);
  };

  const openCitizenReportModal = (notificationData, detailData = null) => {
    console.log('🔓 Context에서 시민 제보 모달 열기:', { notificationData, detailData });
    
    // 시민 제보 데이터 저장
    setCitizenReportData({
      notification: notificationData,
      detail: detailData
    });
    
    // 모달 열기
    setModalType('complaint');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('🔒 Context에서 모달 닫기');
    setIsModalOpen(false);
    setModalType(null);
    setModalData(null);
    setCitizenReportData(null);
  };

  const value = {
    lat,
    setLat,
    lon,
    setLon,
    updateLocation,
    modalData,
    setModalData,
    isModalOpen,
    setIsModalOpen,
    modalType,
    setModalType,
    citizenReportData,
    setCitizenReportData,
    openCitizenReportModal,
    closeModal
  };

  return (
    <InfoContext.Provider value={value}>
      {children}
    </InfoContext.Provider>
  );
};
