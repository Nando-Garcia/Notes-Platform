# Infraestructura — Terraform / LocalStack / Docker

> **Infraestructura como Código (IaC)** para la plataforma de notas usando Terraform, LocalStack (emulación local de AWS), Docker Compose y PostgreSQL.

Parte del monorepo [Portafolio-Notes-Platform](../README.md).  
**Repositorio original:** [Nando-Garcia/Lab-infra](https://github.com/Nando-Garcia/Lab-infra)

---

## Stack Tecnológico

- **Terraform** 1.0+ (gestión de infraestructura)
- **LocalStack** (emulación de servicios AWS)
- **Docker** y **Docker Compose** (orquestación de contenedores)
- **PostgreSQL** 15+ (base de datos relacional)
- **AWS S3** (almacenamiento de archivos — vía LocalStack)
- **AWS SQS/DLQ** (colas de mensajes — vía LocalStack)
- **AWS Lambda** (computación serverless — vía LocalStack)
- **AWS IAM** (control de acceso — vía LocalStack)
- **AWS Secrets Manager** (almacenamiento de secretos — vía LocalStack)
- **AWS localstack** (solo la lógica pues localstack no lo emula)


---

## Descripción General

Este módulo orquesta el entorno de desarrollo local:

1. **Docker Compose** inicia LocalStack, PostgreSQL y otros servicios
2. **Terraform** aprovisiona recursos AWS (buckets S3, colas SQS y DLQ, funciones Lambda, roles IAM, Secrets Manager y para observabilidad, Cloudwatch)
3. **API Backend** se conecta a PostgreSQL y servicios AWS de LocalStack
4. **Artefacto ZIP de Lambda** (desde compilación backend) se despliega a Lambda de LocalStack

Para este proyecto no se requiere cuenta de AWS todo se ejecuta localmente.

---

## Estructura del Proyecto

```
infra/
├── docker-compose.yml          # Definiciones de servicios
├── .env.example                # Ejemplo de variables de entorno
├── infra/                      # Configuraciones Terraform
│   ├── main.tf                 # Definición principal de infraestructura
│   ├── variables.tf            # Declaraciones de variables y validación
│   ├── outputs.tf              # Valores de salida
│   ├── terraform.tfvars        # Valores de variables (local, en .gitignore)
│   ├── terraform.tfvars.example # Plantilla de ejemplo tfvars
│   ├── terraform.tfstate       # Archivo de estado (rastrea recursos desplegados)
│   ├── s3.tf                   # Configuración de bucket S3
│   ├── sqs.tf                  # Configuración de cola SQS
│   ├── lambda.tf               # Configuración de función Lambda
│   ├── iam.tf                  # Roles y políticas IAM
│   ├── cloudwatch.tf           # Logging de CloudWatch
│   └── secrets.tf              # Configuración de Secrets Manager
└── README.md                   # Este archivo
```

---

## Inicio Rápido

### 1. Requisitos Previos

- **Docker Desktop** (o Docker Engine + Docker Compose)
- **Terraform** 1.0+
- **AWS CLI** (opcional, para depuración de LocalStack)
- **Git** (para clonar repositorios)

### 2. Configuración del Entorno

Copia los archivos de ejemplo:

```bash
cd infra
cp .env.example .env
cp infra/terraform.tfvars.example infra/terraform.tfvars
```

Edita `.env` con tus credenciales de base de datos:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=notesdb
LOCALSTACK_SERVICES=s3,sqs,lambda,iam,secrets-manager
DOCKER_HOST=unix:///var/run/docker.sock
```

Edita `infra/terraform.tfvars`:

```hcl
aws_region             = "us-east-1"
environment            = "development"
db_host                = "postgres"
db_port                = 5432
db_name                = "notesdb"
db_username            = "admin"
db_password            = "admin123"
lambda_architecture    = "arm64"  # o "x86_64"
lambda_zip_path        = "../backend/lambda-dist/sqs-consumer.zip"
```

#### Nota de seguridad (importante)
Los valores sensibles mostrados en este README son solo  para fines de laboratorio y aprendizaje para portafolio.

En un proyecto real no se deben publicar credenciales en documentacion, codigo fuente ni archivos versionados. En entornos reales se deben usar secretos gestionados (por ejemplo GitHub Secrets, AWS Secrets Manager o un vault corporativo), rotacion de credenciales y valores fuertes/no predecibles.

### 3. Iniciar Docker Compose

```bash
docker compose down    # Limpia contenedores existentes
docker compose up -d   # Inicia servicios en background
```

Verifica servicios:

```bash
docker compose ps
```

Salida esperada:
```
NOMBRE               ESTADO    PUERTOS
postgres             Up        5432/tcp
localstack           Up        0.0.0.0:4566->4566/tcp
```

### 4. Inicializar Terraform

```bash
cd infra
terraform init
```

Esto descarga proveedores de Terraform y configura el directorio `.terraform/`.

### 5. Planificar y Aplicar Terraform

Vista previa de cambios:

```bash
terraform plan
```

Aplicar infraestructura, definiendo la arquitectura en una variable (arm64/x86_64):

```bash
terraform apply \
  -var="lambda_architecture=x86_64"
```

Cuando se solicite, ingresa `yes` para confirmar.

IMPORTANTE: Se debe construir el artifact .zip en /backend antes de contruir la infraestructura, las istrucciones se detallan en:  [Construcción de artifact en Backend](../backend/README.md)

### 6. Verificar Recursos

Verifica recursos creados en LocalStack:

```bash
# Listar buckets S3
aws --endpoint-url=http://localhost:4566 s3 ls

# Listar colas SQS y DLQ
aws --endpoint-url=http://localhost:4566 sqs list-queues

# Listar funciones Lambda
aws --endpoint-url=http://localhost:4566 lambda list-functions
```

---

## Servicios de Docker Compose

### PostgreSQL
- **Contenedor:** `postgres:15-alpine`
- **Puerto:** `5432` (expuesto al host)
- **Base de datos:** `notesdb` (creada al iniciar)
- **Credenciales:** Desde `.env`

### LocalStack
- **Contenedor:** `localstack/localstack:latest`
- **Puerto:** `4566` (todos los servicios AWS por puerto único)
- **Servicios:** S3, SQS/DLQ, Lambda, IAM, Secrets Manager, CloudWatch
- **Volúmenes:** Persisten datos entre reinicios

### Variables de Entorno
Los servicios se comunican vía nombres de servicio:
- Backend se conecta a `postgres` (no `localhost`)
- Backend se conecta a `localstack` (no `localhost`)
- Red Docker resuelve automáticamente nombres de host

---

## Módulos Terraform

### Recursos Principales

#### Bucket S3 (`s3.tf`)
```hcl
- Nombre: notes-storage-<environment>
- ACL: private
- Versionamiento: deshabilitado
- Encriptación: habilitada
```

#### Cola SQS (`sqs.tf`)
```hcl
- Nombre: notes-queue
- Retención de mensajes: 1209600 segundos (14 días)
- Timeout de visibilidad: 300 segundos
- Cola de letra muerta: habilitada
```

#### Función Lambda (`lambda.tf`)
```hcl
- Nombre: sqs-consumer
- Runtime: Node.js 20.x
- Handler: index.handler
- Arquitectura: arm64 o x86_64 (configurable)
- Fuente: Archivo ZIP de compilación backend
- Variables de entorno: credenciales DB, endpoints AWS
- Rol de ejecución: Rol IAM con permisos S3 + SQS
```

#### Roles IAM y Políticas (`iam.tf`)
```hcl
- LambdaExecutionRole: permisos para S3, SQS, CloudWatch
- ServiceRole: permisos para API acceder S3 + SQS
- Política: permisos mínimos (menor privilegio)
```

#### Secrets Manager (`secrets.tf`)
```hcl
- Secreto: credenciales de base de datos
- Accesible por: Lambda, API
```

#### Logs CloudWatch (`cloudwatch.tf`)
```hcl
- Grupos de log para Lambda, API, servicios
- Retención: 7 días
```

---

## Variables y Salidas

### Variables Clave

| Variable | Tipo | Defecto | Descripción |
|----------|------|---------|-------------|
| `aws_region` | string | `us-east-1` | Región AWS (LocalStack) |
| `environment` | string | `development` | Nombre de entorno (dev/staging/prod) |
| `db_host` | string | `localhost` | Hostname PostgreSQL |
| `db_port` | number | `5432` | Puerto PostgreSQL |
| `db_username` | string | - | Usuario base de datos (requerido) |
| `db_password` | string | - | Contraseña base de datos (sensible, requerido) |
| `lambda_architecture` | string | `arm64` | Arq. procesador (arm64 o x86_64) |
| `lambda_zip_path` | string | - | Ruta a artefacto ZIP Lambda (requerido) |

### Salidas

```bash
terraform output
```

Devuelve:
- Nombre bucket S3
- URL cola SQS
- ARN función Lambda
- Endpoint PostgreSQL
- Endpoint LocalStack

---

## Estado de Terraform

**`.terraform/`** — Directorio de estado local (no comprometer)
**`terraform.tfstate`** — Archivo de estado rastrea recursos desplegados (no comprometer)
**`terraform.tfstate.backup`** — Backup de estado previo

Los archivos de estado están en `.gitignore` por seguridad.

### Estado Remoto (Opcional)

Para colaboración en equipo o CI/CD, usa estado remoto:

```hcl
# infra/main.tf
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "notes-platform/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
  }
}
```

---

## Comandos Comunes

### AWS CLI con LocalStack

```bash
# Operaciones S3
aws --endpoint-url=http://localhost:4566 s3 ls

