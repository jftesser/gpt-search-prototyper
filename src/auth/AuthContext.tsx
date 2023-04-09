import React from "react";
import { User } from "firebase/auth";

export type AuthContextType = {
    loading: boolean,
    user: User | null
}

export const AuthContext = React.createContext<AuthContextType>({ loading: true, user: null });