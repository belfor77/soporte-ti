# Inventario portable — sin inicio de sesión

## Activación de esta versión

Ya instalado ACTIVAR_BASE.sql, ejecuta ACTIVAR_SIN_SESION.sql una sola vez en el mismo proyecto Supabase. No necesitas volver a crear cuentas ni ejecutar AUTORIZAR_SOPORTE.sql. Si todavía no instalaste la base, ejecuta ACTIVAR_BASE.sql primero.

En el PC Windows de soporte, extrae TODO este paquete y ejecuta CREAR_EXE.bat. Requiere Python 3.11 o superior e internet solo para preparar el ejecutable. Distribuye dist/InventarioEmpresas.exe; contiene los logos y la configuración. Los PC destino no necesitan instalar Python.

## Uso

Abre el exe: detecta el hardware y consulta automáticamente la serie. Selecciona empresa, completa Nombre y apellido y correo, revisa tipo de equipo y guarda. Muestra responsable anterior antes de confirmar una actualización. No pide cuentas, contraseñas ni inicio de sesión. Actualiza la web para ver el registro.

Si Windows no entrega una serie válida, escribe la serie real de la etiqueta del equipo y pulsa Consultar serie corregida. No inventes una serie ni uses el nombre del PC como sustituto. El programa no permite guardar si cambiaste la serie después de consultarla.

## Acceso del archivo

El archivo incorpora una clave revocable con acceso a la función de inventario: quien conserve una copia puede usarla. Borrarlo del PC no revoca otras copias. Para desactivar esta versión completa, ejecuta:

update public.desktop_inventory_keys set enabled=false where name='soporte-portable-v2';

No contiene contraseñas de técnicos ni la clave administrativa de Supabase. El historial registra fecha y cambios; este modo no identifica si fue Omar o Felipe. El SQL conserva el punto de acceso anterior con sesión.

## Estado

Preparado en macOS; pendiente compilar y probar en Windows y validar el esquema real de la base. La inicialización COM se corrigió para la extracción WMI en segundo plano y se agregó detección alternativa mediante PowerShell/CIM. Sin acceso remoto a la base, la activación solo la realiza el administrador con el SQL incluido. No hay cola persistente sin internet; conserva la ventana abierta y reintenta.
