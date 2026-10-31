create table public.businesses (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null unique
    check (slug = pg_catalog.lower(slug) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (pg_catalog.char_length(pg_catalog.btrim(name)) between 2 and 120),
  category text not null check (pg_catalog.char_length(pg_catalog.btrim(category)) between 2 and 80),
  description text,
  contact_whatsapp text,
  timezone text not null default 'America/Sao_Paulo',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (pg_catalog.char_length(pg_catalog.btrim(name)) between 2 and 120),
  description text,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, business_id)
);

create table public.business_hours (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  unique (business_id, weekday),
  check (
    (is_closed and open_time is null and close_time is null)
    or (
      not is_closed
      and open_time is not null
      and close_time is not null
      and open_time < close_time
    )
  )
);

create table public.appointments (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid not null,
  customer_name text not null
    check (pg_catalog.char_length(pg_catalog.btrim(customer_name)) between 2 and 120),
  customer_phone text not null
    check (pg_catalog.char_length(pg_catalog.btrim(customer_phone)) between 8 and 32),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint appointments_valid_interval check (ends_at > starts_at),
  constraint appointments_service_business_fk
    foreign key (service_id, business_id)
    references public.services (id, business_id)
    on delete restrict
);

create index services_business_id_idx on public.services (business_id);
create index appointments_business_starts_at_idx
  on public.appointments (business_id, starts_at);

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.businesses
      where id = p_business_id
        and owner_id = (select auth.uid())
  );
$$;

revoke all on function public.is_business_owner(uuid) from public;
grant execute on function public.is_business_owner(uuid) to authenticated;

alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.appointments enable row level security;

create policy businesses_public_read
  on public.businesses for select to anon, authenticated
  using (is_active);

create policy businesses_owner_read
  on public.businesses for select to authenticated
  using (public.is_business_owner(id));

create policy businesses_owner_insert
  on public.businesses for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy businesses_owner_update
  on public.businesses for update to authenticated
  using (public.is_business_owner(id))
  with check (owner_id = (select auth.uid()));

create policy services_public_read
  on public.services for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1
      from public.businesses
      where businesses.id = services.business_id
        and businesses.is_active
    )
  );

create policy services_owner_read
  on public.services for select to authenticated
  using (public.is_business_owner(business_id));

create policy services_owner_insert
  on public.services for insert to authenticated
  with check (public.is_business_owner(business_id));

create policy services_owner_update
  on public.services for update to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

create policy business_hours_public_read
  on public.business_hours for select to anon, authenticated
  using (
    exists (
      select 1 from public.businesses
      where businesses.id = business_hours.business_id
        and businesses.is_active
    )
  );

create policy business_hours_owner_read
  on public.business_hours for select to authenticated
  using (public.is_business_owner(business_id));

create policy business_hours_owner_insert
  on public.business_hours for insert to authenticated
  with check (public.is_business_owner(business_id));

create policy business_hours_owner_update
  on public.business_hours for update to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

create policy appointments_owner_read
  on public.appointments for select to authenticated
  using (public.is_business_owner(business_id));

create policy appointments_owner_update
  on public.appointments for update to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

grant select (id, slug, name, category, description, contact_whatsapp, timezone, is_active)
  on public.businesses to anon, authenticated;
grant insert (slug, name, category, description, contact_whatsapp, timezone, is_active)
  on public.businesses to authenticated;
grant update (slug, name, category, description, contact_whatsapp, timezone, is_active)
  on public.businesses to authenticated;

grant select (id, business_id, name, description, duration_minutes, price, is_active)
  on public.services to anon, authenticated;
grant insert (business_id, name, description, duration_minutes, price, is_active)
  on public.services to authenticated;
grant update (name, description, duration_minutes, price, is_active)
  on public.services to authenticated;

grant select (id, business_id, weekday, open_time, close_time, is_closed)
  on public.business_hours to anon, authenticated;
grant insert (business_id, weekday, open_time, close_time, is_closed)
  on public.business_hours to authenticated;
grant update (weekday, open_time, close_time, is_closed)
  on public.business_hours to authenticated;

grant select on public.appointments to authenticated;
grant update (status) on public.appointments to authenticated;

create or replace function public.create_public_appointment(
  p_business_slug text,
  p_service_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_starts_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses%rowtype;
  v_service public.services%rowtype;
  v_hours public.business_hours%rowtype;
  v_ends_at timestamptz;
  v_local_start timestamp without time zone;
  v_local_end timestamp without time zone;
  v_appointment_id uuid;
begin
  if p_business_slug is null
    or pg_catalog.char_length(pg_catalog.btrim(p_business_slug)) not between 1 and 100
    or p_service_id is null
    or p_starts_at is null
    or p_starts_at <= now()
    or p_customer_name is null
    or pg_catalog.char_length(pg_catalog.btrim(p_customer_name)) not between 2 and 120
    or p_customer_phone is null
    or pg_catalog.char_length(pg_catalog.btrim(p_customer_phone)) not between 8 and 32
  then
    raise exception using errcode = '22023', message = 'Invalid booking details';
  end if;

  select *
    into v_business
    from public.businesses
    where slug = pg_catalog.lower(pg_catalog.btrim(p_business_slug))
      and is_active;

  if not found then
    raise exception using errcode = '22023', message = 'Business not found or inactive';
  end if;

  select *
    into v_service
    from public.services
    where id = p_service_id
      and business_id = v_business.id
      and is_active;

  if not found then
    raise exception using errcode = '22023', message = 'Service not found or inactive';
  end if;

  v_ends_at := p_starts_at + pg_catalog.make_interval(mins => v_service.duration_minutes);
  v_local_start := p_starts_at at time zone v_business.timezone;
  v_local_end := v_ends_at at time zone v_business.timezone;

  select *
    into v_hours
    from public.business_hours
    where business_id = v_business.id
      and weekday = (extract(dow from v_local_start))::smallint;

  if not found
    or v_hours.is_closed
    or v_local_end::date <> v_local_start::date
    or v_local_start::time < v_hours.open_time
    or v_local_end::time > v_hours.close_time
  then
    raise exception using errcode = '22023', message = 'Requested time is outside business hours';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_business.id::text));

  if exists (
    select 1
      from public.appointments
      where business_id = v_business.id
        and status in ('pending', 'confirmed')
        and starts_at < v_ends_at
        and ends_at > p_starts_at
  ) then
    raise exception using errcode = '23P01', message = 'Requested time is no longer available';
  end if;

  insert into public.appointments (
    business_id,
    service_id,
    customer_name,
    customer_phone,
    starts_at,
    ends_at
  )
  values (
    v_business.id,
    v_service.id,
    pg_catalog.btrim(p_customer_name),
    pg_catalog.btrim(p_customer_phone),
    p_starts_at,
    v_ends_at
  )
  returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;

revoke all on function public.create_public_appointment(text, uuid, text, text, timestamptz)
  from public;
grant execute on function public.create_public_appointment(text, uuid, text, text, timestamptz)
  to anon, authenticated;

notify pgrst, 'reload schema';
