variable "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend content"
  type        = string
}

variable "environment" {
  description = "The environment for the frontend content bucket"
  type        = string
}

variable "web_acl_id" {
  description = "ARN of the existing CloudFront WAF Web ACL"
  type        = string
}
