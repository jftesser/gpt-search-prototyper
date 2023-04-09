import { ReactNode, useEffect, useState } from "react";
import { AuthContext, AuthContextType } from "./AuthContext";
import { auth } from "../firebase/firebaseSetup";


export const AuthProvider: React.FC<{children : ReactNode } > = ( { children }) => {
  const [user, setUser] = useState<AuthContextType>({ loading: true, user: null });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser({user: firebaseUser, loading: false});
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};