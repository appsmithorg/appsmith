#!/bin/bash
# Params are in environment variables as PARAM_{SLUG}, e.g. PARAM_USER_ID

# Configure the AWS & kubectl environment

mkdir ~/.aws; touch ~/.aws/config

echo "[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY" > ~/.aws/credentials

echo "[default]
[profile eksci]
role_arn= $AWS_ROLE_ARN
output = json
region=ap-south-1
source_profile = default" > ~/.aws/config

export region=ap-south-1
export cluster_name=uat-cluster

echo "Region: $region"
echo "Cluster name: $cluster_name"
echo "Sub Domain Name: $SUB_DOMAIN_NAME"

sts_output=$(aws sts assume-role --role-arn env.AWS_ROLE_ARN --role-session-name ekscisession)
export AWS_ACCESS_KEY_ID=$(echo $sts_output | jq -r '.Credentials''.AccessKeyId');\
export AWS_SECRET_ACCESS_KEY=$(echo $sts_output | jq -r '.Credentials''.SecretAccessKey');\
export AWS_SESSION_TOKEN=$(echo $sts_output | jq -r '.Credentials''.SessionToken');

export NAMESPACE="$SUB_DOMAIN_NAME"
export CHARTNAME="$SUB_DOMAIN_NAME"
export SECRET="$SUB_DOMAIN_NAME"
export DBNAME="$SUB_DOMAIN_NAME"
export DOMAINNAME="$SUB_DOMAIN_NAME".dp.appsmith.com
export HELMCHART="appsmith"
export HELMCHART_URL="http://helm.appsmith.com"
export HELMCHART_VERSION="2.0.2"

aws eks update-kubeconfig --region $region --name $cluster_name --profile eksci

echo "Set the default namespace"
kubectl config set-context --current --namespace=default

echo "Getting the pods"
kubectl get pods

if [[ -n "${RECREATE-}" ]]
then
  kubectl delete ns $NAMESPACE || true
  mongosh "mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" --eval 'db.dropDatabase()'
fi

echo "Use kubernetes secret to Pull Image"
kubectl create ns $NAMESPACE || true

kubectl create secret docker-registry $SECRET \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=$DOCKER_HUB_USERNAME \
  --docker-password=$DOCKER_HUB_ACCESS_TOKEN -n $NAMESPACE

echo "Add appsmith-ce to helm repo"
AWS_REGION=ap-south-1 helm repo add $HELMCHART $HELMCHART_URL

echo "Deploy appsmith helm chart"
helm upgrade -i $CHARTNAME appsmith/appsmith -n $NAMESPACE \
  --create-namespace --recreate-pods --set image.repository=$DOCKER_HUB_ORGANIZATION/appsmith-dp --set image.tag=$IMAGE_HASH \
  --set image.pullSecrets=$SECRET --set redis.enabled=false --set mongodb.enabled=false --set ingress.enabled=true \
  --set "ingress.annotations.service\.beta\.kubernetes\.io/aws-load-balancer-ssl-cert=$AWS_RELEASE_CERT" \
  --set "ingress.hosts[0].host=$DOMAINNAME, ingress.hosts[0].paths[0].path=/, ingress.hosts[0].paths[0].pathType=Prefix" \
  --set ingress.className="nginx" \
  --set image.pullPolicy="Always" --set autoupdate.enabled="true" --set persistence.size=2Gi \
  --set applicationConfig.APPSMITH_MONGODB_URI="mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" \
  --version $HELMCHART_VERSION
