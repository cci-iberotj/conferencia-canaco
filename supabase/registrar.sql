-- ═══════════════════════════════════════════════════════════
--  Conferencias CANACO · la función que registra
--
--      python supabase/correr.py registrar.sql
--
--  POR QUÉ HACE FALTA
--  El alumno necesita ver SU NÚMERO DE LUGAR al terminar («eres el
--  7 de 25»). Para que PostgREST devuelva el renglón recién metido
--  hay que pedirle `return=representation`, y eso obliga a LEER —y
--  leer la lista es justo lo que anon no puede hacer, ni debe—.
--
--  Así que el registro pasa por aquí: la función corre con los
--  permisos del dueño, mete el renglón y devuelve SÓLO dos cosas,
--  el lugar y el folio. La lista sigue cerrada.
--
--  Como la función se salta las reglas de la tabla, las
--  comprobaciones se repiten DENTRO. Son las mismas que en la
--  política «registrarse» de conferencia.sql.
-- ═══════════════════════════════════════════════════════════

create or replace function public.conferencia_registrar(
  p_folio     text,
  p_nombre    text,
  p_matricula text,
  p_carrera   text,
  p_semestre  integer,
  p_correo    text,
  p_telefono  text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_lugar integer;
begin
  -- Las mismas reglas que la política de la tabla.
  if p_folio !~ '^[A-Z0-9]{8}$'
     or char_length(p_nombre)    not between 5 and 120
     or char_length(p_matricula) not between 4 and 20
     or char_length(p_carrera)   not between 1 and 80
     or p_semestre not between 1 and 12
     or char_length(p_correo)    not between 6 and 120
     or p_telefono !~ '^[0-9]{10}$'
  then
    raise exception 'DATOS_INVALIDOS' using errcode = 'check_violation';
  end if;

  -- El disparador conferencia_cupo_trg es el que cuida los 25 y el
  -- que pone el número de lugar. Aquí sólo se recoge.
  insert into public.conferencia_canaco
    (folio, nombre, matricula, carrera, semestre, correo, telefono)
  values
    (p_folio, btrim(p_nombre), btrim(p_matricula), p_carrera,
     p_semestre, lower(btrim(p_correo)), p_telefono)
  returning lugar into v_lugar;

  return jsonb_build_object('lugar', v_lugar, 'folio', p_folio);
end
$$;

revoke all on function public.conferencia_registrar(text,text,text,text,integer,text,text) from public;
grant execute on function public.conferencia_registrar(text,text,text,text,integer,text,text)
  to anon, authenticated;

select 'función conferencia_registrar' as que,
       case when exists (select 1 from pg_proc where proname = 'conferencia_registrar')
            then 'sí' else 'FALTA' end as estado;
