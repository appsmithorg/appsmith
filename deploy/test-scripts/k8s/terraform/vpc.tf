# data "aws_subnet_ids" "appsmith_subnet_ids" {
#   vpc_id = var.vpc_id
# }

################ Get default VPC #################
data "aws_vpc" "appsmith_vpc" {
  id = var.vpc_id
}

############### Subnets ####################
/*
  Public Subnet
*/
resource "aws_subnet" "appsmith_subnet_public_a" {
  availability_zone       = var.az_a                                               # Define AZ for subnet
  cidr_block              = cidrsubnet(data.aws_vpc.appsmith_vpc.cidr_block, 4, 4) # Define CIDR-block for subnet
  map_public_ip_on_launch = true                                                   # Map public IP to deployed instances in this VPC
  vpc_id                  = data.aws_vpc.appsmith_vpc.id                           # Link Subnet to VPC

  tags = {
    Name = "${var.environment}_subnet_public_a" # Tag subnet with name
  }
}

resource "aws_subnet" "appsmith_subnet_public_b" {
  availability_zone       = var.az_b                                               # Define AZ for subnet
  cidr_block              = cidrsubnet(data.aws_vpc.appsmith_vpc.cidr_block, 4, 8) # Define CIDR-block for subnet
  map_public_ip_on_launch = true                                                   # Map public IP to deployed instances in this VPC
  vpc_id                  = data.aws_vpc.appsmith_vpc.id                           # Link Subnet to VPC

  tags = {
    Name = "${var.environment}_subnet_public_b" # Tag subnet with name
  }
}

############# Route Tables ##########
data "aws_route_table" "appsmith_router_subnet_public" {
  vpc_id = var.vpc_id
}

# ######### Public Subnet assiosation with Rotute Table ######

resource "aws_route_table_association" "appsmith_public_assoc_1" {
  subnet_id      = aws_subnet.appsmith_subnet_public_a.id
  route_table_id = data.aws_route_table.appsmith_router_subnet_public.id
}

resource "aws_route_table_association" "appsmith_public_assoc_2" {
  subnet_id      = aws_subnet.appsmith_subnet_public_b.id
  route_table_id = data.aws_route_table.appsmith_router_subnet_public.id
}
