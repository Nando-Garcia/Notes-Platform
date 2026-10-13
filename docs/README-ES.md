# Plataforma de Notas Portafolio

> **Aplicación de notas full-stack** que demuestra una arquitectura de nivel producción con procesamiento impulsado por eventos, autenticación, simulación de infraestructura en la nube y separación clara de responsabilidades.

Un **monorepo** que une un backend NestJS, frontend Angular e infraestructura LocalStack + Terraform para mostrar patrones completos de diseño de aplicaciones, desde diseño de API hasta orquestación de recursos en la nube.

---

## Descripción General de la Arquitectura

```text
┌─────────────┐
│   Navegador │
└──────┬──────┘
       │
       ▼
  ┌─────────────────────────────────────┐
  │  Frontend Angular  (Puerto 4200)    │
  │  - Login / Registro                 │
  │  - Operaciones CRUD de notas        │
  │  - Carga de archivos                │
  └──────┬──────────────────────────────┘
         │ (autenticación JWT)
         ▼
  ┌─────────────────────────────────────┐
  │  Backend NestJS  (Puerto 3000)      │
  │  - Módulo de autenticación          │
  │  - Módulo de notas (CRUD + archivos)│
  │  - Productor de SQS (eventos)       │
  │  - Consumidor Lambda (tareas async) │
  └──────┬──────────────────────────────┘
         │
    ┌────┴─────┬─────────────┐
    ▼          ▼             ▼
PostgreSQL   S3 (archivos) Cola SQS
             LocalStack    (eventos)
                             │
                             ▼
                         Lambda
                      (procesamiento)
```

---

## Repositorios Públicos

Cada módulo tiene su propio repositorio público en GitHub para historial detallado de commits, ramas, pull requests y proceso de construcción:

### Frontend — Angular
**Repositorio original:** [Nando-Garcia/Lab-frontend](https://github.com/Nando-Garcia/Lab-frontend)  
*Componentes standalone de Angular, autenticación JWT, interceptores HTTP, rutas protegidas, UI responsiva, gestión de notas*

### Backend — NestJS / Node.js
**Repositorio original:** [Nando-Garcia/Lab-backend](https://github.com/Nando-Garcia/Lab-backend)  
*API REST en NestJS, PostgreSQL + TypeORM, autenticación JWT, carga de archivos a S3, productor de eventos SQS, consumidor Lambda, tests unitarios completos*

### Infraestructura — Terraform / LocalStack / Docker
**Repositorio original:** [Nando-Garcia/Lab-infra](https://github.com/Nando-Garcia/Lab-infra)  
*Infraestructura como código con Terraform, emulación de AWS con LocalStack, orquestación Docker Compose, configuración de PostgreSQL, SQS/Lambda/S3, flujos CI/CD*

> **Para reclutadores y desarrolladores:** Visita los repositorios individuales anteriores para explorar pull requests, mensajes de commit, ramas y el proceso completo de construcción de cada componente.

---

## Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Angular 21, TypeScript, RxJS, SCSS, Vitest |
| **Backend** | NestJS 11, TypeScript, Node.js, TypeORM, PostgreSQL, JWT/Passport |
| **Procesamiento Asincrónico** | AWS SQS, AWS Lambda (simulado con LocalStack) |
| **Almacenamiento** | S3 (LocalStack), PostgreSQL |
| **Infraestructura** | Terraform, LocalStack, Docker, Docker Compose |
| **DevOps** | GitHub Actions, Jest, Supertest, Winston logging |

---

## Estructura del Proyecto

```
Portafolio-Notes-Platform/
├── frontend/           # Aplicación Angular (puerto 4200)
│   ├── src/
│   │   ├── app/auth/   # Componentes de login y registro
│   │   ├── app/notes/  # Gestión de notas
│   │   ├── app/services/  # Comunicación con API
│   │   └── ...
│   └── README.md       → Documentación completa del frontend
│
├── backend/            # API NestJS (puerto 3000)
│   ├── src/
│   │   ├── auth/       # Módulo de autenticación
│   │   ├── notes/      # Módulo de notas
│   │   ├── sqs/        # Productor de eventos
│   │   ├── lambda/     # Consumidor Lambda
│   │   └── ...
│   └── README.md       → Documentación completa del backend
│
├── infra/              # Infraestructura como código
│   ├── docker-compose.yml
│   ├── infra/          # Configuraciones Terraform
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── lambda.tf
│   │   └── ...
│   └── README.md       → Documentación completa de infraestructura
│
└── README.md           # Este archivo
```

---

## Inicio Rápido

### 1. Requisitos Previos

- **Node.js** 18+
- **npm** 11+
- **Docker Desktop** (con Docker Compose)
- **Terraform** 1.0+

### 2. Clonar y Configurar

```bash
git clone https://github.com/Nando-Garcia/Portafolio-Notes-Platform.git
cd Portafolio-Notes-Platform
```

### 3. Configurar Archivos de Entorno

Cada módulo tiene un archivo `.env` de ejemplo. Copia y personaliza:

```bash
# Entorno del backend
cp backend/.env.example backend/.env

# Entorno de infraestructura
cp infra/.env.example infra/.env
cp infra/infra/terraform.tfvars.example infra/infra/terraform.tfvars
```

### 4. Generar el artifact del Lambda para el flujo de infraestructura

```bash
cd backend
npm run build:lambda
```

Si es necesario, también puedes compilar manualmente los artefactos requeridos:

```bash
npm run build
```

Desde WSL o shell Linux si se genera el ZIP de Lambda desde Windows:

```bash
sudo apt update
sudo apt install -y zip

cd backend
npx tsc -p tsconfig.lambda.json && mkdir -p lambda-dist && zip -j lambda-dist/sqs-consumer.zip dist/lambda/*
```

El ZIP generado se usa después en el flujo de infraestructura en /infra y en el despliegue local con LocalStack.


### 5. Iniciar Infraestructura (LocalStack + PostgreSQL)

```bash
cd infra
docker compose up -d
```

Verifica que los servicios estén corriendo:

```bash
docker compose ps
```

### 6. Inicializar Terraform

```bash
cd infra
terraform init
terraform plan
```

### 7. Aplicar infraestructura, definiendo la arquitectura en una variable (arm64/x86_64):

```bash
terraform apply \
  -var="lambda_architecture=x86_64"
```

*(Ajusta `lambda_architecture` según tu configuración)*

### 8. Instalar y Ejecutar Backend

```bash
cd backend
npm install
npm run start:dev
```

La API se ejecuta en `http://localhost:3000`

### 9. Instalar y Ejecutar Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación se ejecuta en `http://localhost:4200`

---

## Documentación de Módulos

Para información detallada sobre cada módulo:

- **[backend/README.md](../backend/README.md)** — Arquitectura de API, endpoints, flujo de auth, testing
- **[frontend/README.md](../frontend/README.md)** — Estructura de componentes, routing, interceptores, flujo UI
- **[infra/README.md](../infra/README.md)** — Módulos Terraform, configuración de LocalStack

---

## Testing

### Tests del Backend
```bash
cd backend
npm test                    # Tests unitarios (Jest)
npm run test:cov
```

### Tests del Frontend
```bash
cd frontend
npm test                   # Tests unitarios (Vitest)
npm run test:ui            # Dashboard de pruebas
npm run test:coverage      # Reporte de cobertura
```

---

## Flujos de CI/CD

Este monorepo incluye flujos de GitHub Actions (en `.github/workflows/`) que automatizan:

- **Validación del backend** — Compilación TypeScript, linting, tests Jest
- **Validación del frontend** — Verificación de compilación, tests Vitest
- **Empaquetado de Lambda** — Generación automatizada de artefacto ZIP para procesamiento serverless
- **Validación de infraestructura** — Plan/apply de Terraform, health checks de LocalStack

---

## Seguridad y Secretos

Los datos sensibles (contraseñas de base de datos, claves API, etc.) **nunca se comprueban** en el control de versiones:

- Los archivos locales `.env` están en `.gitignore`
- Los archivos `.tfvars` de Terraform están en `.gitignore`
- Los secretos de CI/CD se gestionan a través de la configuración del repositorio en GitHub

---

## Flujo de Desarrollo

1. **Crear una nota** en el frontend
2. **Si se adjunta un archivo** → Backend sube a S3 y publica evento en SQS
3. **El consumidor Lambda** recoge el evento y procesa de forma asincrónica
4. **Los resultados** se almacenan/actualizan en PostgreSQL
5. **El frontend** consulta la API o usa WebSocket para actualizaciones en tiempo real

---

## Contribuyendo

Este es un **proyecto de portafolio**.

Este monorepo representa la versión de release del portafolio full-stack, integrando frontend, backend e infraestructura en una estructura unificada para demostración y despliegue local.

Para ver el proceso detallado de construcción, visita las páginas de repositorio individual vinculadas anteriormente.

- Este monorepo agrega tres proyectos independientes para presentación y facilidad de orquestación local
- Cada módulo mantiene su propio repositorio, documentación y flujo de desarrollo
- LocalStack simula servicios de AWS localmente—no se requiere cuenta de AWS para desarrollo
- Terraform está configurado para desarrollo local

---

## Licencia

MIT
