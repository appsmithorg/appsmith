#!/bin/bash
# Configure the AWS & kubectl environment

mkdir ~/.aws; touch ~/.aws/config

echo "[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY" > ~/.aws/credentials

echo "[default]
region = $region
output = json
[profile eksci]
role_arn= $AWS_ROLE_ARN
output = json
region = $region
source_profile = default" > ~/.aws/config

sts_output=$(aws sts assume-role --role-arn env.AWS_ROLE_ARN --role-session-name ekscisession)
export AWS_ACCESS_KEY_ID=$(echo $sts_output | jq -r '.Credentials''.AccessKeyId');\
export AWS_SECRET_ACCESS_KEY=$(echo $sts_output | jq -r '.Credentials''.SecretAccessKey');\
export AWS_SESSION_TOKEN=$(echo $sts_output | jq -r '.Credentials''.SessionToken');

aws eks update-kubeconfig --region ap-south-1 --name uat-cluster --profile eksci

echo "Set the default namespace"
kubectl config set-context --current --namespace=default

echo "Getting the pods"
kubectl get pods

### Get list of helm charts
deployed_charts="$(helm ls -A --filter 'ee[0-9]+' --output json | jq -r '.[].namespace')"

for i in $deployed_charts
  do 
    pr=$(echo $i | cut -c 3-);
    pr_state="$(gh pr view "$pr" --json state --jq .state)"
    echo $pr_state
    if [[ $pr_state == "MERGED" || $pr_state == "CLOSED" ]]
    then
      mongosh "mongodb+srv://$DB_USERNAME:$DB_PASSWORD@$DB_URL/$i?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin" --eval 'db.dropDatabase()'
      pod_name=$(kubectl get pods -n $i -o json | jq '.items[0].metadata.name' | tr -d '"')
      kubectl exec $pod_name -n $i -- bash -c "rm -rf /appsmith-stacks/*"
      helm uninstall $i -n $i
      kubectl delete ns $i || true
      kubectl patch pv $i-appsmith -p '{"metadata":{"finalizers":null}}' || true
      kubectl delete pv $i-appsmith --grace-period=0 --force || true
      PGPASSWORD=$DB_PASSWORD psql -h $DB_URL -U $DB_USERNAME -d postgres -c "DROP DATABASE IF EXISTS $i;"
    fi
  done