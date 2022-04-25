## Goal
- Build new AWS AMI to publish new version for Appsmith Product on AWS Marketplace

## Setup Build Development
- Install Packer [https://www.packer.io/downloads](https://www.packer.io/downloads)
  - MacOS:
  ```
  brew tap hashicorp/tap
  brew install hashicorp/tap/packer
  ```
  - Ubuntu/Debian
  ```
  curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
  sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
  sudo apt-get update && sudo apt-get install packer

## Build Image Using Packer
### Prerequisite
- With Packer, we can build image for multiple platform (AWS, DigitalOcean Snapshot,...). To perform the provisioning for each platform, we will need to configure credentials for each platform as following section
- To access and provisioning a new AWS AMI, you will need setup AWS CLI and configure credentials:
	- Install AWS CLI: [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
	- Configure AWS credentials: [https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- For DigitalOcean, we will need to get and use DigitalOcean API key to provision instance for packaging a new image. Please follow this document to get the API key: [https://www.digitalocean.com/community/tutorials/how-to-create-a-digitalocean-space-and-api-key](https://www.digitalocean.com/community/tutorials/how-to-create-a-digitalocean-space-and-api-key)
- Then, export API using following command:
```
export DIGITALOCEAN_TOKEN=<YOUR_API_KEY>
```
### Build Image
- Change directory to the AWS AMI deployment directory
```
cd deploy/packer
```
- To initialize a new instance for Packer to provision on it, there is a need on configuring the `VPC` and `Subnet`. Please access to your AWS [VPC dashboard](https://console.aws.amazon.com/vpc/home) and check for your `VPC ID` and `Subnet ID` which will be used later in run `packer build` command
- Run Packer build
```
packer build -var 'vpc_id=<your-vpc-id>' -var 'subnet_id=<your-subnet-id>' template.json.pkr.hcl
```
