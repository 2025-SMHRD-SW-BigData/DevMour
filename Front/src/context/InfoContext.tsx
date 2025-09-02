import React, { createContext, useState, ReactNode } from "react";

interface LocationInfo {
  lat: number;
  setLat: (lat: number) => void;
  lon: number;
  setLon: (lon: number) => void;
  updateLocation: (newLat: number, newLon: number) => void;
}

// 위도, 경도 등의 정보를 담아둘 전역 context
export const InfoContext = createContext<LocationInfo | undefined>(undefined);

interface InfoProviderProps {
  children: ReactNode;
}

export const InfoProvider: React.FC<InfoProviderProps> = ({ children }) => {
  const [lat, setLat] = useState<number>(35.159983);
  const [lon, setLon] = useState<number>(126.8513092);

  const updateLocation = (newLat: number, newLon: number) => {
    setLat(newLat);
    setLon(newLon);
  };

  const value: LocationInfo = {
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
