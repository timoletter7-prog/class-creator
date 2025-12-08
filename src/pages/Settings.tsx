import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Smartphone, CalendarClock, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dailyLimit, setDailyLimit] = useState([120]);
  const [weekendMode, setWeekendMode] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['userSettings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (settings) {
      setDailyLimit([settings.daily_limit_minutes]);
      setWeekendMode(settings.weekend_mode);
      setStrictMode(settings.strict_mode);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const settingsData = {
        user_id: user.id,
        daily_limit_minutes: dailyLimit[0],
        weekend_mode: weekendMode,
        strict_mode: strictMode,
      };

      if (settings) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert([settingsData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast.success('Instellingen opgeslagen!');
    },
    onError: (error) => {
      toast.error('Fout bij opslaan: ' + error.message);
    },
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minuten`;
    if (mins === 0) return `${hours} uur`;
    return `${hours}u ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground">Pas je voorkeuren voor schermtijdbeheer aan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Limit */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Dagelijkse Limiet</CardTitle>
                <CardDescription>Maximale schermtijd per dag</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Huidige limiet:</span>
                <span className="text-lg font-bold text-primary">{formatTime(dailyLimit[0])}</span>
              </div>
              <Slider
                value={dailyLimit}
                onValueChange={setDailyLimit}
                min={30}
                max={300}
                step={15}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30 min</span>
                <span>5 uur</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekend Mode */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Weekend Modus</CardTitle>
                <CardDescription>Flexibelere regels in het weekend</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="weekend-mode" className="text-sm font-medium">Weekend Modus</Label>
                <p className="text-xs text-muted-foreground mt-1">Dubbele limiet op zaterdag en zondag</p>
              </div>
              <Switch
                id="weekend-mode"
                checked={weekendMode}
                onCheckedChange={setWeekendMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Strict Mode */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Strikte Modus</CardTitle>
                <CardDescription>Extra strenge beveiliging</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="strict-mode" className="text-sm font-medium">Strikte Modus</Label>
                <p className="text-xs text-muted-foreground mt-1">Voorkomt dat limieten worden omzeild</p>
              </div>
              <Switch
                id="strict-mode"
                checked={strictMode}
                onCheckedChange={setStrictMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Card className="border-border">
        <CardFooter className="pt-6">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full md:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Opslaan...' : 'Instellingen Opslaan'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
