"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, RotateCcw } from "lucide-react"
import Link from "next/link"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Header from "@/components/header"
import SavePortfolioDialog from "@/components/save-portfolio-dialog"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { API_BASE_URL } from "@/lib/config"

const formatCurrency = (value: number) => {
  if (!isFinite(value)) return "$0";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// This function generates plausible-looking chart data based on the final summary stats.
const generateChartDataFromSummary = (summary: any, initialAmount: number) => {
  const data = [];
  const timeSteps = 252 * 5; // 5 years

  for (let day = 0; day <= timeSteps; day++) {
    const timeRatio = day / timeSteps;

    const p50_final = summary.expectedValue;
    const p5_final = summary.worstCase;
    const p95_final = summary.bestCase;

    // Simple linear interpolation from start to end for visualization
    data.push({
      day,
      percentile_5: initialAmount + (p5_final - initialAmount) * timeRatio,
      percentile_50: initialAmount + (p50_final - initialAmount) * timeRatio,
      percentile_95: initialAmount + (p95_final - initialAmount) * timeRatio
    });
  }
  return data;
};

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isLoading: isAuthLoading } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [initialAmount, setInitialAmount] = useState<number | null>(null);
  const [portfolioConfig, setPortfolioConfig] = useState<any>(null);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return; // Wait for authentication to resolve

    const portfolioId = searchParams.get('id');

    const fetchPortfolioData = async (id: string) => {
      setIsLoading(true);

      if (!token) {
        toast.error("Authentication Error", { description: "You must be logged in to view a saved portfolio." });
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error("Authentication failed", { description: "Your session may have expired. Please log in again." });
            router.push('/login');
          } else {
            throw new Error('Failed to fetch portfolio data.');
          }
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          const portfolio = result.data;

          const summary = {
            expectedValue: portfolio.expected_value,
            worstCase: portfolio.worst_case,
            bestCase: portfolio.best_case,
            expectedReturn: portfolio.expected_return,
          };

          const riskMetrics = {
            probOfPositiveReturn: portfolio.prob_of_positive_return,
            probOfReturnGreaterThan10: portfolio.prob_of_return_greater_than_10,
            probOfReturnGreaterThan20: portfolio.prob_of_return_greater_than_20,
            probOfLossGreaterThan10: portfolio.prob_of_loss_greater_than_10,
            probOfLossGreaterThan20: portfolio.prob_of_loss_greater_than_20,
          };

          const config = {
            allocations: portfolio.allocations,
            portfolioAmount: portfolio.portfolio_amount,
            lookbackPeriod: portfolio.lookback_period,
          };

          setSummary(summary);
          setRiskMetrics(riskMetrics);
          setInitialAmount(portfolio.portfolio_amount);
          setPortfolioConfig(config);
          setChartData(generateChartDataFromSummary(summary, portfolio.portfolio_amount));
        } else {
          throw new Error(result.error || "Could not parse portfolio data.");
        }
      } catch (err: any) {
        setError(err.message);
        toast.error("Error loading portfolio", { description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromSessionStorage = () => {
      const finalValuesRaw = sessionStorage.getItem('simulationFinalValues');
      const initialAmountRaw = sessionStorage.getItem('simulationInitialAmount');
      const portfolioConfigRaw = localStorage.getItem('portfolioConfig');

      if (finalValuesRaw && initialAmountRaw) {
        const finalValues: number[] = JSON.parse(finalValuesRaw);
        const initial = Number(initialAmountRaw);
        setInitialAmount(initial);

        setSimulationData({
          finalValues,
          initialAmount: initial,
        });

        if (portfolioConfigRaw) {
          setPortfolioConfig(JSON.parse(portfolioConfigRaw));
        }

        finalValues.sort((a, b) => a - b);
        const n = finalValues.length;

        if (n === 0) {
          setError("No simulation data found.");
          setTimeout(() => router.push('/create'), 2000);
          return;
        }

        const calculatedSummary = {
          expectedValue: finalValues[Math.floor(n * 0.50)],
          worstCase: finalValues[Math.floor(n * 0.05)],
          bestCase: finalValues[Math.floor(n * 0.95)],
          expectedReturn: ((finalValues[Math.floor(n * 0.50)] / initial) - 1) * 100,
        };

        const calculatedRisk = {
          probOfPositiveReturn: finalValues.filter(v => v > initial).length / n * 100,
          probOfReturnGreaterThan10: finalValues.filter(v => v > initial * 1.1).length / n * 100,
          probOfReturnGreaterThan20: finalValues.filter(v => v > initial * 1.2).length / n * 100,
          probOfLossGreaterThan10: finalValues.filter(v => v < initial * 0.9).length / n * 100,
          probOfLossGreaterThan20: finalValues.filter(v => v < initial * 0.8).length / n * 100,
        };

        setSummary(calculatedSummary);
        setRiskMetrics(calculatedRisk);
        setChartData(generateChartDataFromSummary(calculatedSummary, initial));
        setIsLoading(false);
      } else {
        setError("No simulation data found in session. Redirecting...");
        setTimeout(() => router.push('/create'), 2000);
      }
    };

    if (portfolioId) {
      fetchPortfolioData(portfolioId);
    } else {
      loadFromSessionStorage();
    }
  }, [router, searchParams, token, isAuthLoading]);

  const chartConfig = {
    percentile_5: { label: " 5th Percentile", color: "hsl(var(--chart-1))" },
    percentile_50: { label: " 50th Percentile (Median)", color: "hsl(var(--chart-2))" },
    percentile_95: { label: " 95th Percentile", color: "hsl(var(--chart-3))" },
  };

  const handleRunAgain = () => {
    if (!portfolioConfig) {
      toast.error("Portfolio configuration not loaded.");
      return;
    }

    console.log("Attempting to run again with config:", portfolioConfig);

    try {
      const params = new URLSearchParams();
      params.set('portfolioAmount', portfolioConfig.portfolioAmount.toString());
      params.set('lookbackPeriod', portfolioConfig.lookbackPeriod.toString());

      if (!portfolioConfig.allocations || typeof portfolioConfig.allocations !== 'object') {
        console.error("Allocations are missing or not an object:", portfolioConfig.allocations);
        toast.error("Cannot re-run portfolio: allocation data is invalid.");
        return;
      }

      const allocations = Object.entries(portfolioConfig.allocations)
        .map(([ticker, percentage]) => `${ticker}:${percentage}`)
        .join(',');

      params.set('allocations', allocations);

      const url = `/create?${params.toString()}`;
      console.log("Navigating to:", url);
      router.push(url);

    } catch (error) {
      console.error("Failed to process portfolio for 'Run Again':", error);
      toast.error("An error occurred while preparing to re-run the simulation.");
    }
  };

  const handlePortfolioSaved = (portfolioId: string) => {
    toast.success("Portfolio Successfully Saved!", {
      description: "You can now view it on your dashboard.",
      duration: 5000,
      action: {
        label: "View",
        onClick: () => router.push('/my-portfolios'),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading portfolio results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!summary || !riskMetrics || !initialAmount) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading results or redirecting...</p>
      </div>
    );
  }

  const isNewSimulation = !searchParams.get('id');

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        showBackButton={true}
        backButtonText="New Portfolio"
        backButtonHref="/create"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-4">Portfolio Analysis Results</h1>
                <p className="text-gray-300 text-lg">Complete analysis of 1,000 Monte Carlo simulations over 5 years</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {isNewSimulation && portfolioConfig && summary && riskMetrics && simulationData && (
                  <SavePortfolioDialog
                    portfolioData={{
                      name: `New Portfolio - ${new Date().toLocaleDateString()}`,
                      allocations: portfolioConfig.allocations,
                      portfolioAmount: portfolioConfig.portfolioAmount,
                      lookbackPeriod: portfolioConfig.lookbackPeriod,
                      results: {
                        expectedValue: summary.expectedValue,
                        worstCase: summary.worstCase,
                        bestCase: summary.bestCase,
                        expectedReturn: summary.expectedReturn,
                        probOfPositiveReturn: riskMetrics.probOfPositiveReturn,
                        probOfReturnGreaterThan10: riskMetrics.probOfReturnGreaterThan10,
                        probOfReturnGreaterThan20: riskMetrics.probOfReturnGreaterThan20,
                        probOfLossGreaterThan10: riskMetrics.probOfLossGreaterThan10,
                        probOfLossGreaterThan20: riskMetrics.probOfLossGreaterThan20,
                      },
                      simulationData,
                    }}
                    onSaved={handlePortfolioSaved}
                  />
                )}
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto"
                  onClick={handleRunAgain}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Run Again
                </Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-6 text-center"><div className="text-3xl font-bold text-green-400 mb-2">{formatCurrency(summary.expectedValue)}</div><p className="text-gray-300 font-semibold">Expected Value (5 Years)</p><p className="text-sm text-gray-400">50th Percentile</p></CardContent></Card>
            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-6 text-center"><div className={`text-3xl font-bold ${summary.worstCase < initialAmount ? 'text-red-400' : 'text-yellow-400'} mb-2`}>{formatCurrency(summary.worstCase)}</div><p className="text-gray-300 font-semibold">Worst Case (5%)</p><p className="text-sm text-gray-400">5th Percentile</p></CardContent></Card>
            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-6 text-center"><div className="text-3xl font-bold text-blue-400 mb-2">{formatCurrency(summary.bestCase)}</div><p className="text-gray-300 font-semibold">Best Case (5%)</p><p className="text-sm text-gray-400">95th Percentile</p></CardContent></Card>
          </div>

          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardHeader>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                 <div><CardTitle className="text-white">Portfolio Value Projections</CardTitle><p className="text-gray-400">Range of potential outcomes over 5 years</p></div>
                 <Button variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto" onClick={() => window.print()}><Download className="h-4 w-4 mr-2" />Export Data</Button>
               </div>
            </CardHeader>
                         <CardContent className="px-1 sm:px-6">
               <div className="chart-container">
                 <ChartContainer config={chartConfig} className="h-[250px] md:h-[400px] lg:h-[500px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }} className="mobile-chart">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} tickFormatter={(value) => `${(value / 252).toFixed(0)}Y`} interval={251} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} domain={['dataMin', 'dataMax']} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} labelFormatter={(value) => `Best & Worst Case`} formatter={(value: number, name: keyof typeof chartConfig) => [formatCurrency(value), chartConfig[name]?.label]} />
                    <Area type="monotone" dataKey="percentile_95" stroke="var(--color-percentile_95)" fill="var(--color-percentile_95)" fillOpacity={0.1} strokeWidth={1.5} name="percentile_95" />
                    <Area type="monotone" dataKey="percentile_5" stroke="var(--color-percentile_5)" fill="#111827" fillOpacity={1} strokeWidth={1.5} name="percentile_5" />
                                         <Line type="monotone" dataKey="percentile_50" stroke="var(--color-percentile_50)" strokeWidth={3} dot={false} name="percentile_50" />
                   </AreaChart>
                 </ResponsiveContainer>
               </ChartContainer>
               </div>
             </CardContent>
          </Card>

          {/* FIX: This section now calculates its stats from the same data as the top cards */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-white">Risk Analysis</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
                  <div className="space-y-3"><div className="flex justify-between items-center p-3 bg-gray-800 rounded"><span className="text-gray-300">Expected 5-Year Return:</span><span className={`font-semibold ${summary.expectedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>{summary.expectedReturn >= 0 ? '+' : ''}{summary.expectedReturn.toFixed(1)}%</span></div></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Probability Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded"><span className="text-gray-300">Prob. of Positive Return:</span><span className="text-green-400 font-semibold">{riskMetrics.probOfPositiveReturn.toFixed(1)}%</span></div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded"><span className="text-gray-300">Prob. of 10% Return:</span><span className="text-green-400 font-semibold">{riskMetrics.probOfReturnGreaterThan10.toFixed(1)}%</span></div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded"><span className="text-gray-300">Prob. of 20% Return:</span><span className="text-green-400 font-semibold">{riskMetrics.probOfReturnGreaterThan20.toFixed(1)}%</span></div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded"><span className="text-gray-300">Prob. of Loss 10%:</span><span className="text-red-400 font-semibold">{riskMetrics.probOfLossGreaterThan10.toFixed(1)}%</span></div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded"><span className="text-gray-300">Prob. of Loss 20%:</span><span className="text-red-400 font-semibold">{riskMetrics.probOfLossGreaterThan20.toFixed(1)}%</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function FinalResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
