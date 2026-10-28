module "cdn" {
  source = "terraform-aws-modules/cloudfront/aws"

  comment    = "RaaS v2 frontend - ${var.environment}"
  web_acl_id = var.web_acl_id

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  origin_access_control = {
    s3_oac = {
      description      = "CloudFront access to RaaS frontend S3 bucket"
      origin_type      = "s3"
      signing_behavior = "always"
      signing_protocol = "sigv4"
    }
  }

  #s3 bucket as origin
  origin = {
    frontend_s3 = {
      domain_name               = var.s3_bucket_regional_domain_name
      origin_access_control_key = "s3_oac"
    }
  }

  # Default cache behavior
  default_cache_behavior = {
    target_origin_id       = "frontend_s3"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    compress          = true
    cache_policy_name = "Managed-CachingOptimized"
  }

  viewer_certificate = {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1"
  }

}
