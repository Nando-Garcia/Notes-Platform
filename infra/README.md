# Infrastructure — Terraform / LocalStack / Docker

> **Infrastructure-as-Code (IaC)** setup for the notes platform using Terraform, LocalStack (local AWS emulation), Docker Compose, and PostgreSQL.

Part of the [Portafolio-Notes-Platform](../README.md) monorepo.  
**Original repository:** [Nando-Garcia/Lab-infra](https://github.com/Nando-Garcia/Lab-infra)

---

## Tech Stack

- **Terraform** 1.0+ (infrastructure management)
- **LocalStack** (AWS service emulation)
- **Docker** & **Docker Compose** (container orchestration)
- **PostgreSQL** 15+ (relational database)
- **AWS S3** (file storage — via LocalStack)
- **AWS SQS/DLQ** (message queue — via LocalStack)
- **AWS Lambda** (serverless compute — via LocalStack)
- **AWS IAM** (access control — via LocalStack)
- **AWS Secrets Manager** (secrets storage — via LocalStack)
- **AWS CloudWatch** (logging — via LocalStack)

---

## Overview

This module orchestrates the local development environment:

1. **Docker Compose** starts LocalStack, PostgreSQL, and other services
2. **Terraform** provisions AWS resources (S3 buckets, SQS/DQL queues, Lambda functions, IAM roles, Secrets Manager and Cloudwatch)
3. **Backend API** connects to PostgreSQL and LocalStack AWS services
4. **Lambda ZIP** artifact (from backend build) is deployed to LocalStack Lambda

No AWS account required—everything runs locally.

---

## Project Structure

```
infra/
├── docker-compose.yml          # Service definitions
├── .env.example                # Example environment variables
├── infra/                      # Terraform configurations
│   ├── main.tf                 # Main infrastructure definition
│   ├── variables.tf            # Variable declarations & validation
│   ├── outputs.tf              # Output values
│   ├── terraform.tfvars        # Variable values (local, in .gitignore)
│   ├── terraform.tfvars.example # Example tfvars template
│   ├── terraform.tfstate       # State file (tracks deployed resources)
│   ├── s3.tf                   # S3 bucket configuration
│   ├── sqs.tf                  # SQS queue configuration
│   ├── lambda.tf               # Lambda function configuration
│   ├── iam.tf                  # IAM roles & policies
│   ├── cloudwatch.tf           # CloudWatch logging
│   └── secrets.tf              # Secrets Manager configuration
└── README.md                   # This file
```

---

## Quick Start

### 1. Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
- **Terraform** 1.0+
- **AWS CLI** (optional, for debugging LocalStack)
- **Git** (to clone repositories)

### 2. Environment Setup

Copy the example files:

```bash
cd infra
cp .env.example .env
cp infra/terraform.tfvars.example infra/terraform.tfvars
```

Edit `.env` with your database credentials:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=notesdb
LOCALSTACK_SERVICES=s3,sqs,lambda,iam,secrets-manager
DOCKER_HOST=unix:///var/run/docker.sock
```

Edit `infra/terraform.tfvars`:

```hcl
aws_region             = "us-east-1"
environment            = "development"
db_host                = "postgres"
db_port                = 5432
db_name                = "notesdb"
db_username            = "admin"
db_password            = "admin123"
lambda_architecture    = "arm64"  # or "x86_64"
lambda_zip_path        = "../backend/lambda-dist/sqs-consumer.zip"
```

#### Security Note (Important)
The sensitive values shown in this README are only for laboratory and learning purposes for portfolio projects.

In a real project, credentials should NOT be published in documentation, source code, or versioned files. In production environments, use managed secrets (for example GitHub Secrets, AWS Secrets Manager, or a corporate vault), credential rotation, and strong/non-predictable values.

### 3. Start Docker Compose

```bash
docker compose down    # Clean up any existing containers
docker compose up -d   # Start services in background
```

Verify services:

```bash
docker compose ps
```

Expected output:
```
NAME                 STATUS      PORTS
postgres             Up          5432/tcp
localstack           Up          0.0.0.0:4566->4566/tcp
```

### 4. Initialize Terraform

```bash
cd infra
terraform init
```

This downloads Terraform providers and sets up the `.terraform/` directory.

### 5. Plan & Apply Terraform

Preview changes:

```bash
terraform plan
```

Apply the infrastructure, add architecture in a variable (arm64/x86_64):

```bash
terraform apply \
  -var="lambda_architecture=x86_64"
```

When prompted, enter `yes` to confirm.

IMPORTANT: The .zip artifact must be built in /backend before building the infrastructure; instructions are detailed in: [Construcción de artifact en Backend](../backend/README.md)

### 6. Verify Resources

Check created resources in LocalStack:

```bash
# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List SQS, DLQ queues
aws --endpoint-url=http://localhost:4566 sqs list-queues

# List Lambda functions
aws --endpoint-url=http://localhost:4566 lambda list-functions
```

---

## Docker Compose Services

### PostgreSQL
- **Container:** `postgres:15-alpine`
- **Port:** `5432` (exposed to host)
- **Database:** `notesdb` (created at startup)
- **Credentials:** From `.env`

### LocalStack
- **Container:** `localstack/localstack:latest`
- **Port:** `4566` (all AWS services via single port)
- **Services:** S3, SQS/DLQ, Lambda, IAM, Secrets Manager, CloudWatch
- **Volumes:** Persist data across restarts

### Environment Variables
Services communicate via service names:
- Backend connects to `postgres` (not `localhost`)
- Backend connects to `localstack` (not `localhost`)
- Docker network automatically resolves hostnames

---

## Terraform Modules

### Main Resources

#### S3 Bucket (`s3.tf`)
```hcl
- Bucket name: notes-storage-<environment>
- ACL: private
- Versioning: disabled
- Server-side encryption: enabled
```

#### SQS Queue (`sqs.tf`)
```hcl
- Queue name: notes-queue
- Message retention: 1209600 seconds (14 days)
- Visibility timeout: 300 seconds
- Dead-letter queue: enabled
```

#### Lambda Function (`lambda.tf`)
```hcl
- Function name: sqs-consumer
- Runtime: Node.js 20.x
- Handler: index.handler
- Architecture: arm64 or x86_64 (configurable)
- Source: ZIP file from backend build
- Environment variables: DB credentials, AWS endpoints
- Execution role: IAM role with S3 + SQS permissions
```

#### IAM Roles & Policies (`iam.tf`)
```hcl
- LambdaExecutionRole: permissions for S3, SQS, CloudWatch
- ServiceRole: permissions for API to access S3 + SQS
- Policy: minimal permissions (least privilege)
```

#### Secrets Manager (`secrets.tf`)
```hcl
- Secret: database credentials
- Accessible by: Lambda, API
```

#### CloudWatch Logs (`cloudwatch.tf`)
```hcl
- Log groups for Lambda, API, services
- Retention: 7 days
```

---

## Variables & Outputs

### Key Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `aws_region` | string | `us-east-1` | AWS region (LocalStack) |
| `environment` | string | `development` | Environment name (dev/staging/prod) |
| `db_host` | string | `localhost` | PostgreSQL hostname |
| `db_port` | number | `5432` | PostgreSQL port |
| `db_username` | string | - | Database user (required) |
| `db_password` | string | - | Database password (sensitive, required) |
| `lambda_architecture` | string | `arm64` | Processor arch (arm64 or x86_64) |
| `lambda_zip_path` | string | - | Path to Lambda ZIP artifact (required) |

### Outputs

```bash
terraform output
```

Returns:
- S3 bucket name
- SQS queue URL
- Lambda function ARN
- PostgreSQL endpoint
- LocalStack endpoint

---

## Terraform State

**`.terraform/`** — Local state directory (do not commit)
**`terraform.tfstate`** — State file tracking deployed resources (do not commit)
**`terraform.tfstate.backup`** — Backup of previous state

State files are in `.gitignore` for security.

### Remote State (Optional)

For team collaboration or CI/CD, use remote state:

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

## Common Commands

### LocalStack AWS CLI

```bash
# S3 operations
aws --endpoint-url=http://localhost:4566 s3 ls

# SQS/DLQ operations
aws --endpoint-url=http://localhost:4566 sqs list-queues

# Lambda operations
aws --endpoint-url=http://localhost:4566 lambda get-function --function-name sqs-consumer

# Secrets operations
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
```

---

## Troubleshooting

### LocalStack Container Won't Start

```bash
# Check logs
docker compose logs localstack

# Ensure Docker is running
docker ps

# Check port 4566 is available
lsof -i :4566
```

### PostgreSQL Connection Issues

```bash
# Test connection
docker exec -it postgres psql -U admin -d notesdb

# Check network
docker network ls
docker network inspect portafolio-notes-platform_default
```

### Lambda ZIP Not Found

```bash
# Verify path exists
ls -la ../backend/lambda-dist/sqs-consumer.zip
# If it doesn't exist, build the ZIP from /backend (see backend/README.md)
```

### Terraform Apply Fails

```bash
# Validate syntax
terraform validate

# Check variable values
terraform plan -out=tfplan

# Enable debug logging
TF_LOG=DEBUG terraform apply
```

---

## Security Considerations

### Local Development (This Setup)
- LocalStack runs without authentication (fine for local dev)
- Database password stored in `.env` (excluded from Git)
- Terraform state contains sensitive data (excluded from Git)
- No internet exposure (services only accessible on `localhost`)

### Production (Real AWS)
- Use AWS IAM authentication
- Enable encryption at rest & in transit
- Use AWS Secrets Manager for credentials
- Use remote Terraform state (with encryption)
- Enable CloudWatch alarms & monitoring
- Set VPC security groups & network ACLs
- Use RDS (not self-managed PostgreSQL)

---

## Terraform Naming Convention

All resources follow this pattern:

```
<project_name>-<resource_type>-<environment>
```

Example:
- Bucket: `notes-storage-development`
- Queue: `notes-queue`
- Function: `sqs-consumer`
- IAM Role: `notes-lambda-execution-role`

---

## Related Documentation

- [Backend Documentation](../backend/README.md)
- [Frontend Documentation](../frontend/README.md)
- [Monorepo Overview](../README.md)

---

## License

MIT
