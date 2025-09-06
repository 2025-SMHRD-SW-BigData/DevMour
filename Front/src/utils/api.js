// API 요청 유틸리티

import { getToken, isLoggedIn, isValidTokenFormat } from './auth';

// 기본 API 설정
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://0.0.0.0:3001/api';
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // 프로덕션에서는 상대 경로 사용
  : 'http://175.45.194.114:3001/api';  // 개발 환경에서는 localhost 사용
// JWT 토큰을 포함한 헤더 생성
const createAuthHeaders = () => {
  const token = getToken();
  
  // 토큰이 유효한 형식인지 확인
  if (!token || !isValidTokenFormat(token)) {
    throw new Error('유효하지 않은 토큰입니다.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// API 요청 함수들
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // 로그인 상태 확인
    if (!isLoggedIn()) {
      throw new Error('로그인이 필요합니다.');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...createAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // 인증 실패 시 로그아웃 처리
      console.log('401 인증 실패 - 로그아웃 처리');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('jwt_token');
      sessionStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 요청 오류:', error);
    throw error;
  }
};

// GET 요청
export const apiGet = (endpoint) => {
  return apiRequest(endpoint, { method: 'GET' });
};

// POST 요청
export const apiPost = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// PUT 요청
export const apiPut = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// DELETE 요청
export const apiDelete = (endpoint) => {
  return apiRequest(endpoint, { method: 'DELETE' });
};

// 로그인 API (토큰 검증 없음)
export const loginApi = async (credentials) => {
  const url = `${API_BASE_URL}/auth/login`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `로그인 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('로그인 API 오류:', error);
    throw error;
  }
};

// 사용자 등록 API (토큰 검증 없음)
export const registerApi = async (userData) => {
  const url = `${API_BASE_URL}/register/register`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `등록 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('등록 API 오류:', error);
    throw error;
  }
};

// 시민 제보 상세 정보 조회 API (토큰 검증 없음)
export const getComplaintDetail = async (reportId) => {
  const url = `${API_BASE_URL}/complaint/detail/${reportId}`;
  console.log('시민 제보 상세 정보 조회 API 요청:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('시민 제보 상세 정보 조회 API 응답 상태:', response.status);

    if (response.status === 404) {
      // 상세 정보가 없는 경우
      console.log('404 응답 - 시민 제보 상세 정보 없음');
      return { success: false, message: '시민 제보 정보를 찾을 수 없습니다.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API 오류 응답:', errorData);
      throw new Error(errorData.message || `시민 제보 상세 정보 조회 실패: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('시민 제보 상세 정보 조회 API 응답 데이터:', responseData);
    return responseData;
  } catch (error) {
    console.error('시민 제보 상세 정보 조회 API 오류:', error);
    throw error;
  }
};


// 시민 제보 분석 결과 조회 API (토큰 검증 없음)
export const getComplaintAnalysisResult = async (reportId) => {
  const url = `${API_BASE_URL}/complaint/citizen-result/${reportId}`;
  console.log('시민 제보 분석 결과 조회 API 요청:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('시민 제보 분석 결과 조회 API 응답 상태:', response.status);

    if (response.status === 404) {
      // 분석 결과가 없는 경우
      console.log('404 응답 - 분석 결과 없음');
      return { success: false, message: '분석 전입니다.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API 오류 응답:', errorData);
      throw new Error(errorData.message || `분석 결과 조회 실패: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('시민 제보 분석 결과 조회 API 응답 데이터:', responseData);
    return responseData;
  } catch (error) {
    console.error('시민 제보 분석 결과 조회 API 오류:', error);
    throw error;
  }
};

// 시민 제보 침수 분석 결과 조회 API (토큰 검증 없음)
export const getComplaintFloodResult = async (reportId) => {
  const url = `${API_BASE_URL}/complaint/flood-result/${reportId}`;
  console.log('시민 제보 침수 분석 결과 조회 API 요청:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('시민 제보 침수 분석 결과 조회 API 응답 상태:', response.status);

    if (response.status === 404) {
      // 분석 결과가 없는 경우
      console.log('404 응답 - 침수 분석 결과 없음');
      return { success: false, message: '침수 분석 전입니다.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API 오류 응답:', errorData);
      throw new Error(errorData.message || `침수 분석 결과 조회 실패: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('시민 제보 침수 분석 결과 조회 API 응답 데이터:', responseData);
    return responseData;
  } catch (error) {
    console.error('시민 제보 침수 분석 결과 조회 API 오류:', error);
    throw error;
  }
};
