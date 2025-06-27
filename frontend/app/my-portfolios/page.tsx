"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, Calendar, Plus, BarChart3 } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import { useAuth } from "@/lib/auth"
import { usePortfolios, type NewPortfolioPayload } from "@/lib/portfolios"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
};

export default function MyPortfoliosPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { portfolios, deletePortfolio, savePortfolio, isLoading: isPortfoliosLoading } = usePortfolios()
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router])

  useEffect(() => {
    const handlePendingPortfolio = async () => {
      if (user && !isAuthLoading) {
        const pendingDataJSON = sessionStorage.getItem('pendingPortfolio');
        sessionStorage.removeItem('pendingPortfolio');
        if (pendingDataJSON) {
          try {
            const pendingData = JSON.parse(pendingDataJSON);
            const portfolioToSave: NewPortfolioPayload = {
              name: `Saved Portfolio - ${new Date().toLocaleDateString()}`,
              description: "Saved after authentication.",
              allocations: pendingData.allocations,
              portfolioAmount: pendingData.portfolioAmount,
              lookbackPeriod: pendingData.lookbackPeriod,
              results: pendingData.results,
              simulationData: pendingData.simulationData
            };
            await savePortfolio(portfolioToSave);
          } catch (error) {
            console.error("Error auto-saving pending portfolio:", error);
          } 
        }
      }
    };
    handlePendingPortfolio();
  }, [user, isAuthLoading, savePortfolio]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) {
      return;
    }
    setDeletingId(id);
    try {
      await deletePortfolio(id);
    } catch (error) {
      console.error("Failed to delete portfolio", error);
    } finally {
      setDeletingId(null);
    }
  }

  if (isAuthLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Authenticating...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Portfolios</h1>
          <Link href="/#analysis">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {isPortfoliosLoading ? (
            <div className="text-center py-20">Loading portfolios...</div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">
            <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Saved Portfolios</h2>
            <p className="text-gray-400 mb-6">You haven't saved any portfolio analyses yet.</p>
            <Link href="/#analysis">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Your First Portfolio
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id} className="bg-gray-900 border-gray-800 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-lg font-bold text-white">{portfolio.name}</span>
                    <Badge variant="outline" className="border-blue-400 text-blue-400">
                      {Object.keys(portfolio.allocations).length} Tickers
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-400 pt-1">{portfolio.description || "No description."}</p>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-gray-500 flex items-center mb-4">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      Saved: {formatDate(portfolio.createdAt)}
                    </div>
                    {/* --- THIS IS THE FIX: Using camelCase variables consistently --- */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Initial Amount:</span>
                        <span className="font-semibold">{formatCurrency(portfolio.portfolioAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Lookback:</span>
                        <span className="font-semibold">{portfolio.lookbackPeriod} Years</span>
                      </div>
                      <div className="border-t border-gray-700 my-2"></div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-gray-300">5-Yr Exp. Return:</span>
                        <span className={`${portfolio.results.expectedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {portfolio.results.expectedReturn >= 0 ? "+" : ""}{(portfolio.results.expectedReturn * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(portfolio.id)} disabled={deletingId === portfolio.id}>
                      {deletingId === portfolio.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
