"use client"

import React, { useState, useEffect, createContext, useContext, type ReactNode } from "react"

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setAuthenticatedSession: (user: User, token: string) => void;
  isLoading: boolean
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("accessToken")
      if (storedToken) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem("accessToken");
          }
        } catch (error) {
          console.error("Failed to verify token", error);
          localStorage.removeItem("accessToken");
        }
      }
      setIsLoading(false)
    }
    initializeAuth();
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      setAuthenticatedSession(data.user, data.access_token);
      return true;
    } catch (error) {
      console.error("Login API call failed:", error);
      return false;
    } finally {
      setIsLoading(false)
    }
  }

  const setAuthenticatedSession = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("accessToken", token);
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("accessToken")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, setAuthenticatedSession, isLoading, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
