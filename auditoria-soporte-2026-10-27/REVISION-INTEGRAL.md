# Revisión integral del sistema de soporte

**Fecha:** 27 de octubre de 2026 · **Objetivo:** que ejecutivos, técnicos y administradores puedan trabajar con comodidad y confiar en los registros.

## Diagnóstico

El sistema tiene una base amplia: tickets, inventario, colaboradores, compras, ingresos y bajas de equipos, visitas, conocimiento, renovación y reportes de gestión. Hay trabajo útil y reutilizable, especialmente en los cálculos y en la separación de datos desconocidos frente a valores reales.

**Todavía no lo consideraría completamente funcional ni listo para ampliar su uso a todos los ejecutivos.** Las prioridades son proteger accesos y credenciales, asegurar que lo registrado se conserve y se comparta entre equipos, y completar funciones que hoy solo muestran una confirmación visual. Después conviene simplificar la experiencia del ejecutivo.

Esta es una revisión del código y de recorridos locales. No es una certificación de producción: las políticas y el esquema completo de Supabase, el despliegue, los respaldos remotos y Microsoft 365 necesitan una validación adicional en su entorno.

## Alcance y comprobaciones

Se revisaron la estructura y los flujos de `index.html`, `script.js`, `style.css`, los diez archivos JavaScript de la raíz en conjunto, los doce archivos de pruebas, la migración disponible y la API FastAPI con su configuración Docker. Las presentaciones, el informe gerencial y la documentación de fotos se consideraron material complementario; no se verificaron contra datos productivos.

| Comprobación | Resultado | Límite |
|---|---|---|
| Pruebas existentes: `node --test tests/*.test.js` | **75 aprobadas, 0 fallidas** | Predominan cálculos y funciones extraídas con dependencias simuladas; no cubren toda la aplicación |
| Sintaxis de los 10 archivos JS de la raíz | Correcta | No demuestra comportamiento funcional |
| Sintaxis Python de la API | Correcta | No se inició Docker ni la API real |
| Referencias locales de HTML | Sin archivos faltantes detectados | No verifica enlaces remotos ni imágenes generadas dinámicamente |
| IDs y etiquetas `for` del HTML | Sin IDs duplicados ni referencias `for` rotas | Hay controles sin etiqueta accesible |
| Navegación de técnico en escritorio, 1440 px | 17 accesos abrieron su sección | Smoke test con registros sintéticos |
| Navegación móvil, 390 px | 7 secciones abrieron; sin desbordamiento horizontal global | Navegación interna activada por script; no es prueba exhaustiva táctil |
| Ocho escenarios de navegador | Sin excepciones JavaScript no controladas | Se bloquearon CDNs y servicios externos; los gráficos e importadores externos no se validaron en ejecución |
| Cuatro verificaciones adicionales de lógica | Cuatro defectos reproducidos | Nube simulada y almacenamiento aislado |

Las capturas de esta carpeta muestran deliberadamente la aplicación sin las dependencias CDN: algunos iconos y gráficos no aparecen. No deben usarse para juzgar el acabado visual con todas las dependencias cargadas.

No se modificaron los archivos del producto ni los cambios que ya existían. No se enviaron tickets, adjuntos, mensajes, usuarios ni cambios a servicios reales. Los ejemplos de esta auditoría son ficticios.

## Lo que está bien encaminado

- Los reportes distinguen ausencia de medición y costos desconocidos de cero real. Evitan presentar disponibilidad y satisfacción inventadas.
- Los cálculos principales tienen pruebas sobre fechas, período de Chile, empresas, SLA, renovación, presupuestos y conciliación de costos.
- Tickets, inventario y compras tienen lectura paginada de la nube; se conservan registros locales únicos en varios recorridos.
- Hay búsqueda, paginación, navegación móvil, tema claro/oscuro, accesos rápidos y exportaciones.
- Los módulos más recientes usan escape de texto, trazabilidad de fuentes y respaldos parciales. Esa disciplina debe extenderse al código principal.

## Hallazgos y correcciones

**P0:** atender inmediatamente. **P1:** corregir antes de ampliar el uso. **P2:** siguiente etapa de funcionalidad y comodidad. Las ubicaciones corresponden al código revisado en esta fecha.

