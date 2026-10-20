/* ═══════════════════════════════════════════════════════════
   Conferencias Empresariales CANACO · registro
   Comunicación y Crecimiento Institucional · IBERO Tijuana

   TODO LO QUE SE AJUSTA VIVE AQUÍ: el evento, el cupo, los textos
   y las carreras. El formulario (index.html) y la lista del equipo
   (lista.html) leen este archivo; no hay que tocar nada más.
   ═══════════════════════════════════════════════════════════ */
'use strict';

const CONFIG = {

  /* ── Modo prueba ───────────────────────────────────────
     true  → se puede llenar y enviar sin guardar nada, y sale una
             etiqueta «MODO PRUEBA» abajo para que no se publique
             así por descuido.
     false → el registro de verdad. */
  modoPrueba: false,

  /* ── El evento ─────────────────────────────────────────
     Si cambia la hora o la sede, se cambia aquí y se refleja en
     el formulario, en la confirmación y en la lista. */
  evento: {
    invita:   'CANACO Tijuana',
    titulo:   'Conferencias Empresariales',
    con:      'Ninfa Salinas Sada',
    fecha:    '2026-10-22',
    fechaDicha: 'jueves 22 de octubre',
    hora:     '16:00',
    horaDicha: '4:00 p.m.',
    lugar:    'CANACO Tijuana',
    /* Se enseña como aviso arriba del formulario. Vacío = no sale. */
    aviso:    'El evento es fuera del campus, en las instalaciones de CANACO Tijuana. El traslado corre por tu cuenta.',

    /* Cuándo deja de aceptar registros. Al llegar esta hora el
       formulario se cierra solo, aunque queden lugares: si no, el
       lunes siguiente seguiría apuntando gente a algo que ya pasó.
       Vacío = no se cierra por fecha, sólo cuando se llena. */
    cierra:   '2026-10-22T16:00',
  },

  /* ── El cupo ───────────────────────────────────────────
     OJO: este número es el que se ENSEÑA. El que de verdad manda
     está en la base, dentro de la función conferencia_cupo()
     (supabase/conferencia.sql). Si cambia el cupo hay que
     cambiarlo EN LOS DOS, y el de la base es el que decide. */
  cupo: 25,

  /* ── Dónde se guardan los registros ────────────────────
     La base de LA PIZARRA, tabla `conferencia_canaco`. La llave
     publicable está hecha para vivir en el navegador: lo que
     protege los datos son las reglas de la tabla —cualquiera se
     registra, pero la lista sólo se lee con cuenta—. */
  supabase: {
    url:   'https://wrezcukptrtmnhnlxmao.supabase.co',
    llave: 'sb_publishable_XTkkarWw-P3Ls31g5ZDTOA_ZghkWshN',
    tabla: 'conferencia_canaco',
    /* La función que dice cuántos lugares quedan sin enseñar
       la lista. */
    contador: 'conferencia_lugares',
  },

  /* ── A quién le escriben si algo falla ─────────────────*/
  contacto: {
    area:    'Comunicación y Crecimiento Institucional',
    correo:  'comunicacion@tijuana.ibero.mx',
  },

  carreras: [
    'Licenciatura en Administración de Empresas',
    'Licenciatura en Administración de Negocios Internacionales',
    'Licenciatura en Arquitectura',
    'Licenciatura en Comunicación',
    'Licenciatura en Derecho',
    'Licenciatura en Enfermería',
    'Licenciatura en Medicina',
    'Licenciatura en Nutrición',
    'Licenciatura en Psicología',
    'Ingeniería en Mecatrónica',
    'Ingeniería Industrial en Manufactura Inteligente',
    'Posgrado',
    'Otra',
  ],
};
