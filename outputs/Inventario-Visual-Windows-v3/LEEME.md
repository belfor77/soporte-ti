# Inventario Visual — versión 3

## Si la versión sin sesión ya funciona

1. En Supabase > SQL Editor, ejecuta ACTUALIZAR_SEDES.sql una sola vez. Añade la columna sede y actualiza el guardado. No cambia la autorización del exe anterior ni modifica datos existentes.
2. En Windows extrae TODO este ZIP en una carpeta nueva y ejecuta CREAR_EXE.bat. Usa el nuevo dist/InventarioEmpresas.exe.
3. Prueba una empresa y sede, registro y actualización. Comprueba que public.equipos.sede contiene la dirección elegida. No ejecutes AUTORIZAR_SOPORTE.sql ni crees cuentas.

## Si es la primera instalación

Ejecuta ACTIVAR_BASE.sql y luego ACTIVAR_SIN_SESION.sql. Después genera el exe. Este paquete mantiene la misma autorización que la versión sin sesión anterior.

## Nueva pantalla

Dos columnas: empresa, sede y datos de la persona a la izquierda; ficha técnica a la derecha. Empresa con logos, sede dependiente de empresa y dirección visible. T-Sales: Agustinas / Latadía. VPrime: Agustinas / Eliodoro. Infinet: Fanor Velasco. Direcciones tomadas del catálogo de tickets de la web.

Tarjetas con iconos vectoriales para CPU, RAM, almacenamiento, Windows, red y serie. Nombre del PC, marca y modelo en cabecera. Información técnica desplegable con todos los datos recopilados: cuenta Windows, dominio, IP, MAC, arquitectura, build y fecha, además del hardware. Los valores no obtenidos se indican como desconocidos.

Detección automática con avances por categoría, vista parcial de Windows y RAM antes de finalizar y formulario disponible mientras detecta. La consulta de inventario aparece separada de la detección. Se evitan consultas DNS y discos extraíbles/de red para reducir esperas; algunas consultas WMI y el arranque del exe pueden seguir tardando en ciertos PC.

Elige empresa y sede, completa Nombre y apellido y correo, revisa el tipo de equipo y guarda. Si el PC existe se muestra el responsable anterior. No se cambia automáticamente la empresa elegida al terminar la consulta. Si falta la serie, escribe la real de la etiqueta y pulsa Consultar esta serie.

## Web y datos

La sede se guarda en public.equipos.sede y en el historial. Este paquete no cambia la pantalla web: la columna sede puede consultarse en la base; actualizar la página para ver los demás cambios de inventario. El detalle técnico completo se muestra en el exe; se sincronizan los campos existentes del inventario (CPU, RAM, disco, Windows, serie, marca, modelo, tipo, responsable, empresa) y la nueva sede. No se agregan columnas para IP, MAC o dominio en esta actualización.

## Distribución

Python 3.11 o superior solo en el PC donde generan el exe. Los PC destino necesitan solo InventarioEmpresas.exe e internet. El exe incluye autorización revocable: quien guarde una copia puede usarla. Borrar una copia no revoca las demás. Para revocar:

update public.desktop_inventory_keys set enabled=false where name='soporte-portable-v2';

No contiene credenciales de técnicos ni clave administrativa de Supabase. No identifica si el operador fue Omar o Felipe. Mantén la ventana abierta ante fallos de internet para reintentar: no tiene cola persistente.

## Validación

Paquete preparado en macOS. Se verifican sintaxis, reglas de sede, extracción por etapas y empaquetado. La visualización nativa y compilación deben validarse en Windows. No se ejecutó el SQL en producción desde aquí.
