import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, BarChart3, Target, Zap } from "lucide-react"
import Link from "next/link"

export default function Component() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold">Big Bird Portfolios</span>
            </div>
          </div>
        </div>
      </header>

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
