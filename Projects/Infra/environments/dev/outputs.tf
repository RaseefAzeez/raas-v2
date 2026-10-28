output "frontend_bucket_id" {
  description = "ID of the frontend S3 bucket"
  value       = module.frontend_content_bucket.bucketID
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket"
  value       = module.frontend_content_bucket.bucketARN
}

output "frontend_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend S3 bucket"
  value       = module.frontend_content_bucket.bucketRegionalDomainName
}


output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront_distribution.distribution_id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = module.cloudfront_distribution.distribution_arn
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront_distribution.distribution_domain_name
}
