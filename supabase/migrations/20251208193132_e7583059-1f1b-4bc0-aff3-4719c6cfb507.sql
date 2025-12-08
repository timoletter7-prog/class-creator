-- Create class_groups table for managing school classes
CREATE TABLE public.class_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  school_year TEXT DEFAULT '2024-2025',
  student_count INTEGER DEFAULT 0,
  whitelisted_apps TEXT[] DEFAULT ARRAY['Rekenmachine', 'SchoolPortaal', 'Wikipedia'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_profiles table for student information
CREATE TABLE public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_group_id UUID REFERENCES public.class_groups(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  user_email TEXT,
  points DECIMAL(10,2) DEFAULT 10.0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_management table for app whitelist/blocklist
CREATE TABLE public.app_management (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_group_id UUID REFERENCES public.class_groups(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  app_type TEXT DEFAULT 'whitelisted' CHECK (app_type IN ('whitelisted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_settings table for user preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_limit_minutes INTEGER DEFAULT 120,
  weekend_mode BOOLEAN DEFAULT true,
  strict_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_groups
CREATE POLICY "Teachers can view their own classes" 
ON public.class_groups FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create classes" 
ON public.class_groups FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classes" 
ON public.class_groups FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own classes" 
ON public.class_groups FOR DELETE 
USING (auth.uid() = teacher_id);

-- RLS Policies for student_profiles
CREATE POLICY "Teachers can view students in their classes" 
ON public.student_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can create students in their classes" 
ON public.student_profiles FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update students in their classes" 
ON public.student_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete students in their classes" 
ON public.student_profiles FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

-- RLS Policies for app_management
CREATE POLICY "Teachers can view apps for their classes" 
ON public.app_management FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage apps for their classes" 
ON public.app_management FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update apps for their classes" 
ON public.app_management FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete apps from their classes" 
ON public.app_management FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.class_groups 
    WHERE id = class_group_id AND teacher_id = auth.uid()
  )
);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_class_groups_updated_at
BEFORE UPDATE ON public.class_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();