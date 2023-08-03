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

# If recreate option is give first delete the existing resources and create them later.
if [[ -n "${RECREATE-}" ]]
then
  kubectl delete ns $NAMESPACE || true
  mongosh "mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" --eval 'db.dropDatabase()'
  ACCESS_POINT_ID=$(aws efs describe-access-points --file-system-id "$DP_EFS_ID" | jq -r '.AccessPoints[] | select(.Name=="'"$PULL_REQUEST_NUMBER"'") | .AccessPointId')
  aws efs delete-access-point --access-point-id $ACCESS_POINT_ID
fi

echo "Create Access Point and Access Point ID"
## Use DP-EFS and create ACCESS_POINT
ACCESS_POINT=$(aws efs create-access-point --file-system-id $DP_EFS_ID --tags Key=Name,Value=ce$PULL_REQUEST_NUMBER)
echo $ACCESS_POINT
export ACCESS_POINT_ID=$(echo $ACCESS_POINT | jq -r '.AccessPointId');
echo $ACCESS_POINT_ID

export NAMESPACE=ce"$PULL_REQUEST_NUMBER"
export CHARTNAME=ce"$PULL_REQUEST_NUMBER"
export SECRET=ce"$PULL_REQUEST_NUMBER"
export DBNAME=ce"$PULL_REQUEST_NUMBER"
export DOMAINNAME=ce-"$PULL_REQUEST_NUMBER".dp.appsmith.com


export HELMCHART="appsmith-ee"
export HELMCHART_URL="http://helm-ee.appsmith.com"
export HELMCHART_VERSION="3.0.4"

aws eks update-kubeconfig --region $region --name $cluster_name --profile eksci

echo "Set the default namespace"
kubectl config set-context --current --namespace=default

echo "Getting the pods"
kubectl get pods

echo "Create Namespace and secret to isolate resources."
echo "Use kubernetes secret to Pull Image"
kubectl create ns $NAMESPACE || true

kubectl create secret docker-registry $SECRET \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=$DOCKER_HUB_USERNAME \
  --docker-password=$DOCKER_HUB_ACCESS_TOKEN -n $NAMESPACE

echo "Add appsmith-ee to helm repo"
AWS_REGION=us-east-2 helm repo add "$HELMCHART" "$HELMCHART_URL"

echo "Deploy appsmith helm chart"
helm upgrade -i $CHARTNAME appsmith-ee/$HELMCHART -n $NAMESPACE --create-namespace --recreate-pods \
  --set _image.repository=$DOCKER_HUB_ORGANIZATION/appsmith-dp --set _image.tag=$IMAGE_HASH \
  --set image.pullSecrets=$SECRET --set autoscaling.enabled=true --set autoscaling.minReplicas=1 \
  --set autoscaling.maxReplicas=1 --set redis.enabled=false --set postgresql.enabled=false --set mongodb.enabled=false --set ingress.enabled=true \
  --set "ingress.annotations.service\.beta\.kubernetes\.io/aws-load-balancer-ssl-cert=$AWS_RELEASE_CERT" \
  --set "ingress.hosts[0].host=$DOMAINNAME, ingress.hosts[0].paths[0].path=/, ingress.hosts[0].paths[0].pathType=Prefix" \
  --set autoupdate.enabled=false --set persistence.efs.enabled=true --set ingress.className="nginx" \
  --set persistence.efs.driver=efs.csi.aws.com --set persistence.storageClass=efs-dp-appsmith \
  --set persistence.efs.volumeHandle=$DP_EFS_ID::$ACCESS_POINT_ID \
  --set applicationConfig.APPSMITH_SENTRY_DSN="https://abf15a075d1347969df44c746cca7eaa@o296332.ingest.sentry.io/1546547" \
  --set applicationConfig.APPSMITH_SENTRY_ENVIRONMENT="$NAMESPACE" \
  --set applicationConfig.APPSMITH_MONGODB_URI="mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" \
  --set applicationConfig.APPSMITH_REDIS_URL="$APPSMITH_DP_REDIS_URL:6379" \
  --set applicationConfig.APPSMITH_DISABLE_EMBEDDED_KEYCLOAK=\"1\" \
  --set applicationConfig.APPSMITH_ENABLE_EMBEDDED_DB=\"0\" \
  --version $HELMCHART_VERSION
