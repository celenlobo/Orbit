create table if not exists public.orbit_tasks (
    id bigint primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    priority text not null default 'normal',
    completed boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.orbit_events (
    id bigint primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    date date not null,
    start_time text,
    end_time text,
    reminder text,
    repeat_type text,
    weekdays jsonb not null default '[]'::jsonb,
    notes text,
    created_at timestamptz not null default now()
);

create table if not exists public.orbit_projects (
    id bigint primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    status text not null default 'active',
    progress integer not null default 0,
    deadline date,
    description text,
    created_at timestamptz not null default now()
);

create table if not exists public.orbit_project_tasks (
    id bigint primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id bigint not null references public.orbit_projects(id) on delete cascade,
    title text not null,
    completed boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists orbit_tasks_user_id_idx on public.orbit_tasks(user_id);
create index if not exists orbit_events_user_id_idx on public.orbit_events(user_id);
create index if not exists orbit_projects_user_id_idx on public.orbit_projects(user_id);
create index if not exists orbit_project_tasks_user_id_idx on public.orbit_project_tasks(user_id);
create index if not exists orbit_project_tasks_project_id_idx on public.orbit_project_tasks(project_id);

alter table public.orbit_tasks enable row level security;
alter table public.orbit_events enable row level security;
alter table public.orbit_projects enable row level security;
alter table public.orbit_project_tasks enable row level security;

drop policy if exists "orbit_tasks_own" on public.orbit_tasks;
create policy "orbit_tasks_own" on public.orbit_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orbit_events_own" on public.orbit_events;
create policy "orbit_events_own" on public.orbit_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orbit_projects_own" on public.orbit_projects;
create policy "orbit_projects_own" on public.orbit_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orbit_project_tasks_own" on public.orbit_project_tasks;
create policy "orbit_project_tasks_own" on public.orbit_project_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
