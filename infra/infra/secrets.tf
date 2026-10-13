################################################################################
# Secrets Manager — reemplaza el uso manual de Postman
################################################################################

# ─── Credenciales de la base de datos ─────────────────────────────────────────

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "notesdb/credentials"
  description             = "Credenciales de conexión a PostgreSQL"
  recovery_window_in_days = 0 # LocalStack: eliminar sin período de retención
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

# ─── Configuración de SQS ─────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "sqs_config" {
  name                    = "sqs/config"
  description             = "URLs de la cola SQS y DLQ"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "sqs_config" {
  secret_id = aws_secretsmanager_secret.sqs_config.id

  secret_string = jsonencode({
    queueUrl = "http://sqs.${var.aws_region}.localhost.localstack.cloud:4566/000000000000/notes-queue"
    dlqUrl   = "http://sqs.${var.aws_region}.localhost.localstack.cloud:4566/000000000000/notes-dlq"
    region   = var.aws_region
  })
}
