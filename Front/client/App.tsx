import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "../src/Dashboard";
import NotFound from "./pages/NotFound";
import { InfoProvider } from "../src/context/InfoContext.jsx";

// 상세보기 페이지들 import
import RiskRankingDetail from "../src/pages/RiskRankingDetail";
import ComplaintDetail from "../src/pages/ComplaintDetail";
import ConstructionDetail from "../src/pages/ConstructionDetail";
import RiskScoreDetail from "../src/pages/RiskScoreDetail";
import ComparisonDetail from "../src/pages/ComparisonDetail";
import AlertDetail from "../src/pages/AlertDetail";
import CCTVAdd from "../src/pages/CCTVAdd";
import NaverMap from "../src/NaverMap";
import WeatherDisplay from "../src/WeatherDisplay";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <Dashboard />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            
            {/* 상세보기 페이지 라우트들 */}
            <Route 
              path="/risk-ranking" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <RiskRankingDetail />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/complaints" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <ComplaintDetail />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/construction" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <ConstructionDetail />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/risk-score" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <RiskScoreDetail />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comparison" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <ComparisonDetail />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/alerts" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <AlertDetail />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cctv-add" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <CCTVAdd />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/navermap" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <NaverMap />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/weatherdisplay" 
              element={
                <ProtectedRoute>
                  <InfoProvider>
                    <WeatherDisplay />
                  </InfoProvider>
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
