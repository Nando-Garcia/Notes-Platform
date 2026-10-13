# Backend — NestJS / Node.js

> **API REST en NestJS** para la plataforma de notas con autenticación JWT, carga de archivos a S3, procesamiento asincrónico impulsado por eventos mediante SQS/Lambda y persistencia en PostgreSQL.

Parte del monorepo [Portafolio-Notes-Platform](../README.md).  
**Repositorio original:** [Nando-Garcia/Lab-backend](https://github.com/Nando-Garcia/Lab-backend)

---

## Stack Tecnológico

- **NestJS** 11 (framework Node.js)
- **TypeScript** 5.9
- **TypeORM** (ORM para PostgreSQL)
- **PostgreSQL** (base de datos principal)
- **JWT + Passport** (autenticación)
- **AWS SDK** (Cloudwatch, Lambda, S3, SQS/DLQ, Secrets Manager, IAM — emulado con LocalStack)
- **Multer** (carga de archivos)
- **Winston** (logging estructurado)
- **Class Validator** (validación de DTOs)
- **Jest + Supertest** (testing)

---

## Estructura del Proyecto

```
src/
├── app.module.ts              # Módulo raíz
├── app.controller.ts          # Endpoint de verificación de salud
├── app.service.ts
├── main.ts                    # Punto de entrada bootstrap
├── auth/                      # Módulo de autenticación
│   ├── auth.controller.ts     # Endpoints login, registro
│   ├── auth.module.ts
│   ├── auth.service.ts        # Lógica JWT
│   ├── jwt-auth.guard.ts      # Protección de rutas
│   ├── jwt.strategy.ts        # Estrategia Passport JWT
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── refresh-token.dto.ts
│   └── interfaces/
│       └── authenticated-request.interface.ts
├── notes/                     # Módulo de notas
│   ├── notes.controller.ts    # Endpoints CRUD
│   ├── notes.module.ts
│   └── dto/
│       └── create-note.dto.ts
├── service/
│   ├── notes.service.ts       # Lógica de negocio de notas
│   └── notes.service.spec.ts
├── entities/
│   ├── user.entity.ts         # Entidad ORM de usuario
│   ├── note.entity.ts         # Entidad ORM de nota
├── sqs/                       # Productor de eventos
│   ├── sqs-producer.service.ts
│   └── sqs-producer.service.spec.ts
├── lambda/                    # Consumidor Lambda (serverless)
│   ├── index.ts               # Punto de entrada del handler Lambda
│   ├── lambda-sqs-consumer.service.ts
│   └── sqs-consumer.handler.ts
├── common/
│   └── logger.ts              # Logging estructurado
└── test/
    └── app.e2e-spec.ts        # Tests end-to-end

```

---

## Características Principales

- **Registro e Inicio de Sesión de Usuario** — Autenticación por email/contraseña
- **Autenticación JWT** — Acceso seguro basado en tokens
- **Rutas Protegidas** — Todos los endpoints `/api/notes` requieren JWT válido
- **Operaciones CRUD de Notas** — Crear, leer, actualizar y eliminar notas
- **Carga de Archivos a S3** — Adjuntar archivos a notas (almacenados en S3 de LocalStack)
- **Publicación de Eventos** — Cuando se adjunta archivo → publica mensaje a cola SQS
- **Manejo de mensajes no procesados** — Configuración lista para almacenar mensajes en cola DLQ
- **Procesamiento Asincrónico Lambda** — Consumidor procesa eventos SQS de forma asincrónica
- **Persistencia en PostgreSQL** — TypeORM para consultas de base de datos
- **Testing Completo** — Tests unitarios (Jest) + tests E2E (Supertest)
- **Logging Estructurado** — Winston para logging de solicitudes/errores
- **Seguridad de credenciales y permisos** — Proteccion de datos sensibles con Secrets manager, variables de enteorno y políticas IAM para accesos autorizados


---

## Empezar

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Variables de Entorno

Crea `.env`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_NAME=notesdb

# JWT
JWT_SECRET=tu_clave_secreta_jwt_aqui
JWT_EXPIRATION=3600

# AWS / LocalStack
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=notes-bucket
SQS_QUEUE_URL=http://localhost:4566/000000000000/notes-queue

# Servidor
PORT=3000
```

#### Nota de seguridad (importante)

Este repositorio mantiene los secretos locales fuera de Git usando archivos .env y archivos de variables de Terraform. Esos archivos están excluidos del control de versiones para evitar fugas de credenciales. Los valores sensibles mostrados en este README son solo para fines de laboratorio y aprendizaje para portafolio.

### 3. Iniciar Servidor de Desarrollo

#### Nota importante

Antes de iniciar el servidor con el comando mostrado, levantar la infraestructura en /infra: [Portafolio-Notes-Platform](../infra/README.mdd).  

```bash
npm run start:dev
```

La API se ejecuta en `http://localhost:3000`

---

## Endpoints de API

### Autenticación

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{ email, password }` | Registrar nuevo usuario |
| POST | `/auth/login` | `{ email, password }` | Iniciar sesión y obtener token JWT |
| POST | `/auth/refresh-token` | `{ token }` | Refrescar token expirado |

**Respuesta (Login/Registro):**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Notas (Protegidas — Requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notes` | Obtener todas las notas del usuario autenticado |
| POST | `/api/notes` | Crear nueva nota (con archivo opcional) |
| DELETE | `/api/notes/:id` | Eliminar nota |
| POST | `/notes/:id/attachments` | Subir archivo a S3 y guardar URL |

**Body de Crear Nota:**
```json
{
  "title": "Mi Nota",
  "description": "Contenido de la nota",
  "file": "<archivo multipart>"
}
```

---

## Flujo de Autenticación

1. **Frontend** → POST `/auth/register` con email y contraseña
2. **Backend** → Hashea contraseña, almacena usuario en PostgreSQL
3. **Backend** → Devuelve token JWT e info del usuario
4. **Frontend** → Almacena token en local storage
5. **Frontend** → Incluye `Authorization: Bearer <token>` en todas las solicitudes
6. **Backend** → JwtAuthGuard valida token en rutas protegidas
7. **Solicitud** → Procede si token válido; 401 si expirado/inválido

**Payload del JWT:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Carga de Archivos e Integración S3

1. **Frontend** sube archivo con datos de nota
2. **Backend** recibe datos multipart form
3. **Backend** sube archivo a bucket S3 (LocalStack)
4. **Backend** almacena nota con URL de S3 en PostgreSQL
5. **Backend** publica evento `FILE_ATTACHED` a cola SQS
6. **Consumidor Lambda** recoge evento y procesa de forma asincrónica

**Ejemplo de URL de S3 almacenada en DB:**
```
http://localhost:4566/notes-attachments/user-uuid/notes-id/file-name.pdf
```

---

## Procesamiento Impulsado por Eventos (SQS + Lambda)

### Flujo

```
Usuario crea nota con archivo
         │
         ▼
Backend sube a S3
         │
         ▼
Backend publica en SQS
         │
         ▼
Consumidor Lambda consulta SQS
         │
         ▼
Lambda procesa evento (validación, indexación, etc.)
         │
         ▼
Actualiza PostgreSQL o notifica frontend
```

### Servicio Productor SQS

```typescript
// src/sqs/sqs-producer.service.ts
async publishNoteEvent(noteId: string) {
  await this.sqsClient.sendMessage({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ noteId, event: 'FILE_ATTACHED' })
  });
}
```

### Handler Lambda

```typescript
// src/lambda/sqs-consumer.handler.ts
export async function handler(event: any) {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    console.log('Procesando:', message);
    // Trabajo asincrónico aquí (indexación, escaneo de virus, etc.)
  }
}
```

---

## Testing

### Ejecutar Tests Unitarios

```bash
npm test
```

### Ejecutar Tests en Modo Watch

```bash
npm test -- --watch
```

### Reporte de Cobertura

```bash
npm test -- --coverage
```

### Estructura de Tests

- **Tests unitarios** → Archivos `*.spec.ts` (Jest)
- **Tests E2E** → `test/app.e2e-spec.ts` (Supertest + base de datos real)

---

## Compilando para Lambda

El backend incluye una compilación específica para Lambda:

```bash
npm run build:lambda
```

Esto crea un artefacto ZIP (`lambda-dist/sqs-consumer.zip`) para despliegue.

**Comandos:**
```bash
# Compilar TypeScript para Lambda
npx tsc -p tsconfig.lambda.json

# Crear archivo ZIP
mkdir -p lambda-dist
zip -j lambda-dist/sqs-consumer.zip dist/lambda/*
```

---

## Esquema de Base de Datos

### Tabla de Usuarios
```sql
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla de Notas
```sql
CREATE TABLE "note" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Manejo de Errores

Códigos HTTP de Estado Comunes:

| Código | Escenario |
|--------|-----------|
| 200 | Éxito |
| 201 | Recurso creado |
| 400 | Error de validación (solicitud incorrecta) |
| 401 | No autorizado (JWT inválido/expirado) |
| 403 | Prohibido (permisos insuficientes) |
| 404 | Recurso no encontrado |
| 500 | Error del servidor |

**Respuesta de Error:**
```json
{
  "statusCode": 400,
  "message": "Validación fallida",
  "error": "Bad Request"
}
```

### Manejo de Colas SQS y Dead Letter Queue (DLQ)

El sistema está configurado para manejar automáticamente mensajes que fallan:

**Configuración SQS:**
```hcl
# infra/infra/sqs.tf
resource "aws_sqs_queue" "notes_dlq" {
  name = "notes-dlq"  # Cola de letra muerta
}

resource "aws_sqs_queue" "notes_queue" {
  name = "notes-queue"
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notes_dlq.arn
    maxReceiveCount     = 3  # Máximo de intentos antes de enviar a DLQ
  })
  
  visibility_timeout_seconds = 300  # 5 minutos para procesar
}
```

**Flujo de manejo de errores:**
1. **Mensaje entra en cola SQS** → Lambda intenta procesar
2. **Lambda falla** → Mensaje se devuelve a cola
3. **Reintento (3 veces máximo)** → Si persiste el error
4. **DLQ (Dead Letter Queue)** → Mensaje se mueve a cola de letra muerta para análisis manual
5. **Monitoreo** → CloudWatch logs registran los errores para debugging

**Verificar mensajes en DLQ:**
```bash
# Ver mensajes en DLQ
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/notes-dlq

# Limpiar DLQ (si es necesario)
aws --endpoint-url=http://localhost:4566 sqs purge-queue \
  --queue-url http://localhost:4566/000000000000/notes-dlq
```

### CloudWatch Logging (Deshabilitado en LocalStack Community)

La infraestructura incluye configuración de CloudWatch Log Groups para logging estructurado:

**Configuración en Terraform:**
```hcl
# infra/infra/cloudwatch.tf
resource "aws_cloudwatch_log_group" "lambda_sqs_consumer" {
  name              = "/aws/lambda/${var.project_name}-sqs-consumer"
  retention_in_days = 7
}
```

**Nota importante:**
- LocalStack Community **no emula CloudWatch Logs completamente**
- Por eso en `.env` está configurado: `USE_CLOUDWATCH=false`
- El logging se realiza mediante **Winston** (local) en lugar de CloudWatch
- En producción (AWS real), cambiar a `USE_CLOUDWATCH=true` para usar CloudWatch nativo

**Configuración en .env:**
```env
# CloudWatch Configuration
CLOUDWATCH_LOG_GROUP=/app/backend
USE_CLOUDWATCH=false
LOG_LEVEL=info
NODE_ENV=development
```

### AWS Secrets Manager para Protección de Datos

El sistema usa AWS Secrets Manager (vía LocalStack) para almacenar datos sensibles de forma centralizada:

**Configuración en Terraform:**
```hcl
# infra/infra/secrets.tf

# Secreto 1: Credenciales de base de datos
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "notesdb/credentials"
  description = "Credenciales de conexión a PostgreSQL"
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = var.db_host
    port     = var.db_port
    database = var.db_name
  })
}

# Secreto 2: Configuración de SQS
resource "aws_secretsmanager_secret" "sqs_config" {
  name = "sqs/config"
  description = "URLs de la cola SQS y DLQ"
}

resource "aws_secretsmanager_secret_version" "sqs_config" {
  secret_id = aws_secretsmanager_secret.sqs_config.id
  secret_string = jsonencode({
    queueUrl = "http://sqs.${var.aws_region}.localhost.localstack.cloud:4566/000000000000/notes-queue"
    dlqUrl   = "http://sqs.${var.aws_region}.localhost.localstack.cloud:4566/000000000000/notes-dlq"
    region   = var.aws_region
  })
}
```

**Beneficios:**
- ✅ Credenciales NO se almacenan en `.env` en producción
- ✅ Acceso centralizado y auditable
- ✅ Rotación de secretos automatizada (en AWS real)
- ✅ Encriptación en tránsito y en reposo

**Variables de entorno en .env:**
```env
# AWS Secrets Manager
SQS_CONFIG_SECRET_ID=sqs/config
DB_CREDENTIALS_SECRET_ID=notesdb/credentials
```

**Consultar secretos (para debugging):**
```bash
# Ver credenciales de DB
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id notesdb/credentials

# Ver configuración de SQS
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id sqs/config
```

### Permisos IAM (Least Privilege)

Los roles IAM están configurados con el principio de **menor privilegio**, otorgando solo los permisos necesarios:

**Configuración en Terraform:**
```hcl
# infra/infra/iam.tf

# Rol de ejecución para Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-execution-role"
  
  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Política 1: CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logs_policy" {
  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:*:*:*"
    }]
  })
}

# Política 2: SQS
resource "aws_iam_role_policy" "lambda_sqs_policy" {
  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Action = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ]
      Resource = aws_sqs_queue.notes_queue.arn
    }]
  })
}

# Política 3: S3
resource "aws_iam_role_policy" "lambda_s3_policy" {
  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Resource = "${aws_s3_bucket.notes_attachments.arn}/*"
    }]
  })
}
```

**Permisos otorgados:**

| Servicio | Permisos | Propósito |
|----------|----------|----------|
| **CloudWatch Logs** | CreateLogGroup, CreateLogStream, PutLogEvents | Escribir logs de Lambda |
| **SQS** | ReceiveMessage, DeleteMessage, GetQueueAttributes | Consumir eventos de la cola |
| **S3** | GetObject, PutObject, DeleteObject | Leer/escribir archivos en bucket |

**Beneficios:**
- ✅ Lambda **solo puede** recibir/eliminar mensajes SQS (no enviar, crear colas, etc.)
- ✅ Lambda **solo puede** acceder a objetos en bucket de notas (no borrar bucket)
- ✅ Lambda **solo puede** escribir logs (no modificar grupos de log)
- ✅ Aislamiento de permisos por servicio (seguridad en capas)

**Ver permisos asignados:**
```bash
# Listar roles IAM
aws --endpoint-url=http://localhost:4566 iam list-roles

# Ver políticas del rol Lambda
aws --endpoint-url=http://localhost:4566 iam list-role-policies \
  --role-name notes-lambda-execution-role

# Ver contenido de una política
aws --endpoint-url=http://localhost:4566 iam get-role-policy \
  --role-name notes-lambda-execution-role \
  --policy-name notes-lambda-logs-policy
```

---

## Módulos NestJS

### AuthModule
- Maneja registro de usuario, login, validación JWT
- Proporciona `JwtAuthGuard` para protección de rutas

### NotesModule
- Gestiona operaciones CRUD de notas
- Integra carga de archivos a S3
- Publica eventos en SQS

### SqsModule
- Proporciona `SqsProducerService` para publicación de eventos

### LambdaModule
- Punto de entrada del handler Lambda
- Lógica del consumidor SQS

---

## Documentación Relacionada

- [Documentación de Frontend](../frontend/README.md)
- [Configuración de Infraestructura](../infra/README.md)
- [Descripción General del Monorepo](../README.md)

---

## Licencia

MIT
