# Backend — NestJS / Node.js

> **NestJS REST API** for the notes platform featuring JWT authentication, file uploads to S3, event-driven asynchronous processing via SQS/Lambda, and PostgreSQL persistence.

Part of the [Portafolio-Notes-Platform](../README.md) monorepo.  
**Original repository:** [Nando-Garcia/Lab-backend](https://github.com/Nando-Garcia/Lab-backend)

---

## Tech Stack

- **NestJS** 11 (Node.js framework)
- **TypeScript** 5.9
- **TypeORM** (PostgreSQL ORM)
- **PostgreSQL** (primary database)
- **JWT + Passport** (authentication)
- **AWS SDK** (S3, SQS, Secrets Manager — emulated with LocalStack)
- **Multer** (file uploads)
- **Winston** (structured logging)
- **Class Validator** (DTO validation)
- **Jest + Supertest** (testing)

---

## Project Structure

```
src/
├── app.module.ts              # Root module
├── app.controller.ts          # Health check endpoint
├── app.service.ts
├── main.ts                    # Bootstrap entry point
├── auth/                      # Authentication module
│   ├── auth.controller.ts     # Login, register endpoints
│   ├── auth.module.ts
│   ├── auth.service.ts        # JWT logic
│   ├── jwt-auth.guard.ts      # Route protection
│   ├── jwt.strategy.ts        # Passport JWT strategy
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── refresh-token.dto.ts
│   └── interfaces/
│       └── authenticated-request.interface.ts
├── notes/                     # Notes module
│   ├── notes.controller.ts    # CRUD endpoints
│   ├── notes.module.ts
│   └── dto/
│       └── create-note.dto.ts
├── service/
│   ├── notes.service.ts       # Business logic for notes
│   └── notes.service.spec.ts
├── entities/
│   ├── user.entity.ts         # User ORM entity
│   ├── note.entity.ts         # Note ORM entity
├── sqs/                       # Event producer
│   ├── sqs-producer.service.ts
│   └── sqs-producer.service.spec.ts
├── lambda/                    # Lambda consumer (serverless)
│   ├── index.ts               # Lambda handler entry point
│   ├── lambda-sqs-consumer.service.ts
│   └── sqs-consumer.handler.ts
├── common/
│   └── logger.ts              # Structured logging
└── test/
    └── app.e2e-spec.ts        # End-to-end tests

```

---

## Key Features

- **User Registration & Login** — Email/password authentication
- **JWT Authentication** — Secure token-based access
- **Protected Routes** — All `/api/notes` endpoints require valid JWT
- **Note CRUD Operations** — Create, read, update, delete notes
- **File Upload to S3** — Attach files to notes (stored in LocalStack S3)
- **Event Publishing** — When file attached → publish message to SQS queue
- **Lambda Async Processing** — Consumer processes SQS events asynchronously
- **PostgreSQL Persistence** — TypeORM for database queries
- **Comprehensive Testing** — Unit tests (Jest) + E2E tests (Supertest)
- **Structured Logging** — Winston for request/error logging

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_NAME=notesdb

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=3600

# AWS / LocalStack
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=notes-bucket
SQS_QUEUE_URL=http://localhost:4566/000000000000/notes-queue

# Server
PORT=3000
```

### 3. Start Development Server

```bash
npm run start:dev
```

API runs at `http://localhost:3000`

---

## API Endpoints

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{ email, password }` | Register new user |
| POST | `/auth/login` | `{ email, password }` | Login & get JWT token |
| POST | `/auth/refresh-token` | `{ token }` | Refresh expired token |

**Response (Login/Register):**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Notes (Protected — Requires JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes for authenticated user |
| POST | `/api/notes` | Create new note (with optional file) |
| DELETE | `/api/notes/:id` | Delete note |
| POST | `/notes/:id/attachments` | Upload file to S3 and save URL |

**Create Note Body:**
```json
{
  "title": "My Note",
  "description": "Note content",
  "file": "<multipart file>"
}
```

---

## Authentication Flow

1. **Frontend** → POST `/auth/register` with email & password
2. **Backend** → Hash password, store user in PostgreSQL
3. **Backend** → Return JWT token & user info
4. **Frontend** → Store token in local storage
5. **Frontend** → Include `Authorization: Bearer <token>` in all requests
6. **Backend** → JwtAuthGuard validates token on protected routes
7. **Request** → Proceeds if token valid; 401 if expired/invalid

**JWT Payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## File Upload & S3 Integration

1. **Frontend** uploads file with note data
2. **Backend** receives multipart form-data
3. **Backend** uploads file to S3 bucket (LocalStack)
4. **Backend** stores note with S3 file URL in PostgreSQL
5. **Backend** publishes `FILE_ATTACHED` event to SQS queue
6. **Lambda consumer** picks up event and processes asynchronously

**Example S3 URL stored in DB:**
```
http://localhost:4566/notes-bucket/notes/user-uuid/file-name.pdf
```

---

## 🔄 Event-Driven Processing (SQS + Lambda)

### Flow

```
User creates note with file
         │
         ▼
Backend uploads to S3
         │
         ▼
Backend publishes to SQS
         │
         ▼
Lambda consumer polls SQS
         │
         ▼
Lambda processes event (validation, indexing, etc.)
         │
         ▼
Updates PostgreSQL or notifies frontend
```

### SQS Producer Service

```typescript
// src/sqs/sqs-producer.service.ts
async publishNoteEvent(noteId: string) {
  await this.sqsClient.sendMessage({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ noteId, event: 'FILE_ATTACHED' })
  });
}
```

### Lambda Handler

```typescript
// src/lambda/sqs-consumer.handler.ts
export async function handler(event: any) {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    console.log('Processing:', message);
    // Async work here (indexing, virus scan, etc.)
  }
}
```

---

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm test -- --coverage
```

