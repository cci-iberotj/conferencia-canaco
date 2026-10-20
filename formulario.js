/* ═══════════════════════════════════════════════════════════
   Conferencias CANACO · el formulario

   Lo que hay que entender de esta pantalla:

   EL CUPO NO SE DECIDE AQUÍ. El navegador enseña cuántos lugares
   quedan, pero quien reparte los 25 es la base: un disparador toma
   un candado, cuenta y asigna el número de lugar. Si dos personas
   mandan el último al mismo tiempo, una recibe su lugar y la otra
   recibe CUPO_LLENO. Por eso el contador de aquí es informativo y
   el error de allá es el que manda.
   ═══════════════════════════════════════════════════════════ */
'use strict';

const $ = s => document.querySelector(s);
const REST = CONFIG.supabase.url + '/rest/v1/';
const CAB = {
  apikey: CONFIG.supabase.llave,
  Authorization: 'Bearer ' + CONFIG.supabase.llave,
  'Content-Type': 'application/json',
};

/* Sin I, O, 0 ni 1: el folio se dicta por teléfono y esos cuatro
   se confunden siempre. */
const folioNuevo = () => Array.from(
  { length: 8 },
  () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
).join('');

/* ───────── pintar lo que dice config ───────── */
function pintarEvento(){
  const e = CONFIG.evento;
  $('#invita').textContent = e.invita;
  $('#titulo').innerHTML = 'Conferencias <em>Empresariales</em>';
  $('#con').textContent = e.con;
  $('#cuando').textContent = e.fechaDicha;
  $('#hora').textContent = e.horaDicha;
  $('#donde').textContent = e.lugar;
  const av = $('#aviso');
  if (e.aviso) av.textContent = e.aviso; else av.remove();

  $('#pie').innerHTML =
    '¿Algo no jala? Escríbenos a <a href="mailto:' + CONFIG.contacto.correo + '">' +
    CONFIG.contacto.correo + '</a><br>' + CONFIG.contacto.area + ' · IBERO Tijuana';

  const sem = $('#semestre');
  sem.innerHTML = '<option value="">—</option>';
  for (let i = 1; i <= 12; i++){
    sem.insertAdjacentHTML('beforeend', '<option value="' + i + '">' + i + '°</option>');
  }
  const car = $('#carrera');
  car.innerHTML = '<option value="">Elige una</option>' +
    CONFIG.carreras.map(c => '<option>' + c + '</option>').join('');

  if (CONFIG.modoPrueba){
    const t = document.createElement('div');
    t.className = 'prueba';
    t.textContent = 'MODO PRUEBA';
    document.body.appendChild(t);
  }
}

/* ¿Ya pasó la hora? Se compara con el reloj de quien abre la
   página, que para esto alcanza: no hay que ser exactos al minuto,
   hay que no seguir abiertos al día siguiente. */
function yaCerro(){
  const c = CONFIG.evento.cierra;
  return !!c && new Date() >= new Date(c);
}

function yaPaso(){
  const e = CONFIG.evento;
  $('#forma').hidden = true;
  $('#lugares').hidden = true;
  $('#final').innerHTML =
    '<div class="final no">' +
      '<div class="sello"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/>' +
        '<path d="M12 7.5V12l3 2"/></svg></div>' +
      '<h2>El registro ya cerró</h2>' +
      '<p>Las Conferencias Empresariales fueron el ' + e.fechaDicha + '.</p>' +
      '<p>Lo que venga después lo anunciamos en las redes de la IBERO.</p>' +
    '</div>';
}

/* ───────── cuántos lugares quedan ───────── */
async function lugaresLibres(){
  const r = await fetch(REST + 'rpc/' + CONFIG.supabase.contador,
                        { method: 'POST', headers: CAB, body: '{}' });
  if (!r.ok) throw new Error('No se pudo leer el cupo');
  return Number(await r.json());
}

