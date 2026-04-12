# Terraform config with intentional issues for Checkov testing

# CKV_AWS_88: EC2 instance with public IP
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  associate_public_ip_address = true  # Checkov: should be false

  # CKV_AWS_8: No encryption on root volume
  root_block_device {
    volume_size = 20
    encrypted   = false  # Checkov: should be true
  }

  tags = {
    Name = "web-server"
  }
}

# CKV_AWS_23: Security group with unrestricted ingress
resource "aws_security_group" "allow_all" {
  name        = "allow_all"
  description = "Allow all traffic"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]  # Checkov: unrestricted access
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# CKV_AWS_145: S3 bucket without encryption
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
  acl    = "public-read"  # Checkov: S3 bucket should not be public
}

# CKV_AWS_51: RDS without encryption
resource "aws_db_instance" "default" {
  allocated_storage    = 20
  engine               = "mysql"
  engine_version       = "5.7"
  instance_class       = "db.t2.micro"
  name                 = "mydb"
  username             = "admin"
  password             = "plaintext_password_123"  # Hardcoded password
  storage_encrypted    = false  # Checkov: should be true
  publicly_accessible  = true   # Checkov: should be false
  skip_final_snapshot  = true

  # No backup retention
  backup_retention_period = 0  # Checkov: should be > 0
}

# CKV2_AWS_5: No flow logs on VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # Missing: enable_dns_hostnames, flow logs
}
