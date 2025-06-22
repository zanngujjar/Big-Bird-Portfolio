"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { TrendingUp, Search, ChevronLeft, ChevronRight, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"

// API base URL
const API_BASE_URL = "http://localhost:5000"

// Ticker interface
interface Ticker {
  ticker_id: number
  ticker_symbol: string
}

const ITEMS_PER_PAGE = 10

export default function CreatePortfolio() {
  const [searchTerm, setSearchTerm] = useState("")
  const [portfolioAllocations, setPortfolioAllocations] = useState<Record<string, number>>({})
  const [portfolioAmount, setPortfolioAmount] = useState<number>(100000) // Default $100,000
  const [lookbackPeriod, setLookbackPeriod] = useState("60")
  const [currentPage, setCurrentPage] = useState(1)
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tickers from API
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/tickers`)
        const data = await response.json()
        
        if (data.success) {
          setTickers(data.data)
        } else {
          setError(data.error || 'Failed to fetch tickers')
        }
      } catch (err) {
        setError('Failed to connect to API server')
        console.error('Error fetching tickers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTickers()
  }, [])

  // Filter tickers based on search term
  const filteredTickers = tickers.filter(
    (ticker) =>
      ticker.ticker_symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentTickers = filteredTickers.slice(startIndex, endIndex)

  const handleAllocationChange = (symbol: string, percentage: string) => {
    const numPercentage = Number.parseFloat(percentage) || 0
    setPortfolioAllocations((prev) => {
      const newAllocations = { ...prev }
      if (numPercentage > 0) {
        newAllocations[symbol] = numPercentage
      } else {
        delete newAllocations[symbol]
      }
      return newAllocations
    })
  }

  const handlePortfolioAmountChange = (amount: string) => {
    const numAmount = Number.parseFloat(amount) || 0
    setPortfolioAmount(numAmount)
  }

  // Reset to first page when searching
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const selectedStocks = Object.entries(portfolioAllocations)
  const totalPercentage = selectedStocks.reduce((total, [, percentage]) => total + percentage, 0)

  // Calculate dollar amounts for each stock
  const stockAllocations = selectedStocks.map(([symbol, percentage]) => ({
    symbol,
    percentage,
    dollarAmount: (portfolioAmount * percentage) / 100,
  }))

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold">Big Bird Portfolios</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">Create Your Portfolio</h1>
            <p className="text-gray-300 text-lg">Select the stocks you want to include in your portfolio analysis</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by ticker symbol or company name..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Ticker List */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Available Stocks ({filteredTickers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-400">Loading tickers...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-4">{error}</p>
                      <Button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : currentTickers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No tickers found matching "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentTickers.map((ticker) => (
                        <div
                          key={ticker.ticker_symbol}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-20">
                              <Input
                                type="number"
                                placeholder="%"
                                min="0"
                                max="100"
                                step="0.1"
                                value={portfolioAllocations[ticker.ticker_symbol] || ""}
                                onChange={(e) => handleAllocationChange(ticker.ticker_symbol, e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                              />
                            </div>
                            <div>
                              <div>
                                <span className="font-semibold text-white">{ticker.ticker_symbol}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {!loading && !error && totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      <span className="text-sm text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Portfolio Amount */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    Portfolio Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="number"
                      placeholder="100000"
                      min="1000"
                      step="1000"
                      value={portfolioAmount || ""}
                      onChange={(e) => handlePortfolioAmountChange(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white text-lg font-semibold"
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Total amount to invest</p>
                </CardContent>
              </Card>

              {/* Selected Stocks */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Selected Stocks ({selectedStocks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedStocks.length === 0 ? (
                    <p className="text-gray-400 text-sm">No stocks selected yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stockAllocations.map(({ symbol, percentage, dollarAmount }) => (
                        <div key={symbol} className="p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{symbol}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAllocationChange(symbol, "0")}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">Percentage:</span>
                              <span className="text-green-400">{percentage}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">Amount:</span>
                              <span className="text-blue-400">${dollarAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">Total Allocation:</span>
                          <span
                            className={`font-bold ${totalPercentage === 100 ? "text-green-400" : totalPercentage > 100 ? "text-red-400" : "text-yellow-400"}`}
                          >
                            {totalPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">Total Amount:</span>
                          <span className="text-blue-400 font-bold">
                            ${((portfolioAmount * totalPercentage) / 100).toLocaleString()}
                          </span>
                        </div>
                        {totalPercentage !== 100 && (
                          <p className="text-xs text-gray-400 mt-2">
                            {totalPercentage > 100
                              ? "Total exceeds 100%"
                              : `${(100 - totalPercentage).toFixed(1)}% remaining to allocate`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lookback Period */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Lookback Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={lookbackPeriod} onValueChange={setLookbackPeriod}>
                    <div
                      className={`flex items-center space-x-2 p-2 rounded ${lookbackPeriod === "30" ? "bg-blue-600/20 border border-blue-500" : "hover:bg-gray-800"}`}
                    >
                      <RadioGroupItem
                        value="180"
                        id="180-days"
                        className="border-white text-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label
                        htmlFor="180-days"
                        className={`text-white cursor-pointer ${lookbackPeriod === "180" ? "font-semibold" : ""}`}
                      >
                        180 Days
                      </Label>
                    </div>
                    <div
                      className={`flex items-center space-x-2 p-2 rounded ${lookbackPeriod === "252" ? "bg-blue-600/20 border border-blue-500" : "hover:bg-gray-800"}`}
                    >
                      <RadioGroupItem
                        value="252"
                        id="252-days"
                        className="border-white text-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label
                        htmlFor="252-days"
                        className={`text-white cursor-pointer ${lookbackPeriod === "252" ? "font-semibold" : ""}`}
                      >
                        1 Year
                      </Label>
                    </div>
                    <div
                      className={`flex items-center space-x-2 p-2 rounded ${lookbackPeriod === "504" ? "bg-blue-600/20 border border-blue-500" : "hover:bg-gray-800"}`}
                    >
                      <RadioGroupItem
                        value="504"
                        id="504-days"
                        className="border-white text-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label
                        htmlFor="504-days"
                        className={`text-white cursor-pointer ${lookbackPeriod === "504" ? "font-semibold" : ""}`}
                      >
                        2 Years
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Start Simulation Button */}
              <Button
                size="lg"
                disabled={Object.keys(portfolioAllocations).length === 0 || totalPercentage !== 100}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  // Save portfolio configuration and navigate
                  const portfolioConfig = {
                    allocations: portfolioAllocations,
                    lookbackPeriod: Number(lookbackPeriod),
                    portfolioAmount: portfolioAmount
                  }
                  
                  // Save to localStorage as backup
                  localStorage.setItem('portfolioConfig', JSON.stringify(portfolioConfig))
                  
                  // Navigate with URL parameters
                  const params = new URLSearchParams({
                    allocations: JSON.stringify(portfolioAllocations),
                    lookback: lookbackPeriod,
                    amount: portfolioAmount.toString()
                  })
                  
                  window.location.href = `/simulation?${params.toString()}`
                }}
              >
                Start Simulation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
