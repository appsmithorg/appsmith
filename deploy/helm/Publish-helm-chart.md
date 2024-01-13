## Prerequisites

- Helm V3: [Install Helm V3](https://helm.sh/docs/intro/install/)
- AWS CLI: [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS CLI Configure: [Configure AWS credential](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) 

## Initialize, Package and publish charts in the Amazon S3 Helm repository

* Create S3 bucket for Helm chart (naming as `helm.appsmith.com` \- Hosting S3 as Static web requires bucket name be the same with the domain\)
* Clone your Helm charts (ignore if already have Appsmith repo on machine)

* Build Helm chart depencies

```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm dependency build ./deploy/helm    
```

* Package the local Helm chart

```
helm package ./deploy/helm
```

* Store the local package in the Amazon S3 Helm repository

```
aws s3 cp ./appsmith-1.4.1.tgz s3://helm.appsmith.com/
```

* Initialize the Amazon S3 Helm repository

```
helm repo index . --url https://helm.appsmith.com
```

* Upload `index.yaml` to S3 bucket

```
aws s3 cp ./index.yaml s3://helm.appsmith.com
```

* Verify the newly created Helm repository by checking that the `index.yml` file was created in the S3 bucket

```
aws s3 ls s3://helm.appsmith.com
```

## Search for and install a chart from the Amazon S3 Helm repository

* Add Helm repo with S3 bucket URL (or Helm URL `https://helm.appsmith.com`)

```
helm repo add appsmith http://helm.appsmith.com
```

* Search for all versions of the my-app chart. Run following command to search all available version of Helm chart

```
helm search repo appsmith --versions 
```

* Install a chart from the Amazon S3 Helm repository

```
helm install appsmith appsmith/appsmith --version 1.4.1
```

## Upgrade your Helm repository 

* Modify the chart

* Change working directory

```
cd /deploy/helm
```

* Build Helm chart depencies

```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm dependency build . 
```

* Note the latest appsmith helm-chart version 
```
helm repo add appsmith http://helm.appsmith.com
helm update
helm search repo appsmith
```

* Update current iteration of helm chart version by editing `Chart.yaml`

* Package Helm chart

```
helm package .
```

* Push the new version to the Helm repository in Amazon S3

```
aws s3 cp ./appsmith-<version>.tgz s3://helm.appsmith.com
```

* Merge the index file with existing index

```
curl http://helm.appsmith.com -o index.yaml
helm repo index --url http://helm.appsmith.com --merge index.yaml
```

* Push updated `index.yaml` file into S3 bucket

```
aws s3 cp index.yaml s3://helm.appsmith.com
```

* Verify the updated Helm chart

```
helm repo update

helm search repo appsmith
```



## Install Appsmith Helm Chart Using Helm URL

* Add Helm repo

```
helm repo add appsmith http://helm.appsmith.com
```

* Update Helm repo

```
helm repo update
```

* Install Helm chart

```
helm install appsmith appsmith/appsmith
```
