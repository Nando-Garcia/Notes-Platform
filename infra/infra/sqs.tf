################################################################################
# SQS queues for notes
################################################################################

resource "aws_sqs_queue" "notes_dlq" {
  name = "notes-dlq"
}

resource "aws_sqs_queue" "notes_queue" {
  name = "notes-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notes_dlq.arn
    maxReceiveCount     = 3
  })

  visibility_timeout_seconds = 300
}
