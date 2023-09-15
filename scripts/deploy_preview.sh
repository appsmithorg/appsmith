#!/bin/bash
# Params are in environment variables as PARAM_{SLUG}, e.g. PARAM_USER_ID

# Configure the AWS & kubectl environment

mkdir ~/.aws; touch ~/.aws/config

aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY

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

sts_output=$(aws sts assume-role --role-arn $AWS_ROLE_ARN --role-session-name ekscisession)

export AWS_ACCESS_KEY_ID=$(echo $sts_output | jq -r '.Credentials''.AccessKeyId');\
export AWS_SECRET_ACCESS_KEY=$(echo $sts_output | jq -r '.Credentials''.SecretAccessKey');\
export AWS_SESSION_TOKEN=$(echo $sts_output | jq -r '.Credentials''.SessionToken');

export NAMESPACE=ce"$PULL_REQUEST_NUMBER"
export CHARTNAME=ce"$PULL_REQUEST_NUMBER"
export SECRET=ce"$PULL_REQUEST_NUMBER"
export DBNAME=ce"$PULL_REQUEST_NUMBER"
export DOMAINNAME=ce-"$PULL_REQUEST_NUMBER".dp.appsmith.com
export HELMCHART="appsmith"
export HELMCHART_URL="http://helm-ee.appsmith.com"
export HELMCHART_VERSION="3.0.7"


aws eks update-kubeconfig --region $region --name $cluster_name --profile eksci

echo "Set the default namespace"
kubectl config set-context --current --namespace=default

echo "Getting pods info"
kubectl get pods

echo "Check if namespace already exists"
namespace_exist=$(kubectl get ns | grep "$NAMESPACE")

if [[ -n "${RECREATE-}" ]]
then
  mongosh "mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" --eval 'db.dropDatabase()'
  pod_name=$(kubectl get pods -n $NAMESPACE -o json | jq '.items[0].metadata.name' | tr -d '"')
  kubectl exec $pod_name -n $NAMESPACE -- bash -c "rm -rf /appsmith-stacks/*"
  kubectl delete ns $NAMESPACE || true
#  Placeholder to use access points more effectively
  kubectl patch pv $NAMESPACE-appsmith -p '{"metadata":{"finalizers":null}}' || true
  kubectl delete pv $NAMESPACE-appsmith --grace-period=0 --force || true
fi

echo "Use kubernetes secret to Pull Image"
kubectl create ns $NAMESPACE || true

kubectl create secret docker-registry $SECRET \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=$DOCKER_HUB_USERNAME \
  --docker-password=$DOCKER_HUB_ACCESS_TOKEN -n $NAMESPACE

echo "Add appsmith-ee to helm repo"
AWS_REGION=us-east-2 helm repo add appsmith-ee $HELMCHART_URL;
helm repo update;
helm plugin install https://github.com/helm/helm-mapkubeapis -n $NAMESPACE
helm plugin ls
helm mapkubeapis $CHARTNAME -n $NAMESPACE

echo "Deploy appsmith helm chart"
helm upgrade -i $CHARTNAME appsmith-ee/$HELMCHART -n $NAMESPACE --create-namespace --recreate-pods \
  --set _image.repository=$DOCKER_HUB_ORGANIZATION/appsmith-dp --set _image.tag=$IMAGE_HASH \
  --set _image.pullPolicy="Always" \
  --set image.pullSecrets=$SECRET --set autoscaling.enabled=true --set autoscaling.minReplicas=1 \
  --set autoscaling.maxReplicas=1 --set redis.enabled=false --set postgresql.enabled=false --set mongodb.enabled=false --set ingress.enabled=true \
  --set "ingress.annotations.service\.beta\.kubernetes\.io/aws-load-balancer-ssl-cert=$AWS_RELEASE_CERT" \
  --set "ingress.hosts[0].host=$DOMAINNAME, ingress.hosts[0].paths[0].path=/, ingress.hosts[0].paths[0].pathType=Prefix" \
  --set autoupdate.enabled=false --set persistence.efs.enabled=true --set ingress.className="nginx" \
  --set persistence.efs.driver=efs.csi.aws.com --set persistence.storageClass=efs-dp-appsmith \
  --set persistence.efs.volumeHandle=$DP_EFS_ID:/ce/ce$PULL_REQUEST_NUMBER \
  --set resources.requests.cpu="1m" \
  --set resources.requests.memory="1Mi" \
  --set applicationConfig.APPSMITH_SENTRY_DSN="https://abf15a075d1347969df44c746cca7eaa@o296332.ingest.sentry.io/1546547" \
  --set applicationConfig.APPSMITH_SENTRY_ENVIRONMENT="$NAMESPACE" \
  --set applicationConfig.APPSMITH_MONGODB_URI="mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$DBNAME?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" \
  --set applicationConfig.APPSMITH_DISABLE_EMBEDDED_KEYCLOAK=\"1\" \
  --version $HELMCHART_VERSION

appsmith_deployment_timeout=1
echo "Wait for pods to be up and running"
until [ \
  "$(curl -s -w '%{http_code}' -o /dev/null "$DOMAINNAME/api/v1/health")" \
  -eq 200 ]
do
  echo "waiting for appsmith to be ready"
  if [[ $appsmith_deployment_timeout -eq 300 ]];then
     echo "timed out"
     break
  fi
  sleep 5
  appsmith_deployment_timeout=$((appsmith_deployment_timeout+5))
done

### Add maildev for recreate and new deployments only
if [[ ${RECREATE} == "true" || ! -n "${namespace_exist}" ]]
then
   echo "modify docker.env to add maildev"
   pod_name=$(kubectl get pods -n $NAMESPACE -o json | jq '.items[0].metadata.name' | tr -d '"')
   kubectl exec -it $pod_name -n $NAMESPACE -- bash -c "cat << EOF >> /appsmith-stacks/configuration/docker.env
   APPSMITH_MAIL_FROM=hello@appsmith.com
   APPSMITH_MAIL_ENABLED="true"
   APPSMITH_MAIL_HOST="maildev.default.svc.cluster.local"
   APPSMITH_MAIL_PORT="8025"
   EOF"
   kubectl exec -it $pod_name -n $NAMESPACE -- bash -c "supervisorctl restart backend"
fi
