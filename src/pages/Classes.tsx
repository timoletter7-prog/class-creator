import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Plus, GraduationCap, Shield, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Classes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newApp, setNewApp] = useState('');

  const { data: classes, isLoading } = useQuery({
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

  const { data: allStudents } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const classStudents = allStudents?.filter(s => s.class_group_id === selectedClass?.id) || [];

  const createClassMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const { error, data: result } = await supabase
        .from('class_groups')
        .insert([{
          teacher_id: user!.id,
          name: data.name,
          school_year: '2024-2025',
          description: 'Nieuwe klasgroep',
        }])
        .select();
      if (error) throw error;
      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreateOpen(false);
      setNewClassName('');
      toast.success("Klas aangemaakt!");
    },
    onError: (error) => {
      toast.error("Fout bij aanmaken: " + error.message);
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async (data: { whitelisted_apps: string[] }) => {
      const { error } = await supabase
        .from('class_groups')
        .update(data)
        .eq('id', selectedClass.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success("Wijzigingen opgeslagen");
    },
  });

  const handleCreate = () => {
    if (!newClassName) return;
    createClassMutation.mutate({ name: newClassName });
  };

  const handleAddApp = () => {
    if (!newApp || !selectedClass) return;
    const currentApps = selectedClass.whitelisted_apps || [];
    if (currentApps.some((app: string) => app.toLowerCase() === newApp.toLowerCase())) {
      toast.error("App bestaat al");
      return;
    }
    const updatedApps = [...currentApps, newApp];
    updateClassMutation.mutate({ whitelisted_apps: updatedApps });
    setSelectedClass({ ...selectedClass, whitelisted_apps: updatedApps });
    setNewApp('');
  };

  const handleRemoveApp = (appToRemove: string) => {
    const currentApps = selectedClass.whitelisted_apps || [];
    const updatedApps = currentApps.filter((app: string) => app !== appToRemove);
    updateClassMutation.mutate({ whitelisted_apps: updatedApps });
    setSelectedClass({ ...selectedClass, whitelisted_apps: updatedApps });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mijn Klassen</h1>
          <p className="text-muted-foreground">Beheer je klasgroepen en studenten.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Klas
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-md transition-all group cursor-pointer border-border flex flex-col"
              onClick={() => setSelectedClass(group)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary mb-2">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="bg-muted">
                    {group.school_year}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{group.name}</CardTitle>
                <CardDescription>{group.description || 'Geen beschrijving'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>Leerlingen beheren</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Whitelist: {group.whitelisted_apps?.length || 0} apps</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 mt-auto">
                <Button variant="ghost" className="w-full group-hover:bg-primary/10 group-hover:text-primary transition-colors flex justify-between items-center">
                  Beheer Klas
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </CardFooter>
            </Card>
          ))}

          <button
            onClick={() => setIsCreateOpen(true)}
            className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all min-h-[250px]"
          >
            <div className="p-3 rounded-full bg-muted mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Nieuwe Klas Toevoegen</span>
          </button>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Klas Aanmaken</DialogTitle>
            <DialogDescription>Geef de klas een naam om te beginnen.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Naam van de klas (bijv. Groep 7)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuleren</Button>
            <Button onClick={handleCreate} disabled={createClassMutation.isPending}>Aanmaken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClass?.name} Beheren</DialogTitle>
            <DialogDescription>Beheer studenten en app-whitelists.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="students" className="w-full mt-4">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
              <TabsTrigger value="students" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">
                Studenten
              </TabsTrigger>
              <TabsTrigger value="whitelist" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">
                App Whitelist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="pt-4 min-h-[300px]">
              <div className="space-y-3">
                {classStudents.length > 0 ? (
                  classStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                          {student.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.points} punten</p>
                        </div>
                      </div>
                      <Badge variant={Number(student.points) < 10 ? 'destructive' : 'outline'}>
                        {Number(student.points) < 10 ? 'Aandacht' : 'Actief'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Geen studenten gevonden in deze klas.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="whitelist" className="pt-4 min-h-[300px]">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3 items-start dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
                  <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Whitelist Systeem</p>
                    <p>Apps in deze lijst zijn altijd toegestaan tijdens schooluren.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="App naam toevoegen (bijv. Duolingo)"
                    value={newApp}
                    onChange={(e) => setNewApp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddApp()}
                  />
                  <Button onClick={handleAddApp} variant="secondary">Toevoegen</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedClass?.whitelisted_apps?.map((app: string) => (
                    <Badge key={app} variant="secondary" className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2">
                      {app}
                      <button
                        onClick={() => handleRemoveApp(app)}
                        className="hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!selectedClass?.whitelisted_apps || selectedClass.whitelisted_apps.length === 0) && (
                    <p className="text-muted-foreground text-sm italic w-full text-center py-4">Nog geen apps op de whitelist.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
