
-- Kontakte-Tabelle für das Telefonverzeichnis
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salutation TEXT DEFAULT '',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  department1 TEXT DEFAULT '',
  department2 TEXT DEFAULT '',
  position TEXT DEFAULT '',
  phone_work TEXT DEFAULT '',
  phone_work2 TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  fax TEXT DEFAULT '',
  phone_other TEXT DEFAULT '',
  pager TEXT DEFAULT '',
  email_display TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Jeder darf lesen
CREATE POLICY "Contacts are viewable by everyone"
  ON public.contacts FOR SELECT
  USING (true);

-- Jeder darf einfügen
CREATE POLICY "Anyone can insert contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (true);

-- Jeder darf bearbeiten
CREATE POLICY "Anyone can update contacts"
  ON public.contacts FOR UPDATE
  USING (true);

-- Jeder darf löschen
CREATE POLICY "Anyone can delete contacts"
  ON public.contacts FOR DELETE
  USING (true);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
