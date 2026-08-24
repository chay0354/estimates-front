import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/estimates.js';
import { getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.me().then((r) => setUser(r.user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const signIn = async (email, password) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
  };

  const signOut = () => { setToken(null); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}
