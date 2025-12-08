import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Star, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Goals() {
  const { user } = useAuth();

  const { data: myProfile } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.email,
  });

  const points = myProfile?.points || 10;
  const nextLevel = Math.floor(Number(points)) + 1;
  const progress = (Number(points) - Math.floor(Number(points))) * 100;
  const streak = myProfile?.streak_days || 0;

  const rules = [
    { points: "+10", action: "Startbonus", desc: "Iedereen begint met 10 punten.", icon: Star, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950" },
    { points: "-0.5", action: "Waarschuwing", desc: "Bij overschrijden van limiet of gebruik geblokkeerde app.", icon: AlertTriangle, color: "text-red-500 bg-red-50 dark:bg-red-950" },
    { points: "+0.5", action: "Goede dag", desc: "Een dag zonder overtredingen.", icon: CheckCircle2, color: "text-green-500 bg-green-50 dark:bg-green-950" },
    { points: "Bonus", action: "30 Dagen Reeks", desc: "+0.5 punt op je volgende toets!", icon: Trophy, color: "text-primary bg-primary/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Jouw Groei & Beloningen</h1>
        <p className="text-muted-foreground">Verdien punten door verstandig met je schermtijd om te gaan. Laat zien dat je de baas bent over je telefoon!</p>
      </div>

      {/* Current Status */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">{Number(points).toFixed(1)}</span>
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full">
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="text-xl font-bold text-foreground">Op weg naar {nextLevel}.0</h3>
                <p className="text-muted-foreground">Nog even volhouden!</p>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Niveau {Math.floor(Number(points) / 10)}</Badge>
            </div>
            <Progress value={progress} className="h-3 mb-2" />
            <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}% tot volgende punt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rules Section */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              Hoe werkt het?
            </CardTitle>
            <CardDescription>Het puntensysteem uitgelegd</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${rule.color}`}>
                      <rule.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{rule.action}</p>
                      <p className="text-xs text-muted-foreground">{rule.desc}</p>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">{rule.points}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-muted-foreground" />
              Jouw Mijlpalen
            </CardTitle>
            <CardDescription>Behaalde successen dit jaar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className={`p-4 rounded-xl border ${Number(points) >= 10 ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border opacity-50 grayscale'}`}>
                <div className="mx-auto w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                  🚀
                </div>
                <p className={`font-semibold text-sm ${Number(points) >= 10 ? 'text-primary' : 'text-foreground'}`}>Startschot</p>
                <p className={`text-xs mt-1 ${Number(points) >= 10 ? 'text-primary/70' : 'text-muted-foreground'}`}>Account aangemaakt</p>
              </div>
              <div className={`p-4 rounded-xl border ${streak >= 7 ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border opacity-50 grayscale'}`}>
                <div className="mx-auto w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                  🔥
                </div>
                <p className={`font-semibold text-sm ${streak >= 7 ? 'text-primary' : 'text-foreground'}`}>Weekvlam</p>
                <p className={`text-xs mt-1 ${streak >= 7 ? 'text-primary/70' : 'text-muted-foreground'}`}>7 dagen reeks</p>
              </div>
              <div className={`p-4 rounded-xl border ${streak >= 30 ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border opacity-50 grayscale'}`}>
                <div className="mx-auto w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                  👑
                </div>
                <p className={`font-semibold text-sm ${streak >= 30 ? 'text-primary' : 'text-foreground'}`}>DigiKoning</p>
                <p className={`text-xs mt-1 ${streak >= 30 ? 'text-primary/70' : 'text-muted-foreground'}`}>30 dagen reeks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
