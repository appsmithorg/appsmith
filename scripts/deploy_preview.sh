#!/bin/bash
# Params are in environment variables as PARAM_{SLUG}, e.g. PARAM_USER_ID

set -euo pipefail

edition="ce"

# Configure AWS CLI and kubectl environment
mkdir -p ~/.aws
cat > ~/.aws/config <<EOF
[default]
region = ap-south-1
output = json
EOF

aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"

export region="ap-south-1"
export cluster_name="uatx-cluster"

echo "Region: $region"
echo "Cluster name: $cluster_name"
echo "Pull Request Number: $PULL_REQUEST_NUMBER"
echo "DP_EFS_ID: $DP_EFS_ID"

# Set naming context
export NAMESPACE="$edition$PULL_REQUEST_NUMBER"
export CHARTNAME="$edition$PULL_REQUEST_NUMBER"
export SECRET="$edition$PULL_REQUEST_NUMBER"
export DBNAME="$edition$PULL_REQUEST_NUMBER"
export DOMAINNAME="$edition-$PULL_REQUEST_NUMBER.dp.appsmith.com"
export HELMCHART="appsmith"
export HELMCHART_URL="http://helm-ee.appsmith.com"

# Optional environment variables (already set externally)
export OPENAI_ASSISTANT_ID="$OPENAI_ASSISTANT_ID"
export OPENAI_API_KEY="$OPENAI_API_KEY"
export APPSMITH_CARBON_API_KEY="$APPSMITH_CARBON_API_KEY"
export APPSMITH_CARBON_API_BASE_PATH="$APPSMITH_CARBON_API_BASE_PATH"
export APPSMITH_AI_SERVER_MANAGED_HOSTING="$APPSMITH_AI_SERVER_MANAGED_HOSTING"
export IN_DOCKER="$IN_DOCKER"

# Update kubeconfig
aws eks update-kubeconfig --region "$region" --name "$cluster_name"

kubectl config set-context --current --namespace=default
kubectl get pods

# Optional cleanup logic
if [[ -n "${RECREATE-}" ]]; then
  mongosh "mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" --eval 'db.dropDatabase()'
  pod_name="$(kubectl get pods -n "$NAMESPACE" -o json | jq -r '.items[0].metadata.name')"
  kubectl exec "$pod_name" -n "$NAMESPACE" -- bash -c "rm -rf /appsmith-stacks/*"
  kubectl delete ns "$NAMESPACE" || true
  kubectl patch pv "$NAMESPACE-appsmith" -p '{"metadata":{"finalizers":null}}' || true
  kubectl delete pv "$NAMESPACE-appsmith" --grace-period=0 --force || true
fi

# Create namespace and image pull secret
kubectl create ns "$NAMESPACE" || true

kubectl create secret docker-registry "$SECRET" \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username="$DOCKER_HUB_USERNAME" \
  --docker-password="$DOCKER_HUB_ACCESS_TOKEN" \
  -n "$NAMESPACE" || true

# Add Helm repo (idempotent)
AWS_REGION=us-east-2 helm repo add appsmith-ee "$HELMCHART_URL" || echo "Helm repo already added."
helm repo update

# Attempt to install the plugin only if it's not installed
if ! helm plugin list | grep -q mapkubeapis; then
  echo "Installing mapkubeapis plugin..."
  helm plugin install https://github.com/helm/helm-mapkubeapis || echo "Plugin installation failed, continuing..."
else
  echo "mapkubeapis plugin already installed."
fi

# Run mapkubeapis (safe to fail)
echo "Running helm mapkubeapis (optional)..."
helm mapkubeapis "$CHARTNAME" -n "$NAMESPACE" || echo "mapkubeapis failed, continuing..."

# Show chart metadata
helm show chart appsmith-ee/$HELMCHART || echo "helm show chart failed (non-blocking)."

echo "Deploying Appsmith Helm chart..."
helm upgrade -i "$CHARTNAME" "appsmith-ee/$HELMCHART" -n "$NAMESPACE" --create-namespace --recreate-pods \
  --set _image.repository="$DOCKER_HUB_ORGANIZATION/appsmith-dp" \
  --set _image.tag="$IMAGE_HASH" \
  --set _image.pullPolicy="Always" \
  --set image.pullSecrets="$SECRET" \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=1 \
  --set autoscaling.maxReplicas=1 \
  --set redis.enabled=false \
  --set postgresql.enabled=false \
  --set mongodb.enabled=false \
  --set ingress.enabled=true \
  --set "ingress.annotations.service\.beta\.kubernetes\.io/aws-load-balancer-ssl-cert=$AWS_RELEASE_CERT" \
  --set "ingress.hosts[0].host=$DOMAINNAME, ingress.hosts[0].paths[0].path=/, ingress.hosts[0].paths[0].pathType=Prefix" \
  --set autoupdate.enabled=false \
  --set ingress.className="nginx" \
  --set persistence.efs.enabled=true \
  --set persistence.efs.driver="efs.csi.aws.com" \
  --set persistence.storageClass="efs-sc" \
  --set persistence.efs.volumeHandle="$DP_EFS_ID:/$edition/$edition$PULL_REQUEST_NUMBER" \
  --set resources.requests.cpu="1m" \
  --set resources.requests.memory="3072Mi" \
  --set podDisruptionBudgets.enabled=false \
  --set applicationConfig.APPSMITH_SENTRY_DSN="https://abf15a075d1347969df44c746cca7eaa@o296332.ingest.sentry.io/1546547" \
  --set applicationConfig.APPSMITH_SENTRY_ENVIRONMENT="$NAMESPACE" \
  --set applicationConfig.APPSMITH_DB_URL="mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" \
  --set applicationConfig.OPENAI_ASSISTANT_ID="$OPENAI_ASSISTANT_ID" \
  --set applicationConfig.OPENAI_API_KEY="$OPENAI_API_KEY" \
  --set applicationConfig.APPSMITH_CARBON_API_KEY="$APPSMITH_CARBON_API_KEY" \
  --set applicationConfig.APPSMITH_CARBON_API_BASE_PATH="$APPSMITH_CARBON_API_BASE_PATH" \
  --set applicationConfig.APPSMITH_AI_SERVER_MANAGED_HOSTING="$APPSMITH_AI_SERVER_MANAGED_HOSTING" \
  --set applicationConfig.IN_DOCKER="$IN_DOCKER" \
  --set applicationConfig.APPSMITH_CUSTOMER_PORTAL_URL="https://release-customer.appsmith.com" \
  --set affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[0].matchExpressions[0].key=instance_name \
  --set affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[0].matchExpressions[0].operator=In \
  --set affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[0].matchExpressions[0].values[0]=uatx-shared \
  --set tolerations[0].key=instance_name \
  --set tolerations[0].operator=Equal \
  --set tolerations[0].value=uatx-shared \
  --set tolerations[0].effect=NoSchedule
