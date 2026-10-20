-- ═══════════════════════════════════════════════════════════
--  Conferencias Empresariales CANACO · tabla `conferencia_canaco`
--  en la base de LA PIZARRA · IBERO Tijuana
--
--      python supabase/correr.py conferencia.sql
--
--  Se puede volver a correr sin miedo: no borra ni duplica nada.
--
--  EL MISMO PATRÓN QUE `casting`, `solicitudes` Y `revisiones`
--  Quien llena el formulario es un alumno sin cuenta: cualquiera
--  (anon) puede DEJAR un renglón, con forma y tamaño acotados;
--  sólo el equipo (con sesión de LA PIZARRA) puede leer la lista,
--  cambiar el estado o borrar.
--
--  LO QUE ESTA TABLA TIENE DE DISTINTO: EL CUPO
--  Son 25 lugares y punto. Contar en el navegador no sirve: dos
--  personas pueden pedir el último lugar al mismo tiempo y los dos
--  verían «quedan 1». Por eso el cupo se cuida AQUÍ, con un
--  disparador que toma un candado antes de contar, de modo que los
--  registros se formen en fila y el número 26 reciba un error en vez
--  de un lugar que no existe.
--
--  El disparador además le asigna su número de lugar a cada quien:
--  así el alumno ve «eres el 7 de 25» y la lista sale en el orden en
--  que llegaron.
-- ═══════════════════════════════════════════════════════════


-- ── 1. La tabla ────────────────────────────────────────────

create table if not exists public.conferencia_canaco (
  folio      text primary key,              -- 8 caracteres, lo genera el formulario
  lugar      integer,                       -- 1..25, lo pone el disparador
  nombre     text not null default '',
  matricula  text not null default '',
  carrera    text not null default '',
  semestre   integer not null default 0,
  correo     text not null default '',
  telefono   text not null default '',
  estado     text not null default 'registrado',
  nota       text not null default '',
  creado     timestamptz not null default now()
);

alter table public.conferencia_canaco drop constraint if exists conferencia_estado_check;
alter table public.conferencia_canaco add constraint conferencia_estado_check
  check (estado in ('registrado', 'asistio', 'cancelado'));

-- Una persona, un lugar. Si alguien se registra dos veces, el
-- formulario le avisa en vez de quitarle el lugar a otro.
create unique index if not exists idx_conferencia_correo
  on public.conferencia_canaco (lower(correo));
create unique index if not exists idx_conferencia_matricula
  on public.conferencia_canaco (lower(matricula))
  where matricula <> '';

comment on table public.conferencia_canaco is
  'Registro de los 25 lugares de IBERO Tijuana para las Conferencias Empresariales de CANACO (22-oct-2026).';


-- ── 2. El cupo ─────────────────────────────────────────────
--  El número de lugares vive aquí y en config.js. Si cambia, hay
--  que cambiarlo en los dos: el de aquí es el que manda y el de
--  config.js es el que se enseña.

create or replace function public.conferencia_cupo()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  cupo  constant integer := 25;
  usados integer;
begin
  -- El candado se suelta solo al terminar la transacción. Mientras,
  -- cualquier otro registro espera aquí: por eso no se puede colar
  -- un lugar 26 aunque lleguen dos al mismo tiempo.
  perform pg_advisory_xact_lock(hashtext('conferencia_canaco'));

  select count(*) into usados
    from public.conferencia_canaco
   where estado <> 'cancelado';

  if usados >= cupo then
    raise exception 'CUPO_LLENO' using errcode = 'check_violation';
  end if;

  new.lugar := usados + 1;
  return new;
end
$$;

drop trigger if exists conferencia_cupo_trg on public.conferencia_canaco;
create trigger conferencia_cupo_trg
  before insert on public.conferencia_canaco
  for each row execute function public.conferencia_cupo();


-- ── 3. Cuántos lugares quedan, sin enseñar la lista ────────
--  El formulario lo tiene que saber ANTES de que alguien llene
--  nada, y quien lo abre no tiene cuenta. Esta función contesta
--  sólo un número: no deja ver quién se registró.

create or replace function public.conferencia_lugares()
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select greatest(0, 25 - (select count(*)::integer
                             from public.conferencia_canaco
                            where estado <> 'cancelado'))
$$;

revoke all on function public.conferencia_lugares() from public;
grant execute on function public.conferencia_lugares() to anon, authenticated;


-- ── 4. Quién puede tocar qué ───────────────────────────────

alter table public.conferencia_canaco enable row level security;

drop policy if exists "registrarse"    on public.conferencia_canaco;
drop policy if exists "ver registros"  on public.conferencia_canaco;
drop policy if exists "atender"        on public.conferencia_canaco;
drop policy if exists "quitar"         on public.conferencia_canaco;

-- Registrarse lo puede hacer cualquiera. Lo que no puede es dejar
-- cualquier cosa: entra como 'registrado', sin nota, con folio bien
-- formado y con tamaños que no sirvan para llenar la base.
create policy "registrarse" on public.conferencia_canaco
  for insert to anon, authenticated
  with check (
    estado = 'registrado'
    and nota = ''
    and folio ~ '^[A-Z0-9]{8}$'
    and char_length(nombre)    between 5 and 120
    and char_length(matricula) between 4 and 20
    and char_length(carrera)   between 1 and 80
    and semestre between 1 and 12
    and char_length(correo)    between 6 and 120
    and telefono ~ '^[0-9]{10}$'
  );

create policy "ver registros" on public.conferencia_canaco
  for select to authenticated using (true);

create policy "atender" on public.conferencia_canaco
  for update to authenticated using (true) with check (true);

create policy "quitar" on public.conferencia_canaco
  for delete to authenticated using (true);

grant select, insert, update, delete on public.conferencia_canaco to authenticated;
grant insert on public.conferencia_canaco to anon;


-- ── 5. Comprobar ───────────────────────────────────────────
select 'tabla' as que,
       case when to_regclass('public.conferencia_canaco') is not null
            then 'sí' else 'FALTA' end as estado
union all
select 'políticas', count(*)::text || ' de 4'
  from pg_policies where tablename = 'conferencia_canaco'
union all
select 'disparador del cupo',
       case when exists (select 1 from pg_trigger
                          where tgname = 'conferencia_cupo_trg')
            then 'sí' else 'FALTA' end
union all
select 'lugares libres ahora', public.conferencia_lugares()::text;
