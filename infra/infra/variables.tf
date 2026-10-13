variable "aws_region" {
  description = "AWS Region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "notes"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "development"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "notes-app"
}

# ─── DB Credentials ───────────────────────────────────────────────────────────

variable "db_host" {
  description = "PostgreSQL host"
  type        = string
  default     = "localhost"
}

variable "db_port" {
  description = "PostgreSQL port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "notesdb"
}

variable "db_username" {
  description = "PostgreSQL username"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

# ─── Lambda ───────────────────────────────────────────────────────────────────

variable "lambda_architecture" {
  description = "Arquitectura del procesador donde corre Lambda/LocalStack (arm64 o x86_64)"
  type        = string

  validation {
    condition     = contains(["arm64", "x86_64"], var.lambda_architecture)
    error_message = "El valor debe ser 'arm64' o 'x86_64'."
  }
}

variable "lambda_zip_path" {
  description = "Ruta al ZIP de la Lambda. Por defecto apunta al repo del backend (ruta relativa desde Localstack_lab/infra/)."
  type        = string
  default     = "../../backend/lambda-dist/sqs-consumer.zip"
}
