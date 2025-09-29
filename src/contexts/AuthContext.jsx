import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar token ao inicializar
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          // Verificar se o token não está expirado
          const tokenParts = savedToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp > now) {
              // Token válido
              setUser(JSON.parse(savedUser));
              setToken(savedToken);
              console.log('✅ Token válido carregado do localStorage');
            } else {
              // Token expirado
              console.warn('⚠️ Token expirado encontrado no localStorage');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setToken(null);
            }
          } else {
            // Token malformado
            console.warn('⚠️ Token malformado encontrado no localStorage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          // Limpar dados inválidos
          console.error('❌ Erro ao verificar token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      } else {
        // Não há dados salvos, garantir estado limpo
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      console.log('🔍 AuthContext - Response completa:', response);
      console.log('🔍 AuthContext - Token:', response.token);
      console.log('🔍 AuthContext - User:', response.user);
      
      if (response.token && response.user) {
        // Verificar formato do token
        console.log('🔍 AuthContext - Token type:', typeof response.token);
        console.log('🔍 AuthContext - Token length:', response.token.length);
        console.log('🔍 AuthContext - Token starts with:', response.token.substring(0, 20) + '...');
        
        // Decodificar o token para debug (sem verificar assinatura)
        try {
          const tokenParts = response.token.split('.');
          console.log('🔍 AuthContext - Token parts count:', tokenParts.length);
          console.log('🔍 AuthContext - Token parts:', tokenParts.map((part, index) => `${index}: ${part.substring(0, 20)}...`));
          
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 AuthContext - Token payload:', payload);
        } catch (decodeError) {
          console.error('❌ AuthContext - Erro ao decodificar token:', decodeError);
          console.error('❌ AuthContext - Token problemático:', response.token);
        }

        setToken(response.token);
        setUser(response.user);
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('✅ AuthContext - Token e user salvos no localStorage');
        return response;
      } else {
        console.error('❌ AuthContext - Response não contém token ou user');
        throw new Error('Falha na autenticação');
      }
    } catch (error) {
      console.error('❌ AuthContext - Erro no login:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
