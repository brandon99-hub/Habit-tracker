"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Grid, Calendar, User, CheckCircle2, ArrowLeft, Bell, Lock, Mail } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { InstallAppSection } from "@/components/tasks/install-app-section"
import { usePushSubscription } from "@/hooks/use-push-subscription"

export default function ProfilePage() {
    const router = useRouter()
    const { user, signOut } = useAuth()
    const { toast } = useToast()
    const { isSubscribed, subscribe, loading: subscribeLoading, error: subscribeError } = usePushSubscription()
    const [name, setName] = useState(user?.user_metadata?.name || "")
    const [email, setEmail] = useState(user?.email || "")
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleUpdateProfile = async () => {
        const { error } = await supabase.auth.updateUser({
            data: { name }
        })

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Profile updated successfully",
            })
        }
    }

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            })
            return
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Password changed successfully",
            })
            setIsChangingPassword(false)
            setNewPassword("")
            setConfirmPassword("")
        }
    }



    const handleToggleNotifications = async () => {
        // Request permission and subscribe
        if ("Notification" in window) {
            const permission = await Notification.requestPermission()
            if (permission === "granted") {
                // Now actually subscribe
                await subscribe()

                if (subscribeError) {
                    toast({
                        title: "Error",
                        description: subscribeError,
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Success",
                        description: "Push notifications enabled successfully!",
                    })
                }
            } else {
                toast({
                    title: "Permission Denied",
                    description: "Please allow notifications in your browser settings",
                    variant: "destructive",
                })
            }
        }
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="mx-auto max-w-3xl px-4 py-6">
                {/* Header */}
                <header className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/tasks")}
                        className="mb-4 gap-2 md:hidden"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <h1 className="text-3xl font-bold gradient-text mb-2">Profile</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your account settings
                    </p>
                </header>

                {/* Profile Information */}
                <Card className="p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>
                        <Button
                            onClick={handleUpdateProfile}
                            className="gradient-primary text-white border-0 hover:opacity-90"
                        >
                            Save Changes
                        </Button>
                    </div>
                </Card>

                {/* Password */}
                <Card className="p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Password
                    </h2>
                    {!isChangingPassword ? (
                        <Button
                            onClick={() => setIsChangingPassword(true)}
                            variant="outline"
                        >
                            Change Password
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleChangePassword}
                                    className="gradient-primary text-white border-0 hover:opacity-90"
                                >
                                    Update Password
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsChangingPassword(false)
                                        setNewPassword("")
                                        setConfirmPassword("")
                                    }}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Notifications */}
                <Card className="p-6 mb-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications for task reminders
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Switch
                                checked={isSubscribed}
                                onCheckedChange={async (checked) => {
                                    if (checked) {
                                        await handleToggleNotifications()
                                    } else {
                                        toast({
                                            title: "Info",
                                            description: "To disable notifications, revoke permission in your browser settings",
                                        })
                                    }
                                }}
                                disabled={subscribeLoading}
                            />
                            {!isSubscribed && (
                                <Button
                                    onClick={handleToggleNotifications}
                                    disabled={subscribeLoading}
                                    size="sm"
                                    variant="outline"
                                >
                                    {subscribeLoading ? "Subscribing..." : "Subscribe Now"}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Sign Out */}
                <Card className="p-6 mb-4">
                    <Button
                        onClick={signOut}
                        variant="destructive"
                        className="w-full"
                    >
                        Sign Out
                    </Button>
                </Card>

                {/* Install App Section */}
                <InstallAppSection />

                {/* Bottom Navigation */}
                <BottomNav
                    items={[
                        { icon: Grid, label: 'Home', href: '/tasks' },
                        { icon: CheckCircle2, label: 'Tasks', href: '/tasks/all' },
                        { icon: Calendar, label: 'Calendar', href: '/tasks/calendar' },
                        { icon: User, label: 'Profile', href: '/tasks/profile' },
                    ]}
                />
            </div>
        </div>
    )
}
