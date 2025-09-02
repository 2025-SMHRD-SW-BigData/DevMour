// JWT 토큰 관리 유틸리티

// 안전한 base64 디코딩 함수
const safeBase64Decode = (str) => {
  try {
    // base64 문자열을 URL 안전하게 만들기
    const normalizedStr = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // 패딩 추가 (base64는 4의 배수여야 함)
    const paddedStr = normalizedStr + '='.repeat((4 - normalizedStr.length % 4) % 4);
    
    return atob(paddedStr);
  } catch (error) {
    console.error('Base64 디코딩 실패:', error);
    throw new Error('유효하지 않은 base64 문자열입니다.');
  }
};

// JWT 토큰 형식 검증
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // JWT 토큰은 3개의 부분으로 구성되어야 함 (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // 각 부분이 base64로 인코딩되어 있어야 함
  try {
    parts.forEach(part => {
      if (part.trim() === '') {
        throw new Error('빈 토큰 부분');
      }
      // 안전한 base64 디코딩 시도
      safeBase64Decode(part);
    });
    return true;
  } catch (error) {
    return false;
  }
};

// 토큰 저장
export const saveToken = (token, rememberMe = false) => {
  if (rememberMe) {
    // 로그인 상태 유지 체크 시 - localStorage에 저장 (영구 보관)
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('remember_me', 'true');
  } else {
    // 로그인 상태 유지 미체크 시 - sessionStorage에 저장 (브라우저 탭 닫으면 삭제)
    sessionStorage.setItem('jwt_token', token);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('remember_me');
  }
};

// 토큰 가져오기
export const getToken = () => {
  // localStorage에서 먼저 확인 (로그인 상태 유지)
  let token = localStorage.getItem('jwt_token');
  
  if (!token) {
    // localStorage에 없으면 sessionStorage에서 확인
    token = sessionStorage.getItem('jwt_token');
  }
  
  return token;
};

// 토큰 삭제
export const removeToken = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('remember_me');
  sessionStorage.removeItem('jwt_token');
  sessionStorage.removeItem('user');
};

// 사용자 정보 저장
export const saveUser = (user, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('user');
  }
};

// 사용자 정보 가져오기
export const getUser = () => {
  let user = localStorage.getItem('user');
  
  if (!user) {
    user = sessionStorage.getItem('user');
  }
  
  return user ? JSON.parse(user) : null;
};

// 사용자 정보 삭제
export const removeUser = () => {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

// JWT 토큰 만료 시간 확인
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // 토큰 형식 검증
    if (!isValidTokenFormat(token)) {
      console.warn('유효하지 않은 토큰 형식');
      return true;
    }
    
    const parts = token.split('.');
    const payload = JSON.parse(safeBase64Decode(parts[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('토큰 파싱 오류:', error);
    return true;
  }
};

// 토큰 만료까지 남은 시간 (분 단위)
export const getTokenExpiryTime = (token) => {
  if (!token) return 0;
  
  try {
    // 토큰 형식 검증
    if (!isValidTokenFormat(token)) {
      console.warn('유효하지 않은 토큰 형식');
      return 0;
    }
    
    const parts = token.split('.');
    const payload = JSON.parse(safeBase64Decode(parts[1]));
    const currentTime = Date.now() / 1000;
    return Math.max(0, Math.floor((payload.exp - currentTime) / 60));
  } catch (error) {
    console.error('토큰 파싱 오류:', error);
    return 0;
  }
};

// 로그인 상태 확인
export const isLoggedIn = () => {
  const token = getToken();
  if (!token) return false;
  
  if (isTokenExpired(token)) {
    // 토큰이 만료되었으면 삭제
    removeToken();
    removeUser();
    return false;
  }
  
  return true;
};

// 로그인 상태 유지 여부 확인
export const isRememberMeEnabled = () => {
  return localStorage.getItem('remember_me') === 'true';
};

// 디버깅용: 현재 저장된 토큰 상태 확인
export const debugTokenStatus = () => {
  const localToken = localStorage.getItem('jwt_token');
  const sessionToken = sessionStorage.getItem('jwt_token');
  const rememberMe = localStorage.getItem('remember_me');
  const localUser = localStorage.getItem('user');
  const sessionUser = sessionStorage.getItem('user');
  
  console.log('🔍 토큰 상태 디버깅:');
  console.log('localStorage 토큰:', localToken ? `${localToken.substring(0, 20)}...` : '없음');
  console.log('sessionStorage 토큰:', sessionToken ? `${sessionToken.substring(0, 20)}...` : '없음');
  console.log('로그인 상태 유지:', rememberMe);
  console.log('localStorage 사용자:', localUser ? '있음' : '없음');
  console.log('sessionStorage 사용자:', sessionUser ? '있음' : '없음');
  
  if (localToken) {
    console.log('localStorage 토큰 형식 검증:', isValidTokenFormat(localToken));
    console.log('localStorage 토큰 만료 여부:', isTokenExpired(localToken));
  }
  
  if (sessionToken) {
    console.log('sessionStorage 토큰 형식 검증:', isValidTokenFormat(sessionToken));
    console.log('sessionStorage 토큰 만료 여부:', isTokenExpired(sessionToken));
  }
};

// 모든 인증 데이터 초기화 (디버깅용)
export const clearAllAuthData = () => {
  console.log('🧹 모든 인증 데이터 초기화');
  removeToken();
  removeUser();
  stopTokenExpiryCheck();
};

// 토큰 자동 갱신 체크 (만료 10분 전에 경고)
export const checkTokenExpiry = () => {
  const token = getToken();
  if (!token) return;
  
  const expiryMinutes = getTokenExpiryTime(token);
  
  if (expiryMinutes <= 10 && expiryMinutes > 0) {
    // 만료 10분 전에 경고
    console.warn(`⚠️ JWT 토큰이 ${expiryMinutes}분 후에 만료됩니다.`);
    
    // 사용자에게 알림 (선택사항)
    if (expiryMinutes <= 5) {
      alert(`세션이 ${expiryMinutes}분 후에 만료됩니다. 작업을 저장하고 다시 로그인해주세요.`);
    }
  }
  
  if (expiryMinutes <= 0) {
    // 토큰이 만료되었으면 자동 로그아웃
    console.warn('🔒 JWT 토큰이 만료되어 자동 로그아웃됩니다.');
    logout();
  }
};

// 주기적으로 토큰 만료 시간 체크 (1분마다)
export const startTokenExpiryCheck = () => {
  // 이미 실행 중이면 중복 실행 방지
  if (window.tokenExpiryInterval) {
    clearInterval(window.tokenExpiryInterval);
  }
  
  window.tokenExpiryInterval = setInterval(() => {
    checkTokenExpiry();
  }, 60000); // 1분마다 체크
};

// 토큰 만료 체크 중지
export const stopTokenExpiryCheck = () => {
  if (window.tokenExpiryInterval) {
    clearInterval(window.tokenExpiryInterval);
    window.tokenExpiryInterval = null;
  }
};

// 로그아웃
export const logout = () => {
  stopTokenExpiryCheck();
  removeToken();
  removeUser();
  window.location.href = '/';
};

// 쿠키에 아이디 저장
export const saveUsernameToCookie = (username) => {
  // 30일간 유효한 쿠키 설정
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  document.cookie = `saved_username=${encodeURIComponent(username)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
};

// 쿠키에서 아이디 불러오기
export const getUsernameFromCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'saved_username') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// 쿠키에서 아이디 삭제
export const removeUsernameFromCookie = () => {
  document.cookie = 'saved_username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};
