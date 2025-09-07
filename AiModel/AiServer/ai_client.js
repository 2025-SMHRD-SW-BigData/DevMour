const axios = require('axios');
require('dotenv').config();

class AIClient {
  constructor() {
    this.baseURL = 'http://localhost:8000';
    this.timeout =30000;
    
    // axios 인스턴스 생성
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('AI 서버 통신 오류:', error.message);
        throw error;
      }
    );
  }
  
  /**
   * AI 서버 상태 확인
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`AI 서버 상태 확인 실패: ${error.message}`);
    }
  }
  
  /**
   * 이미지 분석 요청
   */
  async analyzeImage(imageBuffer, filename) {
    try {
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });
      
      const response = await this.client.post('/api/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`이미지 분석 실패: ${error.message}`);
    }
  }
  
  /**
   * CCTV 분석 요청
   */
  async analyzeCCTV() {
    try {
      const response = await this.client.post('/api/analyze-cctv');
      return response.data;
    } catch (error) {
      throw new Error(`CCTV 분석 실패: ${error.message}`);
    }
  }
  
  /**
   * 모델 정보 조회
   */
  async getModelsInfo() {
    try {
      const response = await this.client.get('/api/models');
      return response.data;
    } catch (error) {
      throw new Error(`모델 정보 조회 실패: ${error.message}`);
    }
  }
  
  /**
   * 클래스 정보 조회
   */
  async getClassesInfo() {
    try {
      const response = await this.client.get('/api/classes');
      return response.data;
    } catch (error) {
      throw new Error(`클래스 정보 조회 실패: ${error.message}`);
    }
  }
  
  /**
   * AI 서버 연결 테스트
   */
  async testConnection() {
    try {
      const health = await this.checkHealth();
      return {
        connected: true,
        status: health.status,
        models_loaded: health.models_loaded,
        cctv_connected: health.cctv_connected
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = AIClient;
