output "bucketID" {
  value = module.s3_bucket.s3_bucket_id
}

output "bucketARN" {
  value = module.s3_bucket.s3_bucket_arn
}

output "bucketRegionalDomainName" {
  description = "Regional domain name of the frontend S3 bucket"
  value       = module.s3_bucket.s3_bucket_bucket_regional_domain_name
}
