variable "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend content"
  type        = string
}

variable "environment" {
  description = "The environment for the frontend content bucket"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod."
  }
}
