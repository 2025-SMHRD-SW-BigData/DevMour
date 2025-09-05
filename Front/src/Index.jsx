import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveToken, saveUser, isLoggedIn, isRememberMeEnabled, startTokenExpiryCheck, stopTokenExpiryCheck, saveUsernameToCookie, getUsernameFromCookie, removeUsernameFromCookie } from "./utils/auth";
import { loginApi } from "./utils/api";

const slideImages = [
  "https://cdn.builder.io/o/assets%2F608bbcadd79e43b89c275f9fa0935f53%2F81fbc5ee13bc4abda6b7dad5cb4a705c?alt=media&token=b0f0467e-5978-4dc6-b5da-1549bebd7326&apiKey=608bbcadd79e43b89c275f9fa0935f53",
  "https://cdn.builder.io/o/assets%2F608bbcadd79e43b89c275f9fa0935f53%2F4b3a6244f28445c6869139f95f4d5e70?alt=media&token=df7010fe-6856-445e-a687-a43ef3ced2da&apiKey=608bbcadd79e43b89c275f9fa0935f53",
  "https://cdn.builder.io/o/assets%2F608bbcadd79e43b89c275f9fa0935f53%2F43aed88a0428421cad4e7793226568bb?alt=media&token=19c9a0f8-b52b-45da-befd-e51afe2edb36&apiKey=608bbcadd79e43b89c275f9fa0935f53",
  "https://images.unsplash.com/photo-1730825963012-579d146bd11a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
];

