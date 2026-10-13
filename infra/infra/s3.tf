################################################################################
# S3 Bucket for note file attachments
################################################################################

resource "aws_s3_bucket" "notes_attachments" {
  bucket = "${var.project_name}-attachments"

  tags = {
    Name        = "${var.project_name}-attachments"
    Environment = var.environment
    Project     = var.app_name
  }
}
