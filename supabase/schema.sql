-- Rumah Sakit Anaverse — skema Supabase (PostgreSQL) + Row Level Security
-- Jalankan di SQL Editor Supabase. Belum diuji pada proyek Supabase nyata: tinjau sebelum produksi.

create extension if not exists "pgcrypto";

create type user_role as enum ('patient', 'doctor', 'admin');
create type appointment_status as enum ('Menunggu Konfirmasi', 'Dikonfirmasi', 'Selesai', 'Dibatalkan');
create type consultation_status as enum ('Menunggu', 'Dijadwalkan', 'Aktif', 'Selesai', 'Dibatalkan');
create type schedule_kind as enum ('offline', 'online');

-- ---------- Tabel ----------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  address text,
  birth_date date,
  gender text,
  role user_role not null default 'patient',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default 'Stethoscope'
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles (id) on delete set null,
  name text not null,
  specialty_id uuid not null references specialties (id) on delete restrict,
  experience_years int not null default 0 check (experience_years between 0 and 60),
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  photo_url text,
  bio text,
  education text
);

create table services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text,
  image_url text,
  summary text,
  description text,
  features text[] not null default '{}',
  hours text
);

create table doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  kind schedule_kind not null default 'offline',
  check (end_time > start_time)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  patient_id uuid not null references profiles (id) on delete cascade,
  doctor_id uuid not null references doctors (id) on delete restrict,
  appointment_date date not null,
  appointment_time time not null,
  complaint text not null,
  notes text,
  payer text not null default 'Umum',
  status appointment_status not null default 'Menunggu Konfirmasi',
  cancel_reason text,
  created_at timestamptz not null default now()
);
-- Mencegah double booking: satu dokter + tanggal + jam hanya boleh punya satu janji aktif.
create unique index appointments_no_double_booking
  on appointments (doctor_id, appointment_date, appointment_time)
  where status <> 'Dibatalkan';

create table consultations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  patient_id uuid not null references profiles (id) on delete cascade,
  doctor_id uuid not null references doctors (id) on delete restrict,
  consultation_date date not null,
  consultation_time time not null,
  complaint text not null,
  channel text not null default 'chat' check (channel in ('chat', 'video')),
  video_room_url text, -- disiapkan untuk integrasi video (lihat src/services/video.ts)
  status consultation_status not null default 'Menunggu',
  summary text,
  cancel_reason text,
  created_at timestamptz not null default now()
);
create unique index consultations_no_double_booking
  on consultations (doctor_id, consultation_date, consultation_time)
  where status <> 'Dibatalkan';

create table consultation_messages (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create index on consultation_messages (consultation_id, created_at);

create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  excerpt text,
  content text,
  image_url text,
  published_at date not null default current_date
);

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  service text,
  rating smallint not null check (rating between 1 and 5),
  body text not null
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position int not null default 0
);

create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  description text
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------- Fungsi bantu ----------
create or replace function public.current_role_name() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and active
$$;

create or replace function public.current_doctor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select d.id from doctors d join profiles p on p.id = d.profile_id where p.id = auth.uid() and p.active
$$;

-- Profil otomatis dibuat saat pendaftaran. Peran SELALU 'patient' dari klien.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email, phone, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, new.raw_user_meta_data ->> 'phone', 'patient');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Pasien tidak boleh mengubah peran/status aktif sendiri.
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.current_role_name() is distinct from 'admin' then
    new.role := old.role;
    new.active := old.active;
  end if;
  return new;
end $$;
create trigger protect_profile before update on profiles for each row execute function public.protect_profile_columns();

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table specialties enable row level security;
alter table doctors enable row level security;
alter table services enable row level security;
alter table doctor_schedules enable row level security;
alter table appointments enable row level security;
alter table consultations enable row level security;
alter table consultation_messages enable row level security;
alter table articles enable row level security;
alter table testimonials enable row level security;
alter table faqs enable row level security;
alter table facilities enable row level security;
alter table contact_messages enable row level security;