export default function Index() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [saveUsername, setSaveUsername] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 페이지 로드 시 로그인 상태 확인 및 저장된 아이디 불러오기
  useEffect(() => {
    // 이전에 로그인 상태 유지를 체크했는지 확인
    setRememberMe(isRememberMeEnabled());
    
    // 저장된 아이디 불러오기
    const savedUsername = getUsernameFromCookie();
    if (savedUsername) {
      setUsername(savedUsername);
      setSaveUsername(true);
    }
    
    // 로그인 상태 확인
    if (isLoggedIn()) {
      console.log('이미 로그인된 상태 - 대시보드로 이동');
      // 이미 로그인된 상태라면 대시보드로 이동
      navigate("/dashboard");
    } else {
      console.log('로그인되지 않은 상태 - 홈 페이지 유지');
    }
  }, [navigate]);

  // 로그인된 상태에서만 토큰 만료 체크 시작
  useEffect(() => {
    if (isLoggedIn()) {
      console.log('토큰 만료 체크 시작');
      startTokenExpiryCheck();
      
      // 컴포넌트 언마운트 시 토큰 만료 체크 중지
      return () => {
        console.log('토큰 만료 체크 중지');
        stopTokenExpiryCheck();
      };
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      // 백엔드 API 호출
      const data = await loginApi({
        admin_id: username,
        admin_pw: password
      });

      if (data.success) {
        console.log('✅ 로그인 성공:', data.user);
        
        // 아이디 저장 체크박스가 체크되어 있으면 쿠키에 아이디 저장
        if (saveUsername) {
          saveUsernameToCookie(username);
        } else {
          // 체크되지 않았으면 저장된 아이디 삭제
          removeUsernameFromCookie();
        }
        
        // JWT 토큰과 사용자 정보를 저장 (로그인 상태 유지 여부에 따라)
        saveToken(data.token, rememberMe);
        saveUser(data.user, rememberMe);
        
        setIsLoginOpen(false);
        setUsername("");
        setPassword("");
        
        navigate("/dashboard");
      } else {
        setLoginError(data.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error('❌ 로그인 처리 오류:', error);
      setLoginError("서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100vh', 
      overflow: 'hidden',
      fontFamily: 'Noto Sans, sans-serif'
    }}>
      {/* Main Slideshow Container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transition: 'all 0.7s ease-in-out',
          width: isLoginOpen 
            ? isMobile ? '0%' : '50%'
            : '100%',
          transform: 'translateX(0)'
        }}
      >
        {/* Background Slideshow */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {slideImages.map((image, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                transition: 'opacity 1s',
                opacity: index === currentSlide ? 1 : 0
              }}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)'
              }} />
            </div>
          ))}
        </div>

        {/* Content Layer */}
        <div style={{ position: 'relative', zIndex: 10, height: '100%', width: '100%' }}>
          {/* Top Left - Dorothy(SEE) + Logo */}
          <div style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F608bbcadd79e43b89c275f9fa0935f53%2F28f59979d59c40a58a983dc19762b1a7?format=webp&width=800"
              alt="Logo"
              style={{
                width: '4rem',
                height: '4rem',
                objectFit: 'contain'
              }}
            />
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 500,
              margin: 0
            }}>도로시(SEE)</h1>
          </div>

          {/* Top Right - Login Button */}
          <div style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem'
          }}>
            <button
              onClick={() => setIsLoginOpen(!isLoginOpen)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.75rem',
                padding: '0.875rem 1.5rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                fontFamily: 'Noto Sans KR, sans-serif',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                minWidth: '120px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* 로그인 아이콘 */}
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ flexShrink: 0 }}
              >
                <path 
                  d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <polyline 
                  points="10,17 15,12 10,7" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <line 
                  x1="15" 
                  y1="12" 
                  x2="3" 
                  y2="12" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              {isLoginOpen ? "닫기" : "로그인"}
            </button>
          </div>

          {/* Slide Navigation Buttons */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slideImages.length) % slideImages.length)}
            style={{
              position: 'absolute',
              left: '2rem',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              width: '3rem',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slideImages.length)}
            style={{
              position: 'absolute',
              right: '2rem',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              width: '3rem',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Feature Cards */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2rem',
            pointerEvents: 'none'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: isLoginOpen ? '1rem' : '1.5rem',
              maxWidth: isLoginOpen ? '800px' : '1200px',
              width: '100%',
              pointerEvents: 'auto',
              overflowX: 'auto'
            }}>
              {/* 도로CCTV 모니터링 */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '1rem',
                padding: isLoginOpen ? '1rem' : '1.5rem',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s',
                minWidth: isLoginOpen ? '150px' : '200px',
                flex: 1,
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              >
                <div style={{ marginBottom: isLoginOpen ? '0.75rem' : '1rem' }}>
                  <svg style={{ 
                    width: isLoginOpen ? '2.5rem' : '3rem', 
                    height: isLoginOpen ? '2.5rem' : '3rem', 
                    margin: '0 auto 0.5rem' 
                  }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: isLoginOpen ? '1rem' : '1.125rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0'
                }}>도로CCTV 모니터링</h3>
                <p style={{
                  fontSize: isLoginOpen ? '0.75rem' : '0.875rem',
                  opacity: 0.9,
                  margin: 0,
                  lineHeight: 1.4
                }}>실시간 도로 상황을 모니터링하고 관리합니다</p>
              </div>

              {/* 도로위험 알림 */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '1rem',
                padding: isLoginOpen ? '1rem' : '1.5rem',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s',
                minWidth: isLoginOpen ? '150px' : '200px',
                flex: 1,
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              >
                <div style={{ marginBottom: isLoginOpen ? '0.75rem' : '1rem' }}>
                  <svg style={{ 
                    width: isLoginOpen ? '2.5rem' : '3rem', 
                    height: isLoginOpen ? '2.5rem' : '3rem', 
                    margin: '0 auto 0.5rem' 
                  }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: isLoginOpen ? '1rem' : '1.125rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0'
                }}>도로위험 알림</h3>
                <p style={{
                  fontSize: isLoginOpen ? '0.75rem' : '0.875rem',
                  opacity: 0.9,
                  margin: 0,
                  lineHeight: 1.4
                }}>위험 상황을 즉시 감지하고 알림을 발송합니다</p>
              </div>

              {/* 보고서 자동 생성 */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '1rem',
                padding: isLoginOpen ? '1rem' : '1.5rem',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s',
                minWidth: isLoginOpen ? '150px' : '200px',
                flex: 1,
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              >
                <div style={{ marginBottom: isLoginOpen ? '0.75rem' : '1rem' }}>
                  <svg style={{ 
                    width: isLoginOpen ? '2.5rem' : '3rem', 
                    height: isLoginOpen ? '2.5rem' : '3rem', 
                    margin: '0 auto 0.5rem' 
                  }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: isLoginOpen ? '1rem' : '1.125rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0'
                }}>보고서 자동 생성</h3>
                <p style={{
                  fontSize: isLoginOpen ? '0.75rem' : '0.875rem',
                  opacity: 0.9,
                  margin: 0,
                  lineHeight: 1.4
                }}>수집된 데이터를 바탕으로 자동 보고서를 생성합니다</p>
              </div>

              {/* 민원 보고 확인 */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '1rem',
                padding: isLoginOpen ? '1rem' : '1.5rem',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s',
                minWidth: isLoginOpen ? '150px' : '200px',
                flex: 1,
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              >
                <div style={{ marginBottom: isLoginOpen ? '0.75rem' : '1rem' }}>
                  <svg style={{ 
                    width: isLoginOpen ? '2.5rem' : '3rem', 
                    height: isLoginOpen ? '2.5rem' : '3rem', 
                    margin: '0 auto 0.5rem' 
                  }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: isLoginOpen ? '1rem' : '1.125rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0'
                }}>민원 보고 확인</h3>
                <p style={{
                  fontSize: isLoginOpen ? '0.75rem' : '0.875rem',
                  opacity: 0.9,
                  margin: 0,
                  lineHeight: 1.4
                }}>시민 민원을 접수하고 처리 현황을 관리합니다</p>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5rem'
          }}>
            {slideImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  borderRadius: '50%',
                  transition: 'all 0.3s',
                  backgroundColor: index === currentSlide ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 로그인 패널 */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: isMobile ? '100%' : '50%',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        boxSizing: 'border-box',
        transform: isLoginOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.5s ease-in-out',
        zIndex: 1000,
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 닫기 버튼 */}
        <button
          onClick={() => setIsLoginOpen(false)}
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#2f354f',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(47, 53, 79, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ✕
        </button>

        {/* 로고 섹션 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          {/* 로고 원형 */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#2f354f',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 4px 20px rgba(47, 53, 79, 0.3)'
          }}>
            <span style={{
              color: 'white',
              fontSize: '2rem',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif'
            }}>S</span>
          </div>
          
          {/* 메인 타이틀 */}
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#2f354f',
            margin: '0 0 0.5rem 0',
            fontFamily: 'Noto Sans KR, sans-serif'
          }}>
            관리자 로그인
          </h1>
          
          {/* 서브타이틀 */}
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            margin: 0,
            fontFamily: 'Noto Sans KR, sans-serif'
          }}>
            시스템에 접속하여 도로 안전을 관리하세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} style={{
          width: '100%',
          maxWidth: '400px'
        }}>
          {/* 아이디 입력 필드 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem',
              fontFamily: 'Noto Sans KR, sans-serif'
            }}>
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2f354f';
                e.target.style.boxShadow = '0 0 0 3px rgba(47, 53, 79, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            
            {/* 아이디 저장 체크박스 */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#6b7280',
              cursor: 'pointer',
              fontFamily: 'Noto Sans KR, sans-serif',
              marginTop: '0.5rem'
            }}>
              <input
                type="checkbox"
                checked={saveUsername}
                onChange={(e) => setSaveUsername(e.target.checked)}
                style={{
                  marginRight: '0.5rem',
                  accentColor: '#2f354f',
                  transform: 'scale(0.9)'
                }}
              />
              아이디 저장
            </label>
          </div>

          {/* 비밀번호 입력 필드 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem',
              fontFamily: 'Noto Sans KR, sans-serif'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2f354f';
                e.target.style.boxShadow = '0 0 0 3px rgba(47, 53, 79, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* 옵션 섹션 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
              cursor: 'pointer',
              fontFamily: 'Noto Sans KR, sans-serif'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  marginRight: '0.5rem',
                  accentColor: '#2f354f'
                }}
              />
              로그인 상태 유지
            </label>
            {/* <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                color: '#2f354f',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
            >
              비밀번호를 잊어버리셨나요?
            </button> */}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              backgroundColor: '#2f354f',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Noto Sans KR, sans-serif',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(47, 53, 79, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2f354f';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          {/* 사용자 등록 링크 */}
          <div style={{
            marginTop: '1rem',
            textAlign: 'center'
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontFamily: 'Noto Sans KR, sans-serif'
            }}>
              계정이 없으신가요?{' '}
            </span>
            <button
              type="button"
              onClick={() => navigate("/register")}
              style={{
                background: 'none',
                border: 'none',
                color: '#2f354f',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem',
                fontFamily: 'Noto Sans KR, sans-serif',
                fontWeight: '500'
              }}
            >
              사용자 등록
            </button>
          </div>

          {/* 에러 메시지 */}
          {loginError && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              fontSize: '0.875rem',
              textAlign: 'center',
              fontFamily: 'Noto Sans KR, sans-serif'
            }}>
              {loginError}
            </div>
          )}
        </form>

        {/* 푸터 */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem',
          fontFamily: 'Noto Sans KR, sans-serif'
        }}>
          © 2025 도로시(SEE). 도로 안전 관리 시스템
        </div>

        {/* 도움말 아이콘 */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          width: '32px',
          height: '32px',
          backgroundColor: '#2f354f',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1f2937';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2f354f';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        >
          ?
        </div>
      </div>
    </div>
  );
}
