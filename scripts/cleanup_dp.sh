#!/bin/bash
# Configure the AWS & kubectl environment

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

# Update kubeconfig
aws eks update-kubeconfig --region "$region" --name "$cluster_name"

echo "Set the default namespace"
kubectl config set-context --current --namespace=default

echo "Getting the pods"
kubectl get pods

### Get list of helm charts
deployed_charts="$(helm ls -A --filter 'ce[0-9]+' --output json | jq -r '.[].namespace')"

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
    fi
  done
