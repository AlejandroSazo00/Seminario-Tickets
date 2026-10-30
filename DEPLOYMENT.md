# Despliegue

## Base de datos Neon

Antes de desplegar la nueva versión, aplica la migración en el proyecto, la base y la rama Neon que utilizará ese entorno:

1. Abre el SQL Editor de Neon y selecciona la base de datos y la rama de destino.
2. Haz o confirma que existe una copia de seguridad reciente.
3. Ejecuta una sola vez [`scripts/migrations/20261030_production.sql`](./scripts/migrations/20261030_production.sql) en el SQL Editor.
4. Comprueba que existen `ticket_time_entries` y `ticket_catalogs`, y que los catálogos incluyen estados, prioridades, categorías y canales de origen.
5. Despliega la aplicación.

El script es idempotente y transaccional. Crea la tabla de cronómetros y los catálogos, importa categorías y canales usados por tickets existentes, y normaliza las categorías históricas. Si detecta cronómetros activos duplicados por agente o por ticket, se detiene y revierte la transacción para que se revise la inconsistencia. No ejecutes el esquema completo `scripts/schema.sql` ni el seed sobre una base de producción existente.

Si el SQL Editor informa que las tablas ya existen, confirma que es la misma base y rama usadas por la aplicación; el script puede ejecutarse de nuevo de forma segura. Si producción usa otra rama o base, aplica el script allí antes de desplegar. La aplicación puede seguir en modo de compatibilidad de solo lectura si todavía falta la tabla de catálogos, pero no se deben habilitar funciones que dependan de una tabla de cronómetros ausente.