function pintarLugares(n){
  const caja = $('#lugares');
  const total = CONFIG.cupo;
  $('#quedan').textContent = n;
  $('#barra').style.width = Math.round((total - n) / total * 100) + '%';
  caja.classList.toggle('pocos', n > 0 && n <= 5);
  caja.classList.toggle('lleno', n === 0);

  if (n === 0){
    $('#quedan').textContent = '0';
    $('#quedanTexto').textContent = 'Ya no quedan lugares';
    $('#quedanPie').textContent = 'Se llenaron los ' + total + '.';
  } else {
    $('#quedanTexto').textContent =
      n === 1 ? 'Queda 1 lugar' : 'Quedan ' + n + ' lugares';
    $('#quedanPie').textContent = 'de ' + total + ' para estudiantes de la IBERO';
  }
}

/* ───────── revisar lo que escribieron ───────── */
const soloDigitos = s => (s || '').replace(/\D/g, '');

function revisar(){
  const d = {
    nombre:    $('#nombre').value.trim().replace(/\s+/g, ' '),
    matricula: $('#matricula').value.trim(),
    carrera:   $('#carrera').value,
    semestre:  Number($('#semestre').value || 0),
    correo:    $('#correo').value.trim(),
    telefono:  soloDigitos($('#telefono').value),
  };
  const mal = [];
  if (d.nombre.length < 5 || !d.nombre.includes(' ')) mal.push('c_nombre');
  if (d.matricula.length < 4) mal.push('c_matricula');
  if (!d.carrera) mal.push('c_carrera');
  if (!(d.semestre >= 1 && d.semestre <= 12)) mal.push('c_semestre');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.correo)) mal.push('c_correo');
  if (d.telefono.length !== 10) mal.push('c_telefono');
  if (!$('#acepto').checked) mal.push('c_acepto');

  ['c_nombre','c_matricula','c_carrera','c_semestre','c_correo','c_telefono']
    .forEach(id => $('#' + id).classList.toggle('mal', mal.includes(id)));
  $('#c_acepto').style.color = mal.includes('c_acepto') ? 'var(--rojo)' : '';

  return { datos: d, mal };
}

