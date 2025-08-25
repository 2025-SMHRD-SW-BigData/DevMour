import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 로그인 시도:', username);
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: username,
          admin_pw: password
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 로그인 성공:', data.user);
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      } else {
        console.log('❌ 로그인 실패:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 로그아웃');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // 페이지 새로고침 시 로그인 상태 복원
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('🔄 로그인 상태 복원:', userData);
      } catch (error) {
        console.error('❌ 저장된 사용자 데이터 파싱 실패:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
