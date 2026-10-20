# Conferencias Empresariales CANACO · registro

CANACO Tijuana invitó a **25 estudiantes de la IBERO** a las Conferencias
Empresariales con Ninfa Salinas Sada, el **jueves 22 de octubre de 2026 a las
4:00 p.m.** en sus instalaciones. Esto es por dónde se apuntan.

- **Formulario:** <https://cci-iberotj.github.io/conferencia-canaco/>
- **La lista, para el equipo:** <https://cci-iberotj.github.io/conferencia-canaco/lista.html>

Comunicación y Crecimiento Institucional · IBERO Tijuana

---

## Lo que hay que saber antes de tocar nada

### El cupo se cuida en la base, no en el navegador

Son 25 lugares y punto. Contar en el navegador no sirve: dos personas pueden
pedir el último al mismo tiempo y las dos verían «queda 1».

Por eso el cupo vive en un **disparador** de Postgres
(`supabase/conferencia.sql`). Antes de contar toma un candado, de modo que los
registros se forman en fila; el que llega cuando ya hay 25 recibe `CUPO_LLENO`
y el formulario le enseña la pantalla de «ya se llenó».

El disparador además le pone su **número de lugar** a cada quien, así que el
alumno ve «eres el 7 de 25» y la lista sale en el orden en que llegaron.

**Está probado:** se metieron 26 registros con la llave pública y entraron 25.

### El registro pasa por una función, no por la tabla

El alumno necesita ver su número de lugar al terminar. Para que PostgREST
devuelva el renglón recién metido hay que pedirle `return=representation`, y
eso obliga a **leer** — justo lo que `anon` no puede hacer, ni debe.

La solución es `conferencia_registrar()` (`supabase/registrar.sql`): corre con
los permisos del dueño, mete el renglón y devuelve **sólo** el lugar y el
folio. La lista sigue cerrada a quien no tenga cuenta.

Como la función se salta las reglas de la tabla, **las comprobaciones se
repiten dentro**. Si cambias una, cámbiala en los dos lados.

### Si cambia el cupo, son dos lugares

`cupo` en `config.js` es el que se **enseña**. El que **manda** está dentro de
`conferencia_cupo()` y de `conferencia_lugares()`, en la base. Cámbialo en los
dos; el de la base es el que decide.

---

## Los archivos

| | |
|---|---|
| `config.js` | **Todo lo que se ajusta**: el evento, el cupo, los textos, las carreras. |
| `index.html` + `formulario.js` + `estilos.css` | El formulario. |
| `lista.html` | La lista del equipo: entra con cuenta de LA PIZARRA. |
| `supabase/conferencia.sql` | La tabla, el disparador del cupo y los permisos. |
| `supabase/registrar.sql` | La función que registra y devuelve el lugar. |
| `supabase/correr.py` | Corre SQL en la base de LA PIZARRA. |
| `empujar.py` | Publica a GitHub Pages por la API. |
| `servidor.py` | Para verlo en esta computadora antes de publicar. |

## Cómo se trabaja

```
python servidor.py          # verlo aquí
python empujar.py           # publicarlo
python supabase/correr.py conferencia.sql
python supabase/correr.py "select * from conferencia_canaco order by lugar"
```

## La lista para CANACO

En `lista.html` hay un botón **«Copiar para CANACO»** que deja en el
portapapeles los nombres numerados, listos para pegar en el correo. El de
**CSV** baja todo con matrícula, carrera y contacto, con BOM para que Excel en
Windows abra los acentos bien.

El día del evento, la columna **«Llegó»** sirve para palomear en la puerta.

## Una trampa de CSS que ya costó

`form{display:grid}` le gana por especificidad al `[hidden]` del navegador, así
que el formulario se quedaba visible **debajo** de la confirmación. Por eso
`estilos.css` lleva `[hidden]{display:none !important}`.