-- Konten publik: semua orang boleh membaca; hanya admin boleh menulis.
do $$
declare t text;
begin
  foreach t in array array['specialties', 'doctors', 'services', 'doctor_schedules', 'articles', 'testimonials', 'faqs', 'facilities']
  loop
    execute format('create policy "%1$s_public_read" on %1$s for select using (true)', t);
    execute format('create policy "%1$s_admin_write" on %1$s for all using (public.current_role_name() = ''admin'') with check (public.current_role_name() = ''admin'')', t);
  end loop;
end $$;

-- Dokter boleh mengelola jadwal miliknya sendiri.
create policy doctor_schedules_own_write on doctor_schedules for all
  using (doctor_id = public.current_doctor_id()) with check (doctor_id = public.current_doctor_id());

-- profiles
create policy profiles_self_read on profiles for select using (id = auth.uid());
create policy profiles_admin_read on profiles for select using (public.current_role_name() = 'admin');
create policy profiles_doctor_reads_own_patients on profiles for select using (
  public.current_role_name() = 'doctor' and (
    exists (select 1 from appointments a where a.patient_id = profiles.id and a.doctor_id = public.current_doctor_id()) or
    exists (select 1 from consultations c where c.patient_id = profiles.id and c.doctor_id = public.current_doctor_id())
  )
);
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on profiles for update using (public.current_role_name() = 'admin');

-- appointments
create policy appointments_patient_read on appointments for select using (patient_id = auth.uid());
create policy appointments_doctor_read on appointments for select using (doctor_id = public.current_doctor_id());
create policy appointments_admin_all on appointments for all using (public.current_role_name() = 'admin') with check (public.current_role_name() = 'admin');
create policy appointments_patient_insert on appointments for insert
  with check (patient_id = auth.uid() and public.current_role_name() = 'patient' and status = 'Menunggu Konfirmasi');
create policy appointments_patient_cancel on appointments for update
  using (patient_id = auth.uid() and status in ('Menunggu Konfirmasi', 'Dikonfirmasi'))
  with check (patient_id = auth.uid() and status = 'Dibatalkan');
create policy appointments_doctor_update on appointments for update
  using (doctor_id = public.current_doctor_id()) with check (doctor_id = public.current_doctor_id());

-- consultations
create policy consultations_patient_read on consultations for select using (patient_id = auth.uid());
create policy consultations_doctor_read on consultations for select using (doctor_id = public.current_doctor_id());
create policy consultations_admin_read on consultations for select using (public.current_role_name() = 'admin');
create policy consultations_patient_insert on consultations for insert
  with check (patient_id = auth.uid() and public.current_role_name() = 'patient' and status = 'Menunggu');
create policy consultations_patient_cancel on consultations for update
  using (patient_id = auth.uid() and status in ('Menunggu', 'Dijadwalkan')) with check (patient_id = auth.uid() and status = 'Dibatalkan');
create policy consultations_doctor_update on consultations for update
  using (doctor_id = public.current_doctor_id()) with check (doctor_id = public.current_doctor_id());

-- consultation_messages: hanya peserta konsultasi, dan hanya saat sesi Aktif.
create policy messages_participants_read on consultation_messages for select using (
  exists (select 1 from consultations c where c.id = consultation_id and (c.patient_id = auth.uid() or c.doctor_id = public.current_doctor_id()))
);
create policy messages_participants_insert on consultation_messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from consultations c where c.id = consultation_id and c.status = 'Aktif'
      and (c.patient_id = auth.uid() or c.doctor_id = public.current_doctor_id())
  )
);

-- contact_messages: siapa pun boleh mengirim, hanya admin yang membaca.
create policy contact_insert on contact_messages for insert with check (true);
create policy contact_admin_read on contact_messages for select using (public.current_role_name() = 'admin');

-- Realtime untuk chat konsultasi
alter publication supabase_realtime add table consultation_messages;
