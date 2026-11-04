# Inventario de empresas — Windows

Primera versión preparada para T-Sales, VPrime e Infinet, con sus logos.

## Activar conexión (administrador, una sola vez)

La aplicación apunta al mismo proyecto Supabase que usa la web actual.
1. Respalda la base y revisa ACTIVAR_BASE.sql en el editor SQL de Supabase. El esquema se dedujo del código web: requiere la tabla equipos y las columnas usadas por su formulario. Si el esquema real difiere, ajustarlo antes de ejecutar.
2. Ejecuta ACTIVAR_BASE.sql. Añade permisos explícitos y una función de consulta/guardado con historial. No modifica registros existentes al instalar.
3. Crea las cuentas de técnicos en Supabase Authentication > Users y autoriza sus UUID usando el ejemplo al final del SQL. El acceso actual de la web puede ser distinto: el programa requiere una cuenta de Supabase Authentication.
4. Nunca agregues una clave service_role al programa. Solo contiene la clave pública de la web; los permisos de escritura los verifica el servidor.

## Ejecutar en Windows 10/11

Extrae TODO el ZIP a una carpeta local con permiso de escritura. Instala Python 3.11 o superior desde python.org. Abre INICIAR.bat; la primera ejecución instala dependencias con internet.
Para crear un ejecutable independiente, abre CREAR_EXE.bat. El resultado será dist/InventarioEmpresas.exe: puedes distribuir ese archivo sin Python.

## Uso

Conecta la cuenta de soporte, selecciona Detectar equipo, revisa la empresa y el responsable y confirma. Se consulta la serie en todo el inventario para evitar duplicar equipos al cambiar empresa. Si existe, muestra el anterior responsable y precarga sus datos. Puedes elegir otra empresa antes de guardar. Conserva el estado actual del equipo al actualizar; los nuevos se crean activos. Cada escritura guarda el registro anterior y el nuevo en desktop_inventory_history, dentro de la misma transacción.

Si internet falla, el formulario permanece abierto para reintentar. No hay cola automática ni guardado persistente sin conexión: no cierres la ventana antes de completar la operación. Si vence la sesión, conecta otra vez. Si otro técnico cambia el registro, vuelve a detectar antes de confirmar.

En la web, actualiza o vuelve a abrir el inventario después del guardado: la versión actual consulta la base al cargar; no se agregó actualización en vivo. Los registros que existan solo en el respaldo local del navegador deben sincronizarse desde la web antes de usar el programa.

## Validación pendiente

El paquete se preparó en macOS: no incluye un .exe ya compilado. Debe probarse en un PC Windows y validar el SQL contra el esquema real antes de uso general. No se accedió ni se hicieron cambios a la base de producción. Prueba primero un registro nuevo, una reasignación, permisos rechazados y un reintento tras pérdida de conexión. El historial queda disponible en la base; esta versión no añade un visor del historial a la web. No exporta Excel/PDF ni recoge RUT/dirección: utiliza los campos actuales del inventario web.