# Operaciones SQS/DQL
aws --endpoint-url=http://localhost:4566 sqs list-queues

# Operaciones Lambda
aws --endpoint-url=http://localhost:4566 lambda get-function --function-name sqs-consumer

# Operaciones de Secretos
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
```

---

## Solución de Problemas

### Contenedor LocalStack no inicia

```bash
# Revisar logs
docker compose logs localstack

# Asegurar que Docker está corriendo
docker ps

# Verificar que puerto 4566 está disponible
lsof -i :4566
```

### Problemas de conexión PostgreSQL

```bash
# Probar conexión
docker exec -it postgres psql -U admin -d notesdb

# Revisar red
docker network ls
docker network inspect portafolio-notes-platform_default
```

### ZIP de Lambda no encontrado

```bash
# Verificar que la ruta existe
ls -la ../backend/lambda-dist/sqs-consumer.zip
# Si no existe construir .zip desde /backend (README.md)
```

### Terraform apply falla

```bash
# Validar sintaxis
terraform validate

# Revisar valores de variables
terraform plan -out=tfplan

# Habilitar logging de debug
TF_LOG=DEBUG terraform apply
```

---

## Consideraciones de Seguridad

### Desarrollo Local (Esta Configuración)
- LocalStack se ejecuta sin autenticación (bien para dev local)
- Contraseña de base de datos en `.env` (excluida de Git)
- Estado de Terraform contiene datos sensibles (excluido de Git)
- Sin exposición a internet (servicios solo accesibles en `localhost`)

### Producción (AWS Real)
- Usar autenticación IAM de AWS
- Habilitar encriptación en reposo y en tránsito
- Usar AWS Secrets Manager para credenciales
- Usar estado remoto de Terraform (con encriptación)
- Habilitar alarmas y monitoreo de CloudWatch
- Configurar security groups de VPC y ACLs de red
- Usar RDS (no PostgreSQL autogestionado)

---

## Convención de Nombres Terraform

Todos los recursos siguen este patrón:

```
<project_name>-<resource_type>-<environment>
```

Ejemplo:
- Bucket: `notes-storage-development`
- Cola: `notes-queue`
- Función: `sqs-consumer`
- Rol IAM: `notes-lambda-execution-role`

---

## Documentación Relacionada

- [Documentación de Backend](../backend/README.md)
- [Documentación de Frontend](../frontend/README.md)
- [Descripción General del Monorepo](../README.md)

---

## Licencia

MIT
