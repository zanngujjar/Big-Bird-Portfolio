"use client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogIn, LogOut, Settings, User, ChevronDown, FolderOpen } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

interface HeaderProps {
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
}

export default function Header({ showBackButton, backButtonText, backButtonHref }: HeaderProps) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    <header className="border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon-32x32.png" alt="Big Bird Portfolios Logo" className="h-8 w-8" />
            <span className="text-l font-bold">Big Bird Portfolios</span>
          </Link>

          <div className="flex items-center gap-4">
            {showBackButton && backButtonHref && (
              <Link href={backButtonHref} className="hidden sm:block">
                <Button variant="outline" className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                  {backButtonText || "Back"}
                </Button>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/my-portfolios">
                  <Button variant="ghost" className="text-white hover:bg-gray-800">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    My Portfolios
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-800">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{user.username}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
                    <DropdownMenuLabel className="text-white">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      className="text-red-400 hover:bg-red-900/20 hover:text-red-300 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
