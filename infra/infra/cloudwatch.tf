################################################################################
# CloudWatch Log Groups
# LocalStack Community no crea estos automáticamente como sí lo hace AWS real,
# por eso se gestionan explícitamente aquí en lugar del comando manual:
#   docker exec localstack-lab awslocal logs create-log-group ...
################################################################################

resource "aws_cloudwatch_log_group" "lambda_sqs_consumer" {
  name              = "/aws/lambda/${var.project_name}-sqs-consumer"
  retention_in_days = 7
}
