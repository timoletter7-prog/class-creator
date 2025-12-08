import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "./StatCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Zap, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("class_groups")
        .select("*")
        .eq("teacher_id", user.id);
      if (error) {
        console.error("Error fetching classes:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create new class
  const createClassMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("class_groups")
        .insert([
          {
            teacher_id: user!.id,
            name: `Nieuwe klas ${new Date().toLocaleTimeString("nl-NL")}`,
            description: `Aangemaakt op ${new Date().toLocaleDateString("nl-NL")}`,
          },
        ])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", user?.id] });
      toast.success("Klas aangemaakt!");
    },
    onError: (error) => {
      toast.error("Fout bij het aanmaken van de klas: " + error.message);
    },
  });

  const stats = [
    {
      title: "Actieve Klassen",
      value: classes.length,
      icon: Users,
      color: "indigo" as const,
    },
    {
      title: "Totaal Studenten",
      value: classes.reduce((sum, c) => sum + (c.student_count || 0), 0),
      icon: Users,
      color: "blue" as const,
    },
    {
      title: "Waarschuwingen Deze Week",
      value: 0,
      icon: Zap,
      color: "orange" as const,
    },
    {
      title: "Gem. Schermtijd (min/dag)",
      value: 0,
      icon: Clock,
      color: "red" as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welkom terug, Docent!</p>
        </div>
        <Button
          onClick={() => createClassMutation.mutate()}
          className="bg-primary hover:bg-primary/90"
          disabled={createClassMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Klas
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Classes List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Mijn Klassen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Bezig met laden...</p>
            ) : classes.length > 0 ? (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {cls.name || "Naamloze Klas"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {cls.description || "Geen beschrijving"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Beheren
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Geen klassen gevonden. Maak een nieuwe klas aan!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
