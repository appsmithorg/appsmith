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
echo "Pull Request Number: $PULL_REQUEST_NUMBER"

sts_output=$(aws sts assume-role --role-arn env.AWS_ROLE_ARN --role-session-name ekscisession)
export AWS_ACCESS_KEY_ID=$(echo $sts_output | jq -r '.Credentials''.AccessKeyId');\
export AWS_SECRET_ACCESS_KEY=$(echo $sts_output | jq -r '.Credentials''.SecretAccessKey');\
export AWS_SESSION_TOKEN=$(echo $sts_output | jq -r '.Credentials''.SessionToken');
export DP_EFS_ID="fs-058bd95facaa277c8"

## Use DP-EFS and create ACCESS_POINT
ACCESS_POINT=$(aws efs create-access-point --file-system-id $DP_EFS_ID \
               --tags Key=Name,Value=$PULL_REQUEST_NUMBER --posix-user Uid=1003,Gid=1003 \
               --root-directory "{\"Path\": \"/\",\"CreationInfo\":{\"OwnerUid\":1003,\"OwnerGid\":1003, \"Permissions\":\"700\"}}")

export ACCESS_POINT_ID=$(echo $ACCESS_POINT | jq '.AccessPointId' | tr -d '"')
export NAMESPACE=ee"$PULL_REQUEST_NUMBER"
export CHARTNAME=ee"$PULL_REQUEST_NUMBER"
export SECRET=ee"$PULL_REQUEST_NUMBER"
export DBNAME=ee"$PULL_REQUEST_NUMBER"
export DOMAINNAME=ee-"$PULL_REQUEST_NUMBER".dp.appsmith.com


export HELMCHART="appsmith"
export HELMCHART_URL="http://helm-ee.appsmith.com"
export HELMCHART_VERSION="3.0.3"

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
helm upgrade -i $CHARTNAME appsmith-ee/$HELMCHART -n $NAMESPACE \
  --create-namespace --recreate-pods --set image.repository=$DOCKER_HUB_ORGANIZATION/appsmith-dp --set image.tag=$IMAGE_HASH \
  --set image.pullSecrets=$SECRET --set autoscaling.enabled=true --set autoscaling.minReplicas=1 --set autoscaling.maxReplicas=1 \
  --set redis.enabled=false --set mongodb.enabled=false --set ingress.enabled=true \
  --set "ingress.annotations.service\.beta\.kubernetes\.io/aws-load-balancer-ssl-cert=$AWS_RELEASE_CERT" \
  --set "ingress.hosts[0].host=$DOMAINNAME, ingress.hosts[0].paths[0].path=/, ingress.hosts[0].paths[0].pathType=Prefix" \
  --set ingress.className="nginx" --set applicationConfig.APPSMITH_CLOUD_SERVICES_BASE_URL="https://release-cs.appsmith.com" \
  --set image.pullPolicy="Always" --set autoupdate.enabled="true" --set persistence.efs.enabled=true \
  --set persistence.efs.driver="efs.csi.aws.com" --set persistence.efs.volumeHandle="$DP_EFS_ID::$ACCESS_POINT_ID" \
  --set storageClass.enabled= true --set storageClass.provisioner="efs.csi.aws.com" \
  --set applicationConfig.APPSMITH_SENTRY_DSN="https://abf15a075d1347969df44c746cca7eaa@o296332.ingest.sentry.io/1546547" \
  --set applicationConfig.APPSMITH_SENTRY_ENVIRONMENT="$NAMESPACE" \
  --set applicationConfig.APPSMITH_MONGODB_URI="mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" \
  --set applicationConfig.APPSMITH_REDIS_URL="redis-cluster://release-redis-cluster.ihh5sj.clustercfg.aps1.cache.amazonaws.com:6379" \
  --version $HELMCHART_VERSION
