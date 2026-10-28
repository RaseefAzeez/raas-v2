terraform {
  backend "s3" {
    bucket       = "raas-v2-terraform-state-061051251789"
    key          = "raas-v2/dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
