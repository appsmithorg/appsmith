#!/bin/bash
# Configure the kubectl environment
# AWS credentials are provided via OIDC (configure-aws-credentials action)

export region="ap-south-1"
export cluster_name="uatx-cluster"

# Previews of an edition run in namespaces named <edition><PR number>, for example ee1234.
case "${EDITION:-}" in
  ce | ee) ;;
  *)
    echo "EDITION must be ce or ee, got '${EDITION:-}'" >&2
    exit 1
    ;;
esac

# Update kubeconfig
aws eks update-kubeconfig --region "$region" --name "$cluster_name"

### List the preview namespaces of this edition
if ! namespaces="$(kubectl get namespaces --request-timeout=60s --no-headers -o custom-columns=NAME:.metadata.name)"; then
  echo "Could not list namespaces" >&2
  exit 1
fi
preview_namespaces="$(grep -E "^${EDITION}[0-9]+\$" <<< "$namespaces")"

for i in $preview_namespaces
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
