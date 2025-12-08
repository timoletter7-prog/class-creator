import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Shield, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Whitelist() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newAppName, setNewAppName] = useState('');
  const [appType, setAppType] = useState<'whitelisted' | 'blocked'>('whitelisted');
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('class_groups')
        .select('*')
        .eq('teacher_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: apps = [] } = useQuery({
    queryKey: ['apps', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const { data, error } = await supabase
        .from('app_management')
        .select('*')
        .eq('class_group_id', selectedClassId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClassId,
  });

  const addAppMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('app_management')
        .insert([{
          class_group_id: selectedClassId,
          app_name: newAppName,
          app_type: appType,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps', selectedClassId] });
      setNewAppName('');
      toast.success(`App ${appType === 'whitelisted' ? 'toegevoegd aan whitelist' : 'geblokkeerd'}`);
    },
    onError: (error) => {
      toast.error('Fout: ' + error.message);
    },
  });

  const removeAppMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from('app_management')
        .delete()
        .eq('id', appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps', selectedClassId] });
      toast.success('App verwijderd');
    },
  });

  const whitelistedApps = apps.filter(app => app.app_type === 'whitelisted');
  const blockedApps = apps.filter(app => app.app_type === 'blocked');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">App Beheer</h1>
        <p className="text-muted-foreground">Beheer welke apps toegestaan of geblokkeerd zijn per klas.</p>
      </div>

      {/* Class Selection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Selecteer een Klas</CardTitle>
          <CardDescription>Kies een klas om de app-instellingen te beheren.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {classes.map((cls) => (
              <Button
                key={cls.id}
                variant={selectedClassId === cls.id ? "default" : "outline"}
                onClick={() => setSelectedClassId(cls.id)}
              >
                {cls.name}
              </Button>
            ))}
            {classes.length === 0 && (
              <p className="text-muted-foreground">Geen klassen gevonden. Maak eerst een klas aan.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Tabs defaultValue="whitelist" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whitelist" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Whitelist ({whitelistedApps.length})
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Geblokkeerd ({blockedApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whitelist" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Toegestane Apps
                </CardTitle>
                <CardDescription>Deze apps zijn altijd toegestaan tijdens schooluren.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="App naam (bijv. Duolingo)"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setAppType('whitelisted');
                        addAppMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      setAppType('whitelisted');
                      addAppMutation.mutate();
                    }}
                    disabled={!newAppName || addAppMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Toevoegen
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {whitelistedApps.map((app) => (
                    <Badge key={app.id} variant="secondary" className="pl-3 pr-1 py-1.5 flex items-center gap-2">
                      {app.app_name}
                      <button
                        onClick={() => removeAppMutation.mutate(app.id)}
                        className="hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {whitelistedApps.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">Nog geen apps op de whitelist.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  Geblokkeerde Apps
                </CardTitle>
                <CardDescription>Deze apps zijn altijd geblokkeerd tijdens schooluren.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="App naam (bijv. TikTok)"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setAppType('blocked');
                        addAppMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setAppType('blocked');
                      addAppMutation.mutate();
                    }}
                    disabled={!newAppName || addAppMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Blokkeren
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {blockedApps.map((app) => (
                    <Badge key={app.id} variant="destructive" className="pl-3 pr-1 py-1.5 flex items-center gap-2">
                      {app.app_name}
                      <button
                        onClick={() => removeAppMutation.mutate(app.id)}
                        className="hover:bg-background/20 rounded-full p-0.5 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {blockedApps.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">Nog geen geblokkeerde apps.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
