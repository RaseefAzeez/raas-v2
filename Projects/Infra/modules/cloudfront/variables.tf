variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend S3 bucket"
  type        = string
}

variable "web_acl_id" {
  description = "ARN of the existing CloudFront WAF Web ACL"
  type        = string
}
