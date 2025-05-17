import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext<{ jwt: string; setJwt: (token: string) => void }>({
  jwt: '',
  setJwt: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [jwt, setJwt] = useState('');
  return (
    <AuthContext.Provider value={{ jwt, setJwt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);