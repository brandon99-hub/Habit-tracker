"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Moon, Sun, Settings as SettingsIcon, Trash2, AlertTriangle } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { areNotificationsEnabled, requestNotificationPermission } from "@/lib/push-notifications"

export function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(false)
    const [reminderTime, setReminderTime] = useState("09:00")
    const [notificationTypes, setNotificationTypes] = useState({
        habitReminders: true,
        streakMilestones: true,
        weeklySummary: true,
        missedHabits: true,
    })
    const [defaultCategory, setDefaultCategory] = useState("Physical")
    const [defaultSchedule, setDefaultSchedule] = useState("everyday")
    const [defaultReminderTime, setDefaultReminderTime] = useState("09:00")

    useEffect(() => {
        setMounted(true)
        setNotificationsEnabled(areNotificationsEnabled())
    }, [])

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            const permission = await requestNotificationPermission()
            setNotificationsEnabled(permission === "granted")
        }
    }

    const handleClearData = () => {
        if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            localStorage.clear()
            window.location.reload()
        }
    }

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
            // TODO: Implement account deletion
            alert("Account deletion not yet implemented")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your preferences</p>
            </div>

            {/* Notifications */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Notifications</h3>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <Label htmlFor="notifications">Push Notifications</Label>
                            <p className="text-xs text-muted-foreground">
                                Get reminders for your habits
                            </p>
                        </div>
                        <Switch
                            id="notifications"
                            checked={notificationsEnabled}
                            onCheckedChange={handleNotificationToggle}
                        />
                    </div>

                    {notificationsEnabled && (
                        <>
                            <div className="rounded-md bg-muted p-3">
                                <p className="text-xs text-muted-foreground">
                                    ✓ Notifications enabled. You'll receive reminders for scheduled habits.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Daily Reminder Time</Label>
                                <Select value={reminderTime} onValueChange={setReminderTime}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="06:00">6:00 AM</SelectItem>
                                        <SelectItem value="07:00">7:00 AM</SelectItem>
                                        <SelectItem value="08:00">8:00 AM</SelectItem>
                                        <SelectItem value="09:00">9:00 AM</SelectItem>
                                        <SelectItem value="10:00">10:00 AM</SelectItem>
                                        <SelectItem value="18:00">6:00 PM</SelectItem>
                                        <SelectItem value="19:00">7:00 PM</SelectItem>
                                        <SelectItem value="20:00">8:00 PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label>Notification Types</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="habit-reminders"
                                            checked={notificationTypes.habitReminders}
                                            onCheckedChange={(checked) =>
                                                setNotificationTypes({ ...notificationTypes, habitReminders: !!checked })
                                            }
                                        />
                                        <label htmlFor="habit-reminders" className="text-sm">
                                            Habit reminders
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="streak-milestones"
                                            checked={notificationTypes.streakMilestones}
                                            onCheckedChange={(checked) =>
                                                setNotificationTypes({ ...notificationTypes, streakMilestones: !!checked })
                                            }
                                        />
                                        <label htmlFor="streak-milestones" className="text-sm">
                                            Streak milestones (7, 30, 60 days)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="weekly-summary"
                                            checked={notificationTypes.weeklySummary}
                                            onCheckedChange={(checked) =>
                                                setNotificationTypes({ ...notificationTypes, weeklySummary: !!checked })
                                            }
                                        />
                                        <label htmlFor="weekly-summary" className="text-sm">
                                            Weekly summary (Sundays)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="missed-habits"
                                            checked={notificationTypes.missedHabits}
                                            onCheckedChange={(checked) =>
                                                setNotificationTypes({ ...notificationTypes, missedHabits: !!checked })
                                            }
                                        />
                                        <label htmlFor="missed-habits" className="text-sm">
                                            Missed habit alerts
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Appearance */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        {mounted && theme === "dark" ? (
                            <Moon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <Sun className="h-5 w-5 text-muted-foreground" />
                        )}
                        <h3 className="font-semibold">Appearance</h3>
                    </div>

                    <div className="space-y-2">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={theme === "light" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("light")}
                                className="w-full"
                            >
                                <Sun className="mr-2 h-4 w-4" />
                                Light
                            </Button>
                            <Button
                                variant={theme === "dark" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("dark")}
                                className="w-full"
                            >
                                <Moon className="mr-2 h-4 w-4" />
                                Dark
                            </Button>
                            <Button
                                variant={theme === "system" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("system")}
                                className="w-full"
                            >
                                System
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Habit Defaults */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Habit Defaults</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Category</Label>
                            <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Physical">Physical</SelectItem>
                                    <SelectItem value="Mental">Mental</SelectItem>
                                    <SelectItem value="Creative">Creative</SelectItem>
                                    <SelectItem value="Social">Social</SelectItem>
                                    <SelectItem value="Work">Work</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Default Schedule</Label>
                            <Select value={defaultSchedule} onValueChange={setDefaultSchedule}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="everyday">Every Day</SelectItem>
                                    <SelectItem value="weekdays">Weekdays</SelectItem>
                                    <SelectItem value="weekends">Weekends</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Default Reminder Time</Label>
                            <Select value={defaultReminderTime} onValueChange={setDefaultReminderTime}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="06:00">6:00 AM</SelectItem>
                                    <SelectItem value="07:00">7:00 AM</SelectItem>
                                    <SelectItem value="08:00">8:00 AM</SelectItem>
                                    <SelectItem value="09:00">9:00 AM</SelectItem>
                                    <SelectItem value="18:00">6:00 PM</SelectItem>
                                    <SelectItem value="19:00">7:00 PM</SelectItem>
                                    <SelectItem value="20:00">8:00 PM</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Data & Privacy */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Data & Privacy</h3>
                    </div>

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={handleClearData}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All Data
                            <span className="ml-auto text-xs text-muted-foreground">Reset app</span>
                        </Button>

                        <Button
                            variant="destructive"
                            className="w-full justify-start"
                            onClick={handleDeleteAccount}
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Delete Account
                            <span className="ml-auto text-xs">Permanent</span>
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
