create or replace function public.validate_professional_signup(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  full_name text;
  name_parts integer;
begin
  if coalesce(event->'user'->'app_metadata'->>'provider', 'email') <> 'email' then
    return '{}'::jsonb;
  end if;

  full_name := pg_catalog.btrim(
    coalesce(event->'user'->'user_metadata'->>'full_name', '')
  );

  if
    pg_catalog.char_length(full_name) not between 5 and 100
    or full_name !~ '^[[:alpha:]]+([[:space:]''’-][[:alpha:]]+)*$'
  then
    return pg_catalog.jsonb_build_object(
      'error',
      pg_catalog.jsonb_build_object(
        'http_code', 400,
        'message', 'Informe nome e sobrenome usando letras, espaços, apóstrofos ou hífens.'
      )
    );
  end if;

  select pg_catalog.count(*)
    into name_parts
    from pg_catalog.regexp_matches(full_name, '[[:alpha:]]{2,}', 'g');

  if name_parts < 2 then
    return pg_catalog.jsonb_build_object(
      'error',
      pg_catalog.jsonb_build_object(
        'http_code', 400,
        'message', 'Informe seu nome completo.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.validate_professional_signup(jsonb)
  from anon, authenticated, public;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.validate_professional_signup(jsonb)
  to supabase_auth_admin;
