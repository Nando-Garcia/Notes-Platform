################################################################################
# Outputs — Información útil después del deploy
################################################################################

output "lambda_role_arn" {
  description = "ARN of Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_function_arn" {
  description = "ARN of deployed Lambda function (sqs consumer)"
  value       = aws_lambda_function.sqs_consumer.arn
}

output "notes_queue_url" {
  description = "URL de la cola SQS principal"
  value       = aws_sqs_queue.notes_queue.url
}

output "notes_dlq_url" {
  description = "URL de la Dead Letter Queue"
  value       = aws_sqs_queue.notes_dlq.url
}

output "s3_bucket_name" {
  description = "Nombre del bucket S3 para adjuntos"
  value       = aws_s3_bucket.notes_attachments.bucket
}

output "db_secret_arn" {
  description = "ARN del secreto de credenciales de BD"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "sqs_secret_arn" {
  description = "ARN del secreto de configuración SQS"
  value       = aws_secretsmanager_secret.sqs_config.arn
}

output "log_group_name" {
  description = "Nombre del log group de Lambda en CloudWatch"
  value       = aws_cloudwatch_log_group.lambda_sqs_consumer.name
}