### H01 · P0 · Credenciales y contraseñas en el navegador

**Evidencia:** [script.js:134](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:134>), [script.js:7238](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7238>), [script.js:9871](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:9871>), [script.js:10310](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:10310>), [script.js:9010](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:9010>), [script.js:9043](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:9043>).

Hay contraseñas de administradores, PIN de respaldo y un `clientSecret` de Microsoft Graph incluidos en JavaScript. La función de “bóveda” guarda y recupera `password_usuario` como texto legible; también puede almacenarlo en el navegador. No se reproducen sus valores en este informe.

**Consecuencia:** una persona que recibe el código puede leer esos valores. Ocultar un campo o pedir otro PIN no protege un secreto ya distribuido.

**Acción:** tratar los secretos incluidos como expuestos, rotar/revocar los que sigan vigentes y reemplazar este diseño. La rotación debe hacerse en los sistemas que emiten las credenciales; borrarlas del archivo no invalida copias previas. Usar autenticación gestionada y mantener secretos de aplicaciones en un servicio de servidor. Si se requiere una bóveda operativa, usar una solución con acceso individual, cifrado y auditoría; evitar mantener contraseñas de colaboradores en el directorio del portal.

La clave **publishable** de Supabase está diseñada para aparecer en el cliente: su presencia no constituye por sí sola una filtración. La protección requiere identidad del usuario y políticas de acceso adecuadas. [Documentación de claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

### H02 · P1 · La identidad y el rol se confían al almacenamiento local

**Evidencia:** [script.js:7000](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7000>), [script.js:7030](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7030>), [script.js:7238](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7238>), [script.js:8105](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:8105>), [script.js:9886](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:9886>), [script.js:11770](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:11770>).

La sesión se restaura desde `localStorage` sin una comprobación de identidad contra un servicio de autenticación. Un correo que contenga ciertos nombres activa el rol de administrador. Se reprodujo con un correo ficticio y sin contraseña: la aplicación ocultó el login y guardó el rol `admin`. Además, `authenticateUser(..., requiredRole)` no aplica `requiredRole`; una cuenta técnica sintética fue aceptada al solicitar `admin`.

Los PIN también se comparan en el cliente y existen alternativas compartidas. El login visible ofrece Técnico y Administrador, pero no un recorrido claramente definido para el ejecutivo.

**Acción:** login individual mediante Microsoft Entra ID o Supabase Auth, roles administrados desde servidor, cierre/revocación de sesión y controles por usuario y empresa. Nunca deducir permisos desde fragmentos del correo. El servidor debe rechazar operaciones prohibidas aunque alguien cambie la interfaz.

**Límite:** se comprobó la suplantación de la interfaz; no se comprobó acceso no autorizado a la base productiva. No hay políticas RLS completas en este repositorio para auditarlas. Supabase recomienda aplicar seguridad por fila en tablas expuestas. [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

### H03 · P1 · Un estado de ticket puede ejecutar HTML

**Evidencia:** [script.js:1729](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:1729>), dentro de la construcción de filas con `tr.innerHTML`.

El texto del estado se inserta sin escapar. En una prueba con un ticket sintético, un valor de estado con HTML ejecutó un marcador inocuo en la página. Existen otros puntos que merecen revisión, como nombres de archivos añadidos con `innerHTML` y fragmentos del directorio.

**Acción:** insertar texto con `textContent`, escapar donde se construya HTML y validar estados contra un catálogo cerrado, tanto en servidor como en cliente. Revisar sistemáticamente los puntos de inserción HTML. La posibilidad de introducir ese valor remotamente depende de las restricciones reales de la base; la interpretación peligrosa en el navegador sí quedó confirmada.

### H04 · P1 · El guardado local no garantiza sincronización ni conservación

**Evidencia:** [script.js:703](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:703>), [script.js:843](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:843>), [script.js:862](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:862>), [script.js:3802](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:3802>), [script.js:3869](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:3869>), [script.js:3896](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:3896>), [script.js:10802](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:10802>).

Se reprodujeron estos problemas con una nube simulada:

- Una edición de inventario guardada sin conexión volvió al valor antiguo de la nube al consultar de nuevo. La lectura remota sobrescribe el respaldo local sin distinguir campos pendientes.
- `deleteEquipo` devuelve éxito aunque Supabase responda con un error; la fila remota puede reaparecer.
- Una respuesta local pendiente desaparece de la conversación si la siguiente consulta remota tiene éxito y devuelve una lista vacía. No se combinan las respuestas locales con las remotas.
- Crear un ticket sin conexión muestra “¡Ticket creado con éxito!” sin advertir que solo quedó en ese navegador. No hay una cola automática general de reenvío para tickets y respuestas.

**Acción:** una cola persistente de operaciones pendientes, identificadores estables, reintentos seguros y conciliación por versión. Mostrar **Guardado en la nube / Pendiente de sincronizar / Error**. No borrar la operación pendiente hasta confirmar la escritura. Diferenciar borrado local y remoto. La confirmación visible debe reflejar el resultado real.

### H05 · P1 · Consultar el directorio también puede escribir y restaurar usuarios

**Evidencia:** [script.js:167](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:167>), [script.js:199](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:199>), [script.js:251](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:251>), [script.js:12369](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:12369>).

La carga en segundo plano mezcla el directorio local con la nube y sube automáticamente los correos que no encuentra. Se reprodujo un `upsert` de un registro local antiguo mientras el login todavía estaba visible. Un navegador con una copia anterior puede proponer restaurar colaboradores que se eliminaron en otro equipo. Esa consulta tampoco pagina el directorio remoto, a diferencia de otros módulos.

**Acción:** separar lectura y escritura; iniciar sincronización con identidad y permisos válidos; retirar la carga automática del directorio incluido en el código productivo. Usar bajas/inactivación central y marcas de eliminación para impedir resurrecciones. Paginar y resolver conflictos explícitamente.

**Límite:** se comprobó el intento de escritura con el cliente simulado; su aceptación en producción depende de RLS y permisos remotos.

### H06 · P1 · Los adjuntos se seleccionan, pero no se conservan

**Evidencia:** [index.html:650](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:650>), [script.js:2510](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:2510>), [script.js:703](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:703>).

La zona de archivos actualiza un texto con el nombre o la cantidad seleccionada. No conserva una colección de adjuntos para el envío, no sube el contenido y el ticket no guarda su referencia. Se seleccionó un archivo de prueba, se creó el ticket y no quedó ninguna referencia al archivo.

**Consecuencia:** el ejecutivo cree haber enviado una captura o una aprobación y soporte no la recibe.

**Acción:** almacenamiento privado de adjuntos vinculado al ticket, límites de tamaño/tipo, progreso real, manejo de errores y acceso autorizado. Poder pegar una captura desde el portapapeles sería una mejora posterior útil.

### H07 · P1 · Se crean tickets sin datos obligatorios del afectado

**Evidencia:** [index.html:707](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:707>), [index.html:715](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:715>), [index.html:719](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:719>), [script.js:2417](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:2417>).

El paso 1 valida algunos campos, pero del paso 2 se avanza directamente a revisión. El botón de envío es `type="button"`, por lo que las restricciones HTML `required` no detienen ese recorrido. En el navegador se creó un ticket con nombre, RUT y correo vacíos.

**Acción:** validar cada paso y repetir validaciones en servidor; señalar el error junto al campo y enfocar el primero inválido. Para ejecutivos autenticados, obtener identidad y empresa de su perfil. Evaluar si el RUT realmente es necesario para solicitar soporte; no hacerlo obligatorio por costumbre.

### H08 · P1 · Estados incompatibles entre creación, filtros e indicadores

**Evidencia:** [index.html:600](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:600>), [index.html:602](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:602>), [script.js:899](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:899>), [script.js:1529](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:1529>), [script.js:1574](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:1574>), [script.js:1628](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:1628>).

Crear usa `en_progreso` y `pendiente`; otros recorridos usan `en progreso` y `en espera`. El filtro “En progreso” no mostró un ticket sintético con el valor que genera el formulario. La toma de fechas y varias vistas también usan comparaciones distintas.

**Acción:** un solo catálogo de valores internos, etiquetas de presentación separadas, normalización de históricos y restricciones de base de datos. Definir transiciones: abierto → asignado/en atención → esperando usuario o repuesto → resuelto → cerrado, con reapertura trazable.

### H09 · P1 · Parte del trabajo compartido existe solo en un navegador

**Evidencia:** [script.js:5690](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:5690>), [script.js:5774](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:5774>), [script.js:5919](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:5919>), [script.js:6401](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:6401>), [support-insights.js:14](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/support-insights.js:14>), [ti-evolution.js:9](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/ti-evolution.js:9>), [ti-operations.js:46](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/ti-operations.js:46>), [notebook-renewal.js:319](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/notebook-renewal.js:319>).

Movimientos, ingresos y bajas de equipos, intervenciones, cotizaciones, vínculos compra-equipo, sesiones de trabajo, proyectos y criterios de renovación tienen almacenamiento local. Hay respaldos parciales, pero otro computador no obtiene automáticamente esos registros ni las mismas políticas. Inventario puede mostrar un cambio remoto sin que el otro técnico vea su proceso de entrega o devolución.

**Acción:** decidir qué datos son corporativos y centralizarlos con autor, fechas, empresa, permisos e historial. Mantener localmente solo preferencias personales o copias pendientes de sincronizar. Conservar exportaciones como respaldo complementario.

### H10 · P1 · Microsoft Graph no tiene una integración apta para navegador

**Evidencia:** [script.js:10310](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:10310>), [script.js:10324](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:10324>), [script.js:10020](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:10020>), [script.js:10463](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:10463>).

Se intenta obtener un token con `client_credentials` y un secreto desde la página. Microsoft impide usar credenciales de cliente con un encabezado de origen de navegador. La consulta de usuarios solo lee la primera página; no recorre `@odata.nextLink`. Guarda una caché de Graph, mientras el panel se construye desde el directorio local. Guardar la configuración muestra confirmación, pero ese recorrido no comprueba una conexión exitosa.

**Acción:** elegir entre acceso delegado con MSAL y autorización con PKCE, o sincronización de aplicación desde servidor. Mantener secretos en servidor, paginar, normalizar los datos y mostrar última sincronización exitosa y antigüedad de la caché. [Flujo admitido por Microsoft para aplicaciones web](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow).

### H11 · P2 · SLA calculable, pero sin política aplicada al crear tickets

**Evidencia:** [support-insights.js:37](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/support-insights.js:37>), [script.js:703](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:703>), [index.html:2706](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:2706>).

Los cálculos de SLA comprueban fechas explícitas; eso está bien. Sin embargo, la creación normal no asigna un vencimiento y no hay un editor operativo de política de atención. Por ello, los tickets nuevos pueden permanecer “Sin medición”. La política de renovación de notebooks es distinta del SLA de atención.

**Acción:** acordar objetivos de primera respuesta y resolución por prioridad e impacto, horario laboral y zona de Chile; calcular vencimientos en servidor. Definir si esperar al usuario pausa el reloj y registrar ese intervalo. Mostrar al ejecutivo el compromiso de atención y al técnico una cola por vencimiento. No convertir una prioridad en una promesa sin una política acordada.

### H12 · P2 · La línea de tiempo infiere pasos que no ocurrieron

**Evidencia:** [script.js:2950](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:2950>).

La ficha activa pasos como respuesta o solución basándose en el estado; no siempre usa el evento real de primera respuesta. Para algunos cierres usa `updated_at` como alternativa de fecha, y `cerrado` no se trata igual que `resuelto` en esa línea de tiempo.

**Acción:** construir la línea de tiempo desde eventos reales: creación, asignación, respuesta, espera, resolución, reapertura y cierre. Mostrar “Sin registro” cuando falta un evento. No presentar una edición posterior como el momento de resolución.

### H13 · P2 · El chat contiene conversaciones y respuestas simuladas

**Evidencia:** [script.js:7454](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7454>), [script.js:7836](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7836>), [script.js:7914](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7914>), [script.js:7983](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7983>).

El chat guarda mensajes localmente y genera respuestas automáticas tras una espera programada. La sincronización hacia la vista administrativa ocurre en el mismo almacenamiento del navegador; no es un canal entre el computador del ejecutivo y el del técnico.

**Acción:** priorizar primero una conversación real dentro del ticket. Si se mantiene un asistente de ayuda, identificarlo claramente como automático y ofrecer traspaso a una persona. Un chat en vivo requiere transporte compartido, permisos y entrega verificable de mensajes.

### H14 · P2 · Categorías, plantillas y ajustes tienen controles incompletos

**Evidencia:** [index.html:483](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:483>), [index.html:2706](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:2706>), [script.js:1117](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:1117>).

Los tres accesos de configuración abren la misma pantalla, sin editores diferenciados. “Guardar Cambios” solo ejecuta una alerta. El botón “Plantillas” del encabezado de creación no tiene una acción implementada en ese recorrido.

**Acción:** implementar catálogo, plantillas y ajustes con persistencia central y permisos. Hasta completarlos, evitar confirmaciones que aseguren un guardado inexistente. Las plantillas por problema frecuente pueden reducir mucho el trabajo del técnico.

### H15 · P2 · La vista del ejecutivo necesita una estructura propia

**Evidencia:** [script.js:7000](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:7000>), [company-scope.js:24](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/company-scope.js:24>), capturas y `resultados-navegador.json`.

Una sesión sintética de ejecutivo mantuvo visibles Todos los Tickets, Equipos, Compras TI, Técnicos, Informe gerencial y Configuración. A la vez, el código oculta Base de Conocimientos para ese rol. Esto agrega complejidad y deja fuera una herramienta útil de autoayuda. Visibilidad y seguridad deben resolverse por separado: ocultar enlaces no sustituye permisos de servidor.

En móvil de 390 × 844 px, el selector global de empresa midió **566 px de altura** y el campo principal de crear ticket quedó fuera de la primera pantalla. El selector se repite antes del contenido de cada sección.

**Acción:** ejecutivo con menú breve y empresa preseleccionada; selector compacto para quienes trabajan con varias empresas. Priorizar acción y estado del caso en la primera pantalla. Reservar inventario administrativo, costos y gestión para quienes los necesitan.

### H16 · P2 · Accesibilidad y teclado

**Evidencia:** [index.html:2730](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:2730>), [index.html:3811](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:3811>), controles de filtros y navegación; `resultados-navegador.json`.

Se detectaron 19 contenedores `.modal-backdrop` del HTML sin semántica de diálogo en esos contenedores. Con el login abierto, la primera pulsación Tab llevó al botón del menú lateral, detrás del modal. Hay filtros y botones de icono sin etiqueta accesible explícita. No se hizo una auditoría completa de contraste ni de lector de pantalla.

**Acción:** foco inicial dentro del modal, contención del foco, fondo inerte, nombre accesible y devolución del foco al cerrar. Etiquetar buscadores y botones de icono; comprobar teclado y zoom con usuarios. [Patrón de diálogo de W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### H17 · P2 · Monitoreo y API de infraestructura incompletos

**Evidencia:** [index.html:1882](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:1882>), [portal-api/main.py:9](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/portal-api/main.py:9>), [portal-api/main.py:16](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/portal-api/main.py:16>), [portal-api/docker-compose.yml:11](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/portal-api/docker-compose.yml:11>), [portal-api/docker-compose.yml:17](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/portal-api/docker-compose.yml:17>).

La pantalla aclara correctamente que no hay monitoreo conectado. La API disponible consulta CPU, RAM, disco y contenedores del servidor, pero el frontend no consume `/api/system`. Eso tampoco mediría por sí solo disponibilidad de Internet, correo, ERP o VPN.

La API no implementa autenticación en su código, inicializa Docker al importar y su despliegue monta el socket del daemon. No se comprobó si en producción hay proxy, autenticación externa o restricciones de red.

**Acción:** definir los servicios que realmente deben monitorearse y sus fuentes, proteger la API, gestionar errores y acceso mínimo a Docker. No publicar el socket como interfaz de administración. Docker advierte que controlar el daemon otorga capacidades importantes sobre el host. [Seguridad de Docker Engine](https://docs.docker.com/engine/security/).

### H18 · P2 · Exportación de compras y mantenimiento técnico

**Evidencia:** [script.js:11267](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/script.js:11267>), [index.html:4458](</Users/belfor/Library/CloudStorage/OneDrive-T-sales/Aplicaciones/MEGA PROYECTO SOPORTE/index.html:4458>), `portal-api/requirements.txt`, estructura del repositorio.

El CSV de compras no aplica la neutralización de fórmulas presente en otros exportadores y no escapa comillas uniformemente en todas las columnas. Debe unificarse el tratamiento de celdas y comprobarse en la hoja de cálculo de destino. [Riesgo de fórmulas en CSV, OWASP](https://community.owasp.org/attacks/CSV_Injection).

Además, hay un archivo principal de 12.384 líneas, HTML de 4.478 y CSS de 8.882; las dependencias web están repartidas en CDNs y Python no fija versiones. No se encontró un manifiesto de dependencias del frontend ni una canalización de validación en el repositorio revisado. Esto dificulta reproducir el entorno y detectar regresiones.

**Acción:** separar gradualmente identidad, acceso a datos, tickets, inventario y vistas; fijar dependencias con versiones y archivo de bloqueo; preparar documentación de instalación, esquema y migraciones. Agregar validación automática del flujo real, sin reescribir todo de una vez. La carga de todos los registros para filtrar en cliente debe revisarse cuando crezca el volumen: medir y luego incorporar filtros/paginación de servidor e índices.

## Experiencia recomendada para los ejecutivos

El objetivo de diseño es que la persona pueda pedir ayuda, saber quién la atiende y continuar su trabajo con la menor cantidad de pasos.

| Vista | Contenido propuesto | Beneficio |
|---|---|---|
| Inicio | “Necesito ayuda”, casos pendientes, avisos de incidentes y artículos relevantes | La siguiente acción queda clara |
| Solicitar ayuda | Problema, descripción, impacto y captura; identidad, empresa y equipo precargados | Menos digitación y errores |
| Mis solicitudes | Responsable, estado comprensible, última respuesta y próximo paso | Reduce consultas por WhatsApp sobre el avance |
| Mi equipo | Notebook asignado y datos útiles; solicitud de revisión o accesorio | Evita pedir serie y modelo cada vez |
| Ayuda rápida | Artículos breves por problema, con opción de crear ticket conservando el contexto | Autoayuda sin abandonar el caso |

Conviene reemplazar “pendiente” sin contexto por mensajes concretos: “Esperando tu respuesta”, “Esperando repuesto” o “Agendado para el martes”. El técnico necesita un motivo estructurado de espera; el ejecutivo necesita saber si debe actuar.

### Funciones que agregaría después de asegurar el guardado y los permisos

1. **Avisos reales por correo o Teams** al crear, asignar, responder, resolver o requerir datos. Elegir canal y evitar avisos duplicados. Requiere un servicio de envío y comprobación de entrega.
2. **Confirmar solución y reabrir el caso** conservando el historial. Una resolución técnica no siempre significa que el usuario logró volver a trabajar.
3. **Encuesta breve de 1 a 5** al cierre y comentario opcional. Con esto el indicador actual de satisfacción tendrá datos de origen.
4. **Capturas pegadas y adjuntos con progreso**, recuperación de borrador y advertencia al salir con cambios. El borrador debe protegerse en computadores compartidos.
5. **Incidente general vinculado a varios tickets**, para evitar trabajo repetido cuando cae un servicio compartido.
6. **Agenda de atención**, con disponibilidad y confirmación del horario. Aprovechar el módulo de visitas después de corregir su sincronización.
7. **Para técnicos:** cola por urgencia/vencimiento, asignación a uno mismo que impida doble toma, notas internas separadas de respuestas visibles, plantillas de solución y acciones por lote con permisos.
8. **Para administración:** historial de cambios, bajas lógicas, respaldos completos y restauración comprobada. Revisar qué respaldos ya proporciona el despliegue antes de contratar o desarrollar otros.

## Orden recomendado de ejecución

No agregaría otra capa de funciones antes de cerrar las primeras dos etapas. Los plazos deben estimarse después de revisar el esquema y la configuración reales; no se asignan fechas de entrega sin esa información.

| Etapa | Entregable | Criterio de salida |
|---|---|---|
| 1. Protección | Rotación de secretos, login real, permisos por rol/empresa, eliminación de escalamiento local y de HTML ejecutable | Una modificación del navegador no permite leer o escribir datos ajenos |
| 2. Integridad | Catálogo de estados, validaciones, adjuntos reales, cola de sincronización y directorio sin escrituras durante lectura | Crear, editar, responder y reconectar conserva el mismo registro en dos equipos |
| 3. Trabajo compartido | Historial, ingresos/bajas, intervenciones, costos y políticas centralizados; Graph corregido | Otro técnico ve el mismo proceso y su trazabilidad |
| 4. Comodidad | Portal de ejecutivo, formulario breve, móvil compacto, avisos y reapertura | Un ejecutivo completa el recorrido sin asistencia |
| 5. Operación | SLA acordado, monitoreo real, encuesta, restauración y pruebas automáticas | Las mediciones tienen fuente y la recuperación fue probada |

## Validación necesaria para llamarlo listo para uso completo

Esta matriz debe ejecutarse en un entorno de prueba conectado, con dos navegadores y cuentas separadas. Las 75 pruebas actuales siguen siendo útiles, pero no sustituyen estas verificaciones.

- Ejecutivo A no ve casos, adjuntos o directorio restringido de B ni otra empresa, incluso mediante llamadas directas a la API.
- Técnico no puede administrar roles, extraer contraseñas o entrar a paneles restringidos cambiando su sesión local. Usuario dado de baja pierde el acceso efectivo.
- Crear un ticket con captura, responder desde otro equipo, descargar el adjunto y consultar el historial conserva autor, fechas y permisos.
- Cortar la conexión antes y después del envío no produce falsos éxitos, duplicados ni pérdida de texto. Reconectar sincroniza una vez y muestra el resultado.
- Dos técnicos que toman el mismo caso no reciben ambos la asignación. Una edición antigua no pisa silenciosamente una nueva.
- Todos los estados se crean, filtran, cuentan y presentan igual; la reapertura conserva el cierre anterior como evento.
- Datos obligatorios inválidos se rechazan también desde el servidor; nombres y textos especiales no ejecutan HTML ni rompen exportaciones.
- SLA respeta política, esperas y calendario acordados; el correo/Teams llega realmente y queda registro del envío.
- Graph muestra datos verificados y todas las páginas; un fallo distingue caché anterior de sincronización exitosa.
- El recorrido móvil completo funciona mediante toques, teclado y zoom, con la acción principal visible y sin pérdida del borrador.
- Restaurar un respaldo recupera tickets, respuestas, adjuntos y registros de gestión con sus relaciones.
- Hacer un piloto con ejecutivos representativos: observar creación, seguimiento y reapertura; registrar errores, tiempo de tarea y dudas antes de extender el acceso.

## Evidencia y archivos entregados

- `resultados-navegador.json`: ocho escenarios, navegación, errores no controlados, validación de campos, selección de archivo, escalamiento local, intento de escritura previo al login, prueba inocua de HTML y filtro de estados.
- `resultados-logica.json`: cuatro defectos reproducidos en funciones aisladas.
- `verificacion-navegador.cjs`: comprobación local con Chrome instalado; bloquea servicios y usa datos ficticios. Requiere Playwright en la ruta de dependencias del entorno donde se hizo esta revisión.
- `verificaciones-logica.cjs`: comprobaciones de lógica con Node y módulos incorporados; no requiere red.
- `01-login.png`, `02-inicio-escritorio.png`, `03-crear-ticket-movil.png`: capturas del modo de fallo de CDNs con datos ficticios.

Para repetir la verificación de lógica desde la carpeta del proyecto:

```sh
node auditoria-soporte-2026-10-27/verificaciones-logica.cjs
```

No se validaron entregas de correos, credenciales vigentes, políticas RLS productivas, permisos de Microsoft, seguridad del hosting, carga concurrente real ni recuperación desde respaldos remotos. Esos puntos quedan explícitamente pendientes antes de declarar el sistema listo para toda la organización.