/* ───────── pantallas finales ───────── */
function yaQuedaste(d, lugar, folio){
  const e = CONFIG.evento;
  $('#forma').hidden = true;
  $('#lugares').hidden = true;
  $('#final').innerHTML =
    '<div class="final">' +
      '<div class="sello"><svg viewBox="0 0 24 24"><path d="M4 12.5l5.5 5.5L20 7"/></svg></div>' +
      '<h2>Tu lugar está apartado</h2>' +
      /* horaDicha ya trae su punto ('4:00 p.m.'), no se le pone otro. */
      '<p>Nos vemos en ' + e.lugar + ', ' + e.fechaDicha + ' a las ' + e.horaDicha +
        (/[.!?]$/.test(e.horaDicha) ? '' : '.') + '</p>' +
      '<div class="tuLugar">' + lugar + '</div>' +
      '<p>eres el lugar ' + lugar + ' de ' + CONFIG.cupo + '</p>' +
      '<div class="folio">' + folio + '</div>' +
      '<div class="recuerda">' +
        '<div><b>Llega 15 minutos antes.</b> El cupo es cerrado y el registro se ' +
          'revisa en la entrada.</div>' +
        '<div><b>Lleva tu credencial</b> de la IBERO.</div>' +
        '<div><b>Si ya no puedes ir, avísanos.</b> Hay quien se queda sin lugar ' +
          'y tu espacio le sirve: ' + CONFIG.contacto.correo + '</div>' +
      '</div>' +
    '</div>';
  $('#final').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function yaNoHay(){
  const e = CONFIG.evento;
  $('#forma').hidden = true;
  $('#final').innerHTML =
    '<div class="final no">' +
      '<div class="sello"><svg viewBox="0 0 24 24"><path d="M12 7v7M12 17.5v.5"/>' +
        '<circle cx="12" cy="12" r="9"/></svg></div>' +
      '<h2>Ya se llenó</h2>' +
      '<p>Los ' + CONFIG.cupo + ' lugares para la IBERO ya están tomados. ' +
        'Gracias por querer ir.</p>' +
      '<p>Si se libera alguno te avisamos por aquí mismo, y lo que venga ' +
        'después lo anunciamos en las redes de la IBERO.</p>' +
    '</div>';
}

/* ───────── mandar ───────── */
async function mandar(ev){
  ev.preventDefault();
  const boton = $('#enviar');
  const falla = $('#falla');
  falla.classList.remove('visible');

  const { datos, mal } = revisar();
  if (mal.length && !CONFIG.modoPrueba){
    falla.textContent = 'Falta algo arriba. Revisa lo marcado en rojo.';
    falla.classList.add('visible');
    $('.' + 'campo.mal') && $('.campo.mal').scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Apartando…';

  if (CONFIG.modoPrueba){
    yaQuedaste(datos, 7, 'PRUEBA12');
    return;
  }

  /* Se registra por la funcion y no por la tabla: asi el alumno
     recibe SU numero de lugar sin que nadie pueda leer la lista.
     Ver supabase/registrar.sql. */
  const folio = folioNuevo();
  const r = await fetch(REST + 'rpc/conferencia_registrar', {
    method: 'POST',
    headers: CAB,
    body: JSON.stringify({
      p_folio: folio, p_nombre: datos.nombre, p_matricula: datos.matricula,
      p_carrera: datos.carrera, p_semestre: datos.semestre,
      p_correo: datos.correo, p_telefono: datos.telefono,
    }),
  }).catch(() => null);

  if (r && r.ok){
    const d = await r.json().catch(() => ({}));
    yaQuedaste(datos, (d && d.lugar) || '—', folio);
    return;
  }

  const t = r ? await r.text() : '';
  boton.disabled = false;
  boton.textContent = 'Apartar mi lugar';

  /* Los tres finales que de verdad pasan. El resto cae en el genérico. */
  if (t.includes('CUPO_LLENO')){
    pintarLugares(0);
    $('#lugares').hidden = false;
    yaNoHay();
    return;
  }
  if (t.includes('idx_conferencia_correo') || t.includes('idx_conferencia_matricula')){
    falla.textContent = 'Ya hay un registro con ese correo o esa matrícula. ' +
      'Si crees que es un error, escríbenos a ' + CONFIG.contacto.correo + '.';
  } else if (!r){
    falla.textContent = 'No se pudo conectar. Revisa tu internet y vuelve a intentar.';
  } else {
    falla.textContent = 'No se pudo guardar tu registro. Inténtalo otra vez; si sigue ' +
      'igual escríbenos a ' + CONFIG.contacto.correo + '.';
  }
  falla.classList.add('visible');
}

/* ───────── arranque ───────── */
(async function(){
  pintarEvento();
  $('#forma').addEventListener('submit', mandar);
  $('#telefono').addEventListener('input', e => {
    e.target.value = soloDigitos(e.target.value).slice(0, 10);
  });

  if (yaCerro() && !CONFIG.modoPrueba) return yaPaso();

  try {
    const n = await lugaresLibres();
    pintarLugares(n);
    if (n === 0 && !CONFIG.modoPrueba) yaNoHay();
    else $('#forma').hidden = false;
  } catch (e){
    /* Si no se puede leer el cupo, NO se cierra el formulario: es
       peor dejar fuera a quien sí alcanzaba. Se deja pasar y la
       base decide al guardar. */
    $('#quedan').textContent = '·';
    $('#quedanTexto').textContent = 'Cupo limitado a ' + CONFIG.cupo + ' lugares';
    $('#quedanPie').textContent = 'No pudimos leer cuántos quedan; inténtalo y te decimos.';
    $('#forma').hidden = false;
  }
})();
