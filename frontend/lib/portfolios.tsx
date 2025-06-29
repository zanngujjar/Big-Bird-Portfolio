"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { useAuth } from "./auth"
import { API_BASE_URL } from "./config";

// This interface consistently uses camelCase for use throughout the frontend.
export interface SavedPortfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  allocations: Record<string, number>;
  portfolioAmount: number;
  lookbackPeriod: number;
  results: {
    expectedValue: number;
    worstCase: number;
    bestCase: number;
    expectedReturn: number;
    probOfPositiveReturn: number;
    probOfReturnGreaterThan10: number;
    probOfReturnGreaterThan20: number;
    probOfLossGreaterThan10: number;
    probOfLossGreaterThan20: number;
  };
  createdAt: string;
  simulationData?: any;
}

// This type defines the object that components will pass to the savePortfolio function.
export type NewPortfolioPayload = Omit<SavedPortfolio, "id" | "userId" | "createdAt">;

interface PortfolioContextType {
  portfolios: SavedPortfolio[];
  savePortfolio: (portfolio: NewPortfolioPayload) => Promise<string>;
  deletePortfolio: (id: string) => Promise<void>;
  getPortfolio: (id: string) => SavedPortfolio | null;
  isLoading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  // This function maps snake_case API data to our camelCase frontend interface.
  const formatPortfolioData = (p: any): SavedPortfolio => ({
    id: p.id,
    userId: p.user_id,
    name: p.name,
    description: p.description,
    allocations: p.allocations,
    portfolioAmount: p.portfolio_amount,
    lookbackPeriod: p.lookback_period,
    createdAt: p.created_at,
    simulationData: p.simulation_data,
    results: {
      expectedValue: p.expected_value,
      worstCase: p.worst_case,
      bestCase: p.best_case,
      expectedReturn: p.expected_return,
      probOfPositiveReturn: p.prob_of_positive_return,
      probOfReturnGreaterThan10: p.prob_of_return_greater_than_10,
      probOfReturnGreaterThan20: p.prob_of_return_greater_than_20,
      probOfLossGreaterThan10: p.prob_of_loss_greater_than_10,
      probOfLossGreaterThan20: p.prob_of_loss_greater_than_20,
    },
  });

  useEffect(() => {
    const loadUserPortfolios = async () => {
      if (user && token) {
        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            const formattedPortfolios = data.data.map(formatPortfolioData);
            setPortfolios(formattedPortfolios || []);
          } else {
            setPortfolios([]);
          }
        } catch (error) {
          console.error("Error loading portfolios:", error);
          setPortfolios([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setPortfolios([]);
        setIsLoading(false);
      }
    };
    loadUserPortfolios();
  }, [user, token]);

  const savePortfolio = async (portfolio: NewPortfolioPayload): Promise<string> => {
    if (!token) {
      throw new Error("Authentication token is missing.");
    }

    // The payload sent to the backend uses camelCase, as the Flask API endpoint expects.
    try {
      const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(portfolio)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save portfolio to the server.");
      }

      // After a successful save, refetch the data to get the updated list.
      if (user && token) {
        const listResponse = await fetch(`${API_BASE_URL}/api/portfolios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listResponse.json();
        if (listData.success) {
          setPortfolios(listData.data.map(formatPortfolioData) || []);
        }
      }

      return data.portfolio_id;
    } catch (error) {
      console.error("Error saving portfolio:", error);
      throw error;
    }
  };

  const deletePortfolio = async (id: string): Promise<void> => {
    if (!token) throw new Error("Not authenticated.");
    try {
      const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete portfolio.");
      }
      // On success, remove the portfolio from the local state for an instant UI update.
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      throw error;
    }
  };
  const getPortfolio = (id: string): SavedPortfolio | null => {
    return portfolios.find((p) => p.id === id) || null;
  };

  return (
    <PortfolioContext.Provider value={{ portfolios, savePortfolio, deletePortfolio, getPortfolio, isLoading }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolios() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolios must be used within a PortfolioProvider");
  }
  return context;
}
