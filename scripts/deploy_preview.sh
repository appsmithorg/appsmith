#!/bin/bash
# Params are in environment variables as PARAM_{SLUG}, e.g. PARAM_USER_ID

edition=ce

# Configure the AWS & kubectl environment

mkdir ~/.aws; touch ~/.aws/config

aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"

export region=ap-south-1
export cluster_name=uat-cluster

echo "[default]
region = $region
output = json
[profile eksci]
role_arn = $AWS_ROLE_ARN
output = json
region = $region
source_profile = default" > ~/.aws/config

echo "Region: $region"
echo "Cluster name: $cluster_name"
echo "Pull Request Number: $PULL_REQUEST_NUMBER"
echo "DP_EFS_ID: $DP_EFS_ID"

sts_output="$(aws sts assume-role --role-arn "$AWS_ROLE_ARN" --role-session-name ekscisession)"

export AWS_ACCESS_KEY_ID="$(echo "$sts_output" | jq -r .Credentials.AccessKeyId)"
export AWS_SECRET_ACCESS_KEY="$(echo "$sts_output" | jq -r .Credentials.SecretAccessKey)"
export AWS_SESSION_TOKEN="$(echo "$sts_output" | jq -r .Credentials.SessionToken)"

export NAMESPACE="$edition$PULL_REQUEST_NUMBER"
export CHARTNAME="$edition$PULL_REQUEST_NUMBER"
export SECRET="$edition$PULL_REQUEST_NUMBER"
export DBNAME="$edition$PULL_REQUEST_NUMBER"
export DOMAINNAME="$edition-$PULL_REQUEST_NUMBER.dp.appsmith.com"
export HELMCHART="appsmith"
export HELMCHART_URL="http://helm-ee.appsmith.com"
export OPENAI_ASSISTANT_ID="$OPENAI_ASSISTANT_ID"
export OPENAI_API_KEY="$OPENAI_API_KEY"
export APPSMITH_CARBON_API_KEY="$APPSMITH_CARBON_API_KEY"
export APPSMITH_CARBON_API_BASE_PATH="$APPSMITH_CARBON_API_BASE_PATH"
export APPSMITH_AI_SERVER_MANAGED_HOSTING="$APPSMITH_AI_SERVER_MANAGED_HOSTING"
export IN_DOCKER="$IN_DOCKER"


aws eks update-kubeconfig --region "$region" --name "$cluster_name" --profile eksci

echo "Set the default namespace"
kubectl config set-context --current --namespace=default

echo "Getting the pods"
kubectl get pods

if [[ -n "${RECREATE-}" ]]
then
  mongosh "mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" --eval 'db.dropDatabase()'
  pod_name="$(kubectl get pods -n "$NAMESPACE" -o json | jq '.items[0].metadata.name' | tr -d '"')"
  kubectl exec "$pod_name" -n "$NAMESPACE" -- bash -c "rm -rf /appsmith-stacks/*"
  kubectl delete ns "$NAMESPACE" || true
#  Placeholder to use access points more effectively
  kubectl patch pv "$NAMESPACE-appsmith" -p '{"metadata":{"finalizers":null}}' || true
  kubectl delete pv "$NAMESPACE-appsmith" --grace-period=0 --force || true
#  Below lines are a placeholder to use access points more effectively
#  echo "deleting Accessing points"
#  ACCESS_POINT_ID=$(aws efs describe-access-points --file-system-id "$DP_EFS_ID" | jq -r '.AccessPoints[] | select(.Name=="'"$edition$PULL_REQUEST_NUMBER"'") | .AccessPointId')
#  echo "Deleting Accessing Point $ACCESS_POINT_ID"
#  aws efs delete-access-point --access-point-id $ACCESS_POINT_ID
fi

#echo "Create Access Point and Access Point ID"
### Use DP-EFS and create ACCESS_POINT
#ACCESS_POINT=$(aws efs create-access-point --file-system-id $DP_EFS_ID --tags Key=Name,Value=$edition$PULL_REQUEST_NUMBER)
#ACCESS_POINT_ID=$(echo $ACCESS_POINT | jq -r '.AccessPointId');

echo "Use kubernetes secret to Pull Image"
kubectl create ns "$NAMESPACE" || true

kubectl create secret docker-registry "$SECRET" \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username="$DOCKER_HUB_USERNAME" \
  --docker-password="$DOCKER_HUB_ACCESS_TOKEN" -n "$NAMESPACE"

echo "Add appsmith-ee to helm repo"
AWS_REGION=us-east-2 helm repo add appsmith-ee "$HELMCHART_URL"
helm repo update
helm plugin install https://github.com/helm/helm-mapkubeapis -n "$NAMESPACE"
helm plugin ls
helm mapkubeapis "$CHARTNAME" -n "$NAMESPACE"
helm show chart appsmith-ee/$HELMCHART

echo "Deploy appsmith helm chart"
helm upgrade -i "$CHARTNAME" "appsmith-ee/$HELMCHART" -n "$NAMESPACE" --create-namespace --recreate-pods \
  --set _image.repository="$DOCKER_HUB_ORGANIZATION/appsmith-dp" --set _image.tag="$IMAGE_HASH" \
  --set _image.pullPolicy="Always" \
  --set image.pullSecrets="$SECRET" --set autoscaling.enabled=true --set autoscaling.minReplicas=1 \
  --set autoscaling.maxReplicas=1 --set redis.enabled=false --set postgresql.enabled=false --set mongodb.enabled=false --set ingress.enabled=true \
  --set "ingress.annotations.service\.beta\.kubernetes\.io/aws-load-balancer-ssl-cert=$AWS_RELEASE_CERT" \
  --set "ingress.hosts[0].host=$DOMAINNAME, ingress.hosts[0].paths[0].path=/, ingress.hosts[0].paths[0].pathType=Prefix" \
  --set autoupdate.enabled=false --set persistence.efs.enabled=true --set ingress.className="nginx" \
  --set persistence.efs.driver=efs.csi.aws.com --set persistence.storageClass=efs-dp-appsmith \
  --set persistence.efs.volumeHandle="$DP_EFS_ID:/$edition/$edition$PULL_REQUEST_NUMBER" \
  --set resources.requests.cpu="1m" \
  --set podDisruptionBudgets.enabled=false \
  --set resources.requests.memory="2048Mi" \
  --set applicationConfig.APPSMITH_SENTRY_DSN="https://abf15a075d1347969df44c746cca7eaa@o296332.ingest.sentry.io/1546547" \
  --set applicationConfig.APPSMITH_SENTRY_ENVIRONMENT="$NAMESPACE" \
  --set applicationConfig.APPSMITH_DB_URL="mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" \
  --set applicationConfig.APPSMITH_DISABLE_EMBEDDED_KEYCLOAK=\"1\" \
  --set applicationConfig.APPSMITH_OPENAI_ASSISTANT_ID="$OPENAI_ASSISTANT_ID" \
  --set applicationConfig.APPSMITH_OPENAI_API_KEY="$OPENAI_API_KEY" \
  --set applicationConfig.APPSMITH_CARBON_API_KEY="$APPSMITH_CARBON_API_KEY" \
  --set applicationConfig.APPSMITH_CARBON_API_BASE_PATH="$APPSMITH_CARBON_API_BASE_PATH" \
  --set applicationConfig.APPSMITH_AI_SERVER_MANAGED_HOSTING="$APPSMITH_AI_SERVER_MANAGED_HOSTING" \
  --set applicationConfig.APPSMITH_CUSTOMER_PORTAL_URL="https://release-customer.appsmith.com"
