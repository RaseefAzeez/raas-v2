terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

#Module for S3 bucket to host frontend content
module "frontend_content_bucket" {
  source = "../../modules/frontend-hosting"

  frontend_bucket_name = var.frontend_bucket_name
  environment          = var.environment
}

# Module for CloudFront Distribution to serve frontend content from S3 bucket
module "cloudfront_distribution" {
  source = "../../modules/cloudfront"

  environment = var.environment
  web_acl_id  = var.web_acl_id

  s3_bucket_regional_domain_name = (
    module.frontend_content_bucket.bucketRegionalDomainName
  )
}


resource "aws_s3_bucket_policy" "frontend_cloudfront_access" {
  bucket = module.frontend_content_bucket.bucketID

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }

        Action   = "s3:GetObject"
        Resource = "${module.frontend_content_bucket.bucketARN}/*"

        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cloudfront_distribution.distribution_arn
          }
        }
      }
    ]
  })
}
