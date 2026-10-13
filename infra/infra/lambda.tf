################################################################################
# Lambda function and event source mapping (SQS -> Lambda)
# El ZIP se genera desde el repositorio del backend con: npm run build:lambda
# Por defecto apunta al directorio lambda-dist del repo de backend (ruta relativa).
# Sobreescribir con: terraform apply -var="lambda_zip_path=/ruta/absoluta/sqs-consumer.zip"
################################################################################

resource "aws_lambda_function" "sqs_consumer" {
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  function_name    = "${var.project_name}-sqs-consumer"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"

  # Configurable por variable: arm64 (Apple Silicon / ARM) o x86_64
  # Sobreescribir con: terraform apply -var="lambda_architecture=x86_64"
  architectures = [var.lambda_architecture]

  environment {
    variables = {
      NODE_ENV = var.environment
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn = aws_sqs_queue.notes_queue.arn
  function_name    = aws_lambda_function.sqs_consumer.arn
  batch_size       = 5
}
