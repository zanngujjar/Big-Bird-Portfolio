"use client"

import type React from "react"
// ----- MODIFICATION: Import Suspense -----
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

// ----- MODIFICATION: Renamed the original component to LoginForm -----
// This component contains all the logic and uses the dynamic hook.
function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const success = await login(email, password);

      if (success) {
        const action = searchParams.get('action');
        // If the user was trying to save, redirect them to their dashboard
        // where the pending action will be handled. Otherwise, go to home.
        if (action === 'save_portfolio') {
          router.push("/my-portfolios");
        } else {
          router.push("/");
        }
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      console.error("Login process failed:", err);
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <LogIn className="h-6 w-6 text-blue-400" />
              Sign In
            </CardTitle>
            <p className="text-gray-400">Welcome back to Big Bird Portfolios</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-800 border-gray-600 text-white placeholder-gray-400" disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10" disabled={isSubmitting} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isSubmitting}>
                    {showPassword ? (<EyeOff className="h-4 w-4 text-gray-400" />) : (<Eye className="h-4 w-4 text-gray-400" />)}
                  </Button>
                </div>
              </div>
              {error && (<Alert className="bg-red-900/20 border-red-500/50"><AlertDescription className="text-red-400">{error}</AlertDescription></Alert>)}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? (<div className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Signing In...</div>) : ("Sign In")}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ----- MODIFICATION: Created a new default export component -----
// This is the actual page component. It wraps the dynamic form in <Suspense>.
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/favicon-32x32.png" alt="Big Bird Portfolios Logo" className="h-8 w-8" />
              <span className="text-xl font-bold">Big Bird Portfolios</span>
            </Link>
            <Link href="/">
              <Button variant="outline" className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}