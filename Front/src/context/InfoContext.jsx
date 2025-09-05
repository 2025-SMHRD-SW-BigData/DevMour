import React, { createContext, useState } from "react";

// 위도, 경도 등의 정보를 담아둘 전역 context
export const InfoContext = createContext();

export const InfoProvider = ({ children }) => {
  const [lat, setLat] = useState(35.159983);
  const [lon, setLon] = useState(126.8513092);

  const updateLocation = (newLat, newLon) => {
    setLat(newLat);
    setLon(newLon);
  };

  const value = {
    lat,
    setLat,
    lon,
    setLon,
    updateLocation
  };

  return (
    <InfoContext.Provider value={value}>
      {children}
    </InfoContext.Provider>
  );
};
