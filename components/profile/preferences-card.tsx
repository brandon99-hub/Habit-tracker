"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
    UserPreferences,
    DEFAULT_PREFERENCES,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    DATE_FORMAT_OPTIONS,
    TIME_FORMAT_OPTIONS,
    WEEK_START_OPTIONS
} from "@/lib/profile/preferences"

interface PreferencesCardProps {
    initialPreferences: UserPreferences
    onPreferencesUpdate: (prefs: UserPreferences) => void
}

export function PreferencesCard({ initialPreferences, onPreferencesUpdate }: PreferencesCardProps) {
    const { toast } = useToast()
    const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { preferences }
            })

            if (error) throw error

            onPreferencesUpdate(preferences)
            toast({
                title: "Success",
                description: "Preferences saved successfully"
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save preferences",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card className="p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                App Preferences
            </h2>
            <div className="space-y-4">
                {/* Default Status */}
                <div className="space-y-2">
                    <Label>Default Task Status</Label>
                    <Select
                        value={preferences.defaultStatus}
                        onValueChange={(value) => setPreferences({ ...preferences, defaultStatus: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        New tasks will be created with this status
                    </p>
                </div>

                {/* Default Priority */}
                <div className="space-y-2">
                    <Label>Default Task Priority</Label>
                    <Select
                        value={preferences.defaultPriority}
                        onValueChange={(value) => setPreferences({ ...preferences, defaultPriority: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PRIORITY_OPTIONS.map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                    {priority}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        New tasks will be created with this priority
                    </p>
                </div>

                {/* Date Format */}
                <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select
                        value={preferences.dateFormat}
                        onValueChange={(value: any) => setPreferences({ ...preferences, dateFormat: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DATE_FORMAT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Time Format */}
                <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select
                        value={preferences.timeFormat}
                        onValueChange={(value: any) => setPreferences({ ...preferences, timeFormat: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_FORMAT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Week Starts On */}
                <div className="space-y-2">
                    <Label>Week Starts On</Label>
                    <Select
                        value={preferences.weekStartsOn.toString()}
                        onValueChange={(value) => setPreferences({ ...preferences, weekStartsOn: parseInt(value) as 0 | 1 })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {WEEK_START_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gradient-primary text-white border-0 hover:opacity-90 w-full"
                >
                    {saving ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </Card>
    )
}
