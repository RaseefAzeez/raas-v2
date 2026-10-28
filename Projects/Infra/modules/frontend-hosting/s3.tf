
module "s3_bucket" {


  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = var.frontend_bucket_name


  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  control_object_ownership = true
  object_ownership         = "BucketOwnerEnforced"

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }


  }

  tags = {
    Project     = "raas-v2"
    Name        = "Frontend Hosting Bucket"
    Environment = var.environment
  }
}
