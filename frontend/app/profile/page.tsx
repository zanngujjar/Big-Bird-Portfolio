"use client"

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />

            <div className="flex items-center justify-center w-full px-4 py-12 min-h-[70vh]">
                <Card className="bg-gray-900 border-gray-800 max-w-sm w-full text-center">
                    <CardHeader className="flex flex-col items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                            <AvatarFallback className="bg-blue-600 text-white text-2xl">
                                {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-white text-2xl mb-1">{user.username}</CardTitle>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
} 