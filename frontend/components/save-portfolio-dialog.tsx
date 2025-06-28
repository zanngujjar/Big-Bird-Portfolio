"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { usePortfolios, type NewPortfolioPayload } from "@/lib/portfolios"

interface SavePortfolioDialogProps {
  portfolioData: NewPortfolioPayload; // Use the payload type
  onSaved?: (portfolioId: string) => void;
}

export default function SavePortfolioDialog({ portfolioData, onSaved }: SavePortfolioDialogProps) {
  const { user } = useAuth()
  const { savePortfolio } = usePortfolios()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a portfolio name");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const portfolioId = await savePortfolio({
        ...portfolioData, // Spread the existing data
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setOpen(false);
      setName("");
      setDescription("");
      onSaved?.(portfolioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save portfolio");
    } finally {
      setIsSaving(false);
    }
  }

  const handleAuthRedirect = (path: '/login' | '/signup') => {
    sessionStorage.setItem('pendingPortfolio', JSON.stringify(portfolioData));
    router.push(`${path}?action=save_portfolio`);
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Portfolio
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Sign In to Save</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create an account or sign in to save your results.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <LogIn className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <div className="flex gap-3 justify-center">
              <Button onClick={() => handleAuthRedirect('/login')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign In & Save
              </Button>
              <Button onClick={() => handleAuthRedirect('/signup')} variant="outline" className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                Create Account & Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Portfolio
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Save Portfolio Analysis</DialogTitle>
          <DialogDescription className="text-gray-400">
            Give your portfolio a name to save it to your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Portfolio Name *</Label>
            <Input id="name" placeholder="e.g., Tech Growth Portfolio" value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-800 border-gray-600 text-white" disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description (Optional)</Label>
            <Textarea id="description" placeholder="Strategy, goals, etc." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-gray-800 border-gray-600 text-white resize-none" rows={3} disabled={isSaving} />
          </div>
          {error && (<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>)}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? "Saving..." : "Save Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
