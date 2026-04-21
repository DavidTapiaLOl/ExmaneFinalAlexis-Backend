# Gatekeeper System - Backend API

Esta es la API REST desarrollada en Node.js y Express para el **Gatekeeper System**. Se encarga de gestionar las solicitudes de acceso, validar la integridad de los datos en PostgreSQL y orquestar la comunicación con el flujo de automatización en n8n.

## Tecnologías Utilizadas

* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** [Express](https://expressjs.com/)
* **Base de Datos:** [PostgreSQL](https://www.postgresql.org/)
* **Automatización:** [n8n](https://n8n.io/)
* **Librerías:** `pg` (PostgreSQL client), `axios`, `cors`, `dotenv`.

## Requisitos Previos

1. Instancia de PostgreSQL corriendo localmente o en la nube.
2. Contenedor de n8n activo.
3. Node.js instalado (v16+).

## Configuración de la Base de Datos (SQL)

Ejecuta el siguiente script en tu terminal de PostgreSQL o pgAdmin para crear la estructura necesaria:

```sql
-- 1. Crear tabla de pagos autorizados (Referencia)
CREATE TABLE pagos_referencia (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(50) UNIQUE NOT NULL,
    monto DECIMAL(10,2),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de solicitudes de alumnos
CREATE TABLE solicitudes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    folio VARCHAR(50) UNIQUE NOT NULL,
    estatus VARCHAR(20) DEFAULT 'Procesando', -- Procesando, Aceptado, Error
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. INSERT de datos de prueba (Folios válidos para el examen)
INSERT INTO pagos_referencia (folio, monto) VALUES 
('FOLIO123', 150.00),
('FOLIO456', 150.00),
('ITSES_2026_VIP', 500.00),
('ALEXIS_PRUEBA', 0.00);



Instalación y EjecuciónClonar el repositorio:
cd gafetes-backend
Instalar dependencias:
hnpm install
Configurar variables de entorno:
Crea un archivo .env en la raíz con el siguiente formato:


PORT=3000
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_tu_db
N8N_WEBHOOK_URL=[https://tu-instancia.n8n.cloud/webhook/tu-id-produccion](https://tu-instancia.n8n.cloud/webhook/tu-id-produccion)
Iniciar el servidor:Bashnpm start
Endpoints de la APIMétodoEndpointDescripciónPOST/api/solicitar-accesoRegistra solicitud, valida dominio/folio único y dispara Webhook.GET/api/verificar-estatus/:emailDevuelve el estado actual de la solicitud para el polling del frontend.PATCH/api/callback-n8nEndpoint de retorno para que n8n actualice el estatus a 'Aceptado'.Reglas de Negocio ImplementadasValidación de Dominio: Solo se aceptan correos con terminación @itses.edu.mx.Folio Único: El sistema impide que un mismo folio de pago sea utilizado en dos solicitudes distintas.Persistencia: Todas las solicitudes inician con estatus Procesando hasta que la automatización confirme el pago.
