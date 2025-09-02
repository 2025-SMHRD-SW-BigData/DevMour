import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../utils/api";

export default function Register() {
  const [formData, setFormData] = useState({
    admin_id: "",
    admin_pw: "",
    admin_name: "",
    admin_phone: "",
    dept_name: "",
    dept_addr: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await registerApi(formData);
      
      if (result.success) {
        setSuccess("사용자 등록이 완료되었습니다!");
        setFormData({
          admin_id: "",
          admin_pw: "",
          admin_name: "",
          admin_phone: "",
          dept_name: "",
          dept_addr: ""
        });
        
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      setError(error.message || "사용자 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Noto Sans KR, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#2f354f',
            margin: '0 0 0.5rem 0'
          }}>
            사용자 등록
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            margin: 0
          }}>
            새로운 관리자 계정을 생성합니다
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem'
            }}>
              아이디 *
            </label>
            <input
              type="text"
              name="admin_id"
              value={formData.admin_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem'
            }}>
              비밀번호 *
            </label>
            <input
              type="password"
              name="admin_pw"
              value={formData.admin_pw}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem'
            }}>
              이름 *
            </label>
            <input
              type="text"
              name="admin_name"
              value={formData.admin_name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
              placeholder="이름을 입력하세요"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem'
            }}>
              연락처 *
            </label>
            <input
              type="tel"
              name="admin_phone"
              value={formData.admin_phone}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
              placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem'
            }}>
              부서명 *
            </label>
            <input
              type="text"
              name="dept_name"
              value={formData.dept_name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
              placeholder="부서명을 입력하세요"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2f354f',
              marginBottom: '0.5rem'
            }}>
              부서 주소 *
            </label>
            <input
              type="text"
              name="dept_addr"
              value={formData.dept_addr}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: '#2f354f',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
              placeholder="부서 주소를 입력하세요"
            />
          </div>

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
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '등록 중...' : '사용자 등록'}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#dc2626',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem',
            color: '#16a34a',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: 'none',
              border: 'none',
              color: '#2f354f',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.875rem'
            }}
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
