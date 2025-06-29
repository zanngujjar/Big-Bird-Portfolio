"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Target, Zap, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Header from "@/components/header"

export default function WelcomePage() {
  const [showMathDetails, setShowMathDetails] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Welcome to Big Bird Portfolios
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
            Optimize your investment portfolio using advanced Monte Carlo simulation techniques
          </p>
          <Link href="/create">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
              Create Your Portfolio
            </Button>
          </Link>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <Target className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">Portfolio Optimization</h3>
                <p className="text-gray-300">
                  We analyze your investment portfolio and suggest optimal allocations to maximize returns while
                  minimizing risk using sophisticated mathematical models.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <BarChart3 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">Historical Analysis</h3>
                <p className="text-gray-300">
                  Run 5-year historical lookbacks on US traded equities to understand how your portfolio would have
                  performed under different market conditions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Monte Carlo Explanation */}
      <section className="container mx-auto px-4 py-16 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Zap className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">What is Monte Carlo Simulation?</h2>
          </div>

          <div className="space-y-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-4 text-white">The Power of Probability</h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  Monte Carlo simulation is a computational technique that uses random sampling to model complex systems
                  and predict outcomes. Named after the famous Monte Carlo casino, this method runs thousands of
                  scenarios to understand the range of possible results.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  In portfolio management, we use it to simulate how your investments might perform under various market
                  conditions, giving you a comprehensive view of potential risks and returns.
                </p>
              </CardContent>
            </Card>

            {/* Mathematical Details Dropdown */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8">
                <button
                  onClick={() => setShowMathDetails(!showMathDetails)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-2xl font-semibold text-white">Want to know more?</h3>
                  {showMathDetails ? (
                    <ChevronUp className="h-6 w-6 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-blue-400" />
                  )}
                </button>

                {showMathDetails && (
                  <div className="mt-6 space-y-6 border-t border-gray-700 pt-6">
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-4">Geometric Brownian Motion (GBM)</h4>
                      <p className="text-gray-300 text-lg leading-relaxed mb-4">
                        Our Monte Carlo simulation uses Geometric Brownian Motion to model stock price movements. This
                        mathematical model captures both the trend (drift) and randomness (volatility) of financial
                        markets.
                      </p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h5 className="text-lg font-semibold text-white mb-3">The GBM Formula</h5>
                      <p className="text-gray-300 mb-4">The stock price at the next time step is calculated using:</p>
                      <div className="bg-black p-6 rounded text-center border border-gray-600">
                        <div className="text-white text-2xl font-serif leading-relaxed">
                          <span className="italic">S</span>(<span className="italic">t</span> + Δ
                          <span className="italic">t</span>) =<span className="italic ml-2">S</span>(
                          <span className="italic">t</span>) ·<span className="italic ml-2">e</span>
                          <sup className="text-lg">
                            (<span className="italic">μ</span> − <sup>1</sup>⁄<sub>2</sub>
                            <span className="italic">σ</span>
                            <sup>2</sup>)Δ<span className="italic">t</span> + <span className="italic">σ</span>√(Δ
                            <span className="italic">t</span>) · <span className="italic">Z</span>
                          </sup>
                        </div>
                      </div>
                      <div className="mt-4 text-gray-300 space-y-2">
                        <p>
                          <strong className="text-white">Where:</strong>
                        </p>
                        <ul className="list-none space-y-2 ml-4">
                          <li>
                            <strong className="text-blue-300 font-serif italic">S(t)</strong> = Current stock price
                          </li>
                          <li>
                            <strong className="text-blue-300 font-serif italic">μ</strong> (mu) = Expected annual return
                            (drift)
                          </li>
                          <li>
                            <strong className="text-blue-300 font-serif italic">σ</strong> (sigma) = Annual volatility
                            (standard deviation)
                          </li>
                          <li>
                            <strong className="text-blue-300 font-serif">Δt</strong> = Time step (1/252 for daily steps)
                          </li>
                          <li>
                            <strong className="text-blue-300 font-serif italic">Z</strong> = Random number from standard
                            normal distribution
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h5 className="text-lg font-semibold text-white mb-3">Parameter Estimation</h5>
                      <p className="text-gray-300 mb-4">
                        We calculate the drift (μ) and volatility (σ) from historical data using:
                      </p>
                      <div className="space-y-6">
                        <div>
                          <p className="text-gray-300 mb-3">
                            <strong className="text-white">Daily Log Returns:</strong>
                          </p>
                          <div className="bg-black p-4 rounded text-center border border-gray-600">
                            <div className="text-white text-xl font-serif">
                              <span className="italic">r</span>
                              <sub className="text-sm">i</sub> = ln
                              <span className="text-lg">
                                (
                                <div className="inline-block mx-1">
                                  <div className="text-center border-b border-white pb-1">
                                    <span className="italic">S</span>
                                    <sub className="text-sm">i</sub>
                                  </div>
                                  <div className="text-center pt-1">
                                    <span className="italic">S</span>
                                    <sub className="text-sm">i−1</sub>
                                  </div>
                                </div>
                                )
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-3">
                            <strong className="text-white">Annualized Drift:</strong>
                          </p>
                          <div className="bg-black p-4 rounded text-center border border-gray-600">
                            <div className="text-white text-xl font-serif">
                              <span className="italic">μ</span> = <span className="italic">r̄</span> × 252
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-3">
                            <strong className="text-white">Annualized Volatility:</strong>
                          </p>
                          <div className="bg-black p-4 rounded text-center border border-gray-600">
                            <div className="text-white text-xl font-serif">
                              <span className="italic">σ</span> = <span className="italic">σ</span>
                              <sub className="text-sm">daily</sub> × √252
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h5 className="text-lg font-semibold text-white mb-3">Random Number Generation</h5>
                      <p className="text-gray-300 mb-4">
                        We use the Box-Muller transform to generate standard normal random numbers:
                      </p>
                      <div className="bg-black p-4 rounded text-center border border-gray-600">
                        <div className="text-white text-xl font-serif">
                          <span className="italic">Z</span> = √(−2 ln(<span className="italic">U</span>
                          <sub className="text-sm">1</sub>)) cos(2π<span className="italic">U</span>
                          <sub className="text-sm">2</sub>)
                        </div>
                      </div>
                      <p className="text-gray-300 mt-3 text-sm">
                        Where <span className="italic font-serif">U</span>
                        <sub>1</sub> and <span className="italic font-serif">U</span>
                        <sub>2</sub> are independent uniform random variables between 0 and 1.
                      </p>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
                      <h5 className="text-lg font-semibold text-blue-300 mb-3">Why This Works</h5>
                      <p className="text-gray-300 leading-relaxed">
                        This mathematical model captures the essential characteristics of stock prices: they tend to
                        grow over time (drift) but with random fluctuations (volatility). By running thousands of
                        simulations with different random outcomes, we can estimate the probability distribution of your
                        portfolio's future value.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">1,000</div>
                  <p className="text-gray-300">Simulations per analysis</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">5 Years</div>
                  <p className="text-gray-300">Historical data analysis</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-500 mb-2">Real-time</div>
                  <p className="text-gray-300">Market data integration</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-4 text-white">How It Helps Your Portfolio</h3>
                <ul className="space-y-3 text-white text-lg">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Identifies optimal asset allocation percentages</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Estimates potential returns and worst-case scenarios</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Helps you understand and manage investment risk</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Provides data-driven insights for better decision making</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Optimize Your Portfolio?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Start your journey to smarter investing with data-driven portfolio optimization.
          </p>
          <Link href="/create">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
              Create Your First Portfolio
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 Big Bird Portfolios. Empowering smarter investment decisions.</p>
        </div>
      </footer>
    </div>
  )
}
