output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cdn.cloudfront_distribution_id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = module.cdn.cloudfront_distribution_arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cdn.cloudfront_distribution_domain_name
}