### Test Structure

- **Unit tests** → `*.spec.ts` files (Jest)
- **E2E tests** → `test/app.e2e-spec.ts` (Supertest + real database)

---

## Building for Lambda

The backend includes a Lambda-specific build:

```bash
npm run build:lambda
```

This creates a ZIP artifact (`lambda-dist/sqs-consumer.zip`) for deployment.

**Commands:**
```bash
# Compile TypeScript for Lambda
npx tsc -p tsconfig.lambda.json

# Create ZIP archive
mkdir -p lambda-dist
zip -j lambda-dist/sqs-consumer.zip dist/lambda/*
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notes Table
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

## Error Handling

Common HTTP Status Codes:

| Code | Scenario |
|------|----------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error (bad request) |
| 401 | Unauthorized (invalid/expired JWT) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 500 | Server error |

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### SQS Queue & Dead Letter Queue (DLQ) Error Handling

The system is configured to automatically handle messages that fail processing:

**SQS Configuration:**
```hcl
# infra/infra/sqs.tf
resource "aws_sqs_queue" "notes_dlq" {
  name = "notes-dlq"  # Dead letter queue
}

resource "aws_sqs_queue" "notes_queue" {
  name = "notes-queue"
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notes_dlq.arn
    maxReceiveCount     = 3  # Max attempts before sending to DLQ
  })
  
  visibility_timeout_seconds = 300  # 5 minutes to process
}
```

**Error handling flow:**
1. **Message enters SQS queue** → Lambda attempts to process
2. **Lambda fails** → Message returned to queue
3. **Retry (max 3 times)** → If error persists
4. **DLQ (Dead Letter Queue)** → Message moved to DLQ for manual analysis
5. **Monitoring** → CloudWatch logs record errors for debugging

**Check DLQ messages:**
```bash
# View DLQ messages
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/notes-dlq

# Purge DLQ (if needed)
aws --endpoint-url=http://localhost:4566 sqs purge-queue \
  --queue-url http://localhost:4566/000000000000/notes-dlq
