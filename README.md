# Portafolio Notes Platform

> **Full-stack notes application** demonstrating a production-style architecture with event-driven processing, authentication, cloud infrastructure simulation, and clean separation of concerns.

A **monorepo** bringing together a NestJS backend, Angular frontend, and LocalStack + Terraform infrastructure to showcase complete application design patterns, from API design to cloud resource orchestration.

---

## Architecture Overview

```text
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
  ┌─────────────────────────────────────┐
  │  Angular Frontend  (Port 4200)      │
  │  - Login / Register                 │
  │  - Note CRUD operations             │
  │  - File uploads                     │
  └──────┬──────────────────────────────┘
         │ (JWT auth)
         ▼
  ┌─────────────────────────────────────┐
  │  NestJS Backend  (Port 3000)        │
  │  - Auth module (JWT/Passport)       │
  │  - Notes module (CRUD + file ops)   │
  │  - SQS producer (events)            │
  │  - Lambda consumer (async tasks)    │
  └──────┬──────────────────────────────┘
         │
    ┌────┴─────┬─────────────┐
    ▼          ▼             ▼
PostgreSQL   S3 (files)    SQS Queue
             LocalStack    (events)
                             │
                             ▼
                         Lambda
                       (processing)
```

---

## Public Repositories

Each module has its own public GitHub repository for detailed commit history, branches, pull requests, and construction process:

### Frontend — Angular
**Original repository:** [Nando-Garcia/Lab-frontend](https://github.com/Nando-Garcia/Lab-frontend)  
*Angular standalone components, JWT auth, HTTP interceptors, protected routes, responsive UI, note management*

### Backend — NestJS / Node.js
**Original repository:** [Nando-Garcia/Lab-backend](https://github.com/Nando-Garcia/Lab-backend)  
*NestJS REST API, PostgreSQL + TypeORM, JWT authentication, S3 file uploads, SQS event producer, Lambda consumer, comprehensive unit tests*

### Infrastructure — Terraform / LocalStack / Docker
**Original repository:** [Nando-Garcia/Lab-infra](https://github.com/Nando-Garcia/Lab-infra)  
*Terraform infrastructure-as-code, LocalStack AWS emulation, Docker Compose orchestration, PostgreSQL setup, SQS/Lambda/S3 configuration, CI/CD workflows*

> **For recruiters & developers:** Visit the individual repositories above to explore pull requests, commit messages, branches, and the full construction process of each component.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Angular 21, TypeScript, RxJS, SCSS, Vitest |
| **Backend** | NestJS 11, TypeScript, Node.js, TypeORM, PostgreSQL, JWT/Passport |
| **Async Processing** | AWS SQS, AWS Lambda (simulated with LocalStack) |
| **Storage** | S3 (LocalStack), PostgreSQL |
| **Infrastructure** | Terraform, LocalStack, Docker, Docker Compose |
| **DevOps** | GitHub Actions, Jest, Supertest, Winston logging |

---

## Project Structure

```
Portafolio-Notes-Platform/
├── frontend/           # Angular app (port 4200)
│   ├── src/
│   │   ├── app/auth/   # Login, register components
│   │   ├── app/notes/  # Note management
│   │   ├── app/services/  # API communication
│   │   └── ...
│   └── README.md       → Full frontend documentation
│
├── backend/            # NestJS API (port 3000)
│   ├── src/
│   │   ├── auth/       # Auth module
│   │   ├── notes/      # Notes module
│   │   ├── sqs/        # Event producer
│   │   ├── lambda/     # Lambda consumer
│   │   └── ...
│   └── README.md       → Full backend documentation
│
├── infra/              # Infrastructure as Code
│   ├── docker-compose.yml
│   ├── infra/          # Terraform configs
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── lambda.tf
│   │   └── ...
│   └── README.md       → Full infrastructure documentation
│
└── README.md           # This file
```

---

## Quick Start

### 1. Prerequisites

- **Node.js** 18+
- **npm** 11+
- **Docker Desktop** (with Docker Compose)
- **Terraform** 1.0+

### 2. Clone & Setup

```bash
git clone https://github.com/Nando-Garcia/Portafolio-Notes-Platform.git
cd Portafolio-Notes-Platform
```

### 3. Configure Environment Files

Each module has an example `.env` file. Copy and customize:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Infrastructure environment
cp infra/.env.example infra/.env
cp infra/infra/terraform.tfvars.example infra/infra/terraform.tfvars
```

### 4. Generate the Lambda artifact for the infrastructure pipeline.

```bash
cd backend
npm run build:lambda
```

If necessary, you can also manually compile the required artifacts:

```bash
npm run build
```

From WSL or a Linux shell, if the Lambda ZIP is generated from Windows:

```bash
sudo apt update
sudo apt install -y zip

cd backend
npx tsc -p tsconfig.lambda.json && mkdir -p lambda-dist && zip -j lambda-dist/sqs-consumer.zip dist/lambda/*
```

The generated ZIP is subsequently used in the infrastructure workflow in `/infra` and for local deployment with LocalStack.


### 5. Start Infrastructure (LocalStack + PostgreSQL)

```bash
cd infra
docker compose up -d
```

Verify services are running:

```bash
docker compose ps
```

### 6. Initialize Terraform

```bash
cd infra
terraform init
terraform plan
```

### 7. Apply Terraform by defining the architecture using var (arm64/x86_64):

```bash
terraform apply \
  -var="lambda_architecture=x86_64"
```

*(Adjust `lambda_architecture` based on your setup)*

### 8. Install & Run Backend

```bash
cd backend
npm install
npm run start:dev
```

API runs at `http://localhost:3000`

### 9. Install & Run Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:4200`

---

## Module Documentation

For detailed information about each module:

- **[backend/README.md](backend/README.md)** — API architecture, endpoints, auth flow, testing
- **[frontend/README.md](frontend/README.md)** — Component structure, routing, interceptors, UI flow
- **[infra/README.md](infra/README.md)** — Terraform modules, LocalStack setup

---

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Unit tests (Jest)
npm run test:cov
```

### Frontend Tests
```bash
cd frontend
npm test                   # Unit tests (Vitest)
npm run test:ui            # Test UI dashboard
npm run test:coverage      # Coverage report
```

---

## CI/CD Workflows

This monorepo includes GitHub Actions workflows (in `.github/workflows/`) that automate:

- **Backend validation** — TypeScript compilation, linting, Jest tests
- **Frontend validation** — Build verification, Vitest tests
- **Infrastructure validation** — Terraform plan/apply, LocalStack health checks
- **Lambda packaging** — Automated ZIP artifact generation for serverless processing

---

## Security & Secrets

Sensitive data (database passwords, API keys, etc.) is **never committed** to version control:

- Local `.env` files are in `.gitignore`
- Terraform `.tfvars` files are in `.gitignore`
- CI/CD secrets are managed via GitHub repository settings

---

## Development Flow

1. **Create a note** in the frontend
2. **If file attached** → Backend uploads to S3 and publishes event to SQS
3. **Lambda consumer** picks up the event and processes asynchronously
4. **Results** are stored/updated in PostgreSQL
5. **Frontend** polls API or uses WebSocket for real-time updates

---

## Contributing

This is a **portfolio project**.

This monorepo represents the release version of the full-stack portfolio, integrating frontend, backend, and infrastructure into a unified structure for demonstration and local deployment.

To view the detailed build process, visit the individual repository pages linked above.

- This monorepo aggregates three independent projects for presentation and ease of local orchestration
- Each module maintains its own repository, documentation, and development workflow
- LocalStack simulates AWS services locally—no AWS account required for development
- Terraform is configured for local developmentFor detailed construction process, visit the individual repository pages linked above.

---

## License

MIT
