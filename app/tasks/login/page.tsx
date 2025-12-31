"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await signIn(email, password)

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
            setLoading(false)
        } else {
            router.push("/tasks")
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 dark:from-purple-900 dark:via-pink-900 dark:to-purple-950" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

            {/* Floating orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute top-40 right-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-md animate-scale-in">
                {/* Glassmorphic card */}
                <div className="glass dark:glass-dark rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg">
                            <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">TaskFlow</h1>
                        <p className="text-white/80 dark:text-white/60">Welcome back! Sign in to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white/90 dark:text-white/70">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="bg-white/20 dark:bg-black/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/50"
                            />
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white/90 dark:text-white/70">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="bg-white/20 dark:bg-black/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/50 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full gradient-primary text-white border-0 hover:opacity-90 transition-opacity h-11 text-base font-semibold shadow-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Sign In
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-white/70">Don't have an account? </span>
                        <Link
                            href="/tasks/signup"
                            className="text-white font-semibold hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>

                {/* Footer text */}
                <p className="mt-6 text-center text-sm text-white/60">
                    Organize your tasks with style ✨
                </p>
            </div>
        </div>
    )
}