```

### CloudWatch Logging (Disabled in LocalStack Community)

Infrastructure includes CloudWatch Log Groups configuration for structured logging:

**Terraform Configuration:**
```hcl
# infra/infra/cloudwatch.tf
resource "aws_cloudwatch_log_group" "lambda_sqs_consumer" {
  name              = "/aws/lambda/${var.project_name}-sqs-consumer"
  retention_in_days = 7
}
```

**Important Note:**
- LocalStack Community **does NOT fully emulate CloudWatch Logs**
- Therefore in `.env`: `USE_CLOUDWATCH=false`
- Logging is performed via **Winston** (local) instead of CloudWatch
- In production (real AWS), change to `USE_CLOUDWATCH=true` for native CloudWatch

**Configuration in .env:**
```env
# CloudWatch Configuration
CLOUDWATCH_LOG_GROUP=/app/backend
USE_CLOUDWATCH=false
LOG_LEVEL=info
NODE_ENV=development
```

### AWS Secrets Manager for Data Protection

The system uses AWS Secrets Manager (via LocalStack) to store sensitive data centrally:

**Terraform Configuration:**
```hcl
# infra/infra/secrets.tf

# Secret 1: Database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "notesdb/credentials"
  description = "PostgreSQL connection credentials"
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

# Secret 2: SQS Configuration
resource "aws_secretsmanager_secret" "sqs_config" {
  name = "sqs/config"
  description = "SQS queue and DLQ URLs"
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

**Benefits:**
- ✅ Credentials are NOT stored in `.env` in production
- ✅ Centralized and auditable access
- ✅ Automated secret rotation (in real AWS)
- ✅ Encryption in transit and at rest

**Environment variables in .env:**
```env
# AWS Secrets Manager
SQS_CONFIG_SECRET_ID=sqs/config
DB_CREDENTIALS_SECRET_ID=notesdb/credentials
```

**Query secrets (for debugging):**
```bash
# View DB credentials
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id notesdb/credentials

# View SQS configuration
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id sqs/config
```

### IAM Permissions (Least Privilege)

IAM roles are configured with the **least privilege** principle, granting only necessary permissions:

**Terraform Configuration:**
```hcl
# infra/infra/iam.tf

# Execution role for Lambda
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

# Policy 1: CloudWatch Logs
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

# Policy 2: SQS
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

# Policy 3: S3
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

**Permissions Granted:**

| Service | Permissions | Purpose |
|---------|-------------|---------|
| **CloudWatch Logs** | CreateLogGroup, CreateLogStream, PutLogEvents | Write Lambda logs |
| **SQS** | ReceiveMessage, DeleteMessage, GetQueueAttributes | Consume queue events |
| **S3** | GetObject, PutObject, DeleteObject | Read/write bucket objects |

**Benefits:**
- ✅ Lambda **can only** receive/delete SQS messages (not send, create queues, etc.)
- ✅ Lambda **can only** access objects in notes bucket (not delete bucket)
- ✅ Lambda **can only** write logs (not modify log groups)
- ✅ Service isolation (layered security)

**View assigned permissions:**
```bash
# List IAM roles
aws --endpoint-url=http://localhost:4566 iam list-roles

# View Lambda role policies
aws --endpoint-url=http://localhost:4566 iam list-role-policies \
  --role-name notes-lambda-execution-role

# View policy details
aws --endpoint-url=http://localhost:4566 iam get-role-policy \
  --role-name notes-lambda-execution-role \
  --policy-name notes-lambda-logs-policy
```

---

## NestJS Modules

### AuthModule
- Handles user registration, login, JWT validation
- Provides `JwtAuthGuard` for route protection

### NotesModule
- Manages note CRUD operations
- Integrates with S3 file uploads
- Publishes events to SQS

### SqsModule
- Provides `SqsProducerService` for event publishing

### LambdaModule
- Lambda handler entry point
- SQS consumer logic

---

## Related Documentation

- [Frontend Documentation](../frontend/README.md)
- [Infrastructure Setup](../infra/README.md)
- [Monorepo Overview](../README.md)

---

## License

MIT
