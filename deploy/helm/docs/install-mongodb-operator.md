# Install Appsmith with the MongoDB Kubernetes Operator

This guide installs Appsmith with MongoDB managed by the [MongoDB Kubernetes Operator](https://github.com/mongodb/mongodb-kubernetes) instead of the default Bitnami MongoDB subchart.

## Why use the operator

- MongoDB pods are managed by a dedicated controller that handles replica set membership, TLS/SCRAM credential lifecycle, and version upgrades
- The controller creates and maintains the connection-string secret that Appsmith consumes — no manual URL assembly
- Stays on supported, actively maintained MongoDB images (the Bitnami `mongodb` image has been deprecated by its publisher)

## What this chart does

When `mongodbCommunity.enabled: true`, the chart:

- Renders a `MongoDBCommunity` custom resource that the operator reconciles into a replica set
- Runs a one-time, idempotent pre-install Job that generates a random password and stores it in a Kubernetes Secret (unless you supply your own)
- Wires the Appsmith workload to read MongoDB's connection string from the operator-managed secret

When `mongodbOperator.enabled: true` (recommended for new installs), the chart also pulls the upstream `mongodb-kubernetes` chart as a subchart, which installs the operator pod and the required CRDs.

---

## Prerequisites

1. Kubernetes 1.28+
2. [Helm 3.14+](https://helm.sh/docs/intro/install/)
3. `kubectl` configured for the target cluster
4. A default `StorageClass` (or one you'll pass explicitly via `--set global.storageClass=<name>`)

No separate operator install is required — the chart can bundle it (see below).

---

## Quickstart — fresh install with bundled operator

```bash
helm repo add appsmith https://helm.appsmith.com
helm repo update

kubectl create namespace appsmith

helm install appsmith appsmith/appsmith -n appsmith --wait --timeout 10m \
  --set mongodb.enabled=false \
  --set mongodbCommunity.enabled=true \
  --set mongodbOperator.enabled=true
```

Explanation:

| Flag | Purpose |
|---|---|
| `mongodb.enabled=false` | Don't deploy the default Bitnami MongoDB subchart |
| `mongodbCommunity.enabled=true` | Deploy a `MongoDBCommunity` CR for the operator to reconcile |
| `mongodbOperator.enabled=true` | Install the upstream MongoDB Kubernetes Operator subchart in the same namespace |

No MongoDB password needs to be supplied — the chart's pre-install Job autogenerates one.

### Verify the install

```bash
kubectl get pods -n appsmith
kubectl get mongodbcommunity -n appsmith
```

Expected output (abridged):

```
NAME                                                  READY   STATUS
appsmith-0                                            1/1     Running
appsmith-mongodb-community-0                          2/2     Running
appsmith-postgresql-0                                 1/1     Running
appsmith-redis-master-0                               1/1     Running
mongodb-kubernetes-operator-...                       1/1     Running

NAME                         PHASE     VERSION
appsmith-mongodb-community   Running   8.0.20
```

(Names shown assume a release named `appsmith`. The operator-managed resources are prefixed with `<release-fullname>-mongodb-community` by default — see `mongodbCommunity.name` to override.)

### Access the UI

```bash
kubectl port-forward -n appsmith svc/appsmith 8080:80
```

Open http://localhost:8080.

For production access, configure an Ingress — see [exposing Appsmith online](https://docs.appsmith.com/getting-started/setup/installation-guides/kubernetes/publish-appsmith-online).

---

## Retrieving the generated MongoDB password

The MongoDB user password is in a Secret named `<mongodbCommunity.name>-password` — for a release named `appsmith` with default naming, that's `appsmith-mongodb-community-password`:

```bash
kubectl get secret appsmith-mongodb-community-password -n appsmith \
  -o jsonpath='{.data.password}' | base64 -d
```

Appsmith itself reads its connection string from an operator-managed Secret:

```bash
kubectl get secret appsmith-mongodb-community-appsmith-appsmith -n appsmith \
  -o jsonpath='{.data.connectionString\.standardSrv}' | base64 -d
```

---

## Alternative: use a pre-existing operator

If the MongoDB Kubernetes Operator is already installed elsewhere in the cluster (a separate Helm release, OLM, Kustomize, etc.), leave `mongodbOperator.enabled=false` and ensure the `mongodb-kubernetes-appdb` ServiceAccount exists in the Appsmith namespace:

```bash
helm install appsmith appsmith/appsmith -n appsmith --wait --timeout 10m \
  --set mongodb.enabled=false \
  --set mongodbCommunity.enabled=true
  # mongodbOperator.enabled defaults to false
```

Cross-namespace operator setups have an asymmetric behavior in the upstream chart worth knowing about — see [Cross-namespace operator setups](#cross-namespace-operator-setups) below.

---

## Common configuration

### Bring your own MongoDB password Secret

If you manage secrets externally (Vault, SOPS, ExternalSecrets, etc.), create the Secret first and point the chart at it:

```bash
kubectl create secret generic my-mongodb-secret \
  -n appsmith \
  --from-literal=password='<your-password>'

helm install appsmith appsmith/appsmith -n appsmith --wait --timeout 10m \
  --set mongodb.enabled=false \
  --set mongodbCommunity.enabled=true \
  --set mongodbOperator.enabled=true \
  --set mongodbCommunity.auth.passwordSecretName=my-mongodb-secret
```

When `mongodbCommunity.auth.passwordSecretName` is set, the chart skips the pre-install Job and assumes the Secret is correctly populated.

### Resource sizing and HA

The chart's defaults are tuned for evaluation and dev: a single-member replica set with modest storage. MongoDB is fully functional in this mode but has no failover.

For production, scale to three members, pin resources, and set an explicit `StorageClass`:

```yaml
mongodbCommunity:
  enabled: true
  members: 3                         # replica set size (odd number recommended)
  persistent:
    storageSize: 100Gi
    storageClass: gp3                # or omit to use cluster default
  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      memory: 4Gi
```

Scaling from 1 to 3 after the fact is a value change on upgrade — the operator handles adding members to the replica set without downtime.

### Cross-namespace operator setups

When `mongodbOperator.enabled=true`, the operator is installed in the same namespace as Appsmith, and its `mongodb-kubernetes-appdb` ServiceAccount ends up where it's needed — no special handling required.

When running the operator in a *different* namespace from Appsmith (pre-existing install, multi-tenant setup), be aware of an upstream chart quirk:

- The operator pod needs to watch the Appsmith namespace (via `operator.watchNamespace`)
- The `mongodb-kubernetes-appdb` ServiceAccount must exist *in the Appsmith namespace*
- If the operator was installed with `operator.watchNamespace="*"` (wildcard), the upstream chart does **not** create the per-namespace RBAC — it only installs it in the operator's own namespace. This causes MongoDB StatefulSet creation to fail with `serviceaccount "mongodb-kubernetes-appdb" not found`

The clean fix is to install the operator with an explicit namespace list:

```bash
helm install mongodb-operator mongodb/mongodb-kubernetes \
  --version 1.8.0 \
  --namespace mongodb-operator --create-namespace \
  --set operator.watchNamespace="appsmith"
```

This creates the `mongodb-kubernetes-appdb` ServiceAccount + RBAC in every listed namespace. To add namespaces later, upgrade the operator release with an expanded list.

---

## Deploying with ArgoCD

The bundled operator path works cleanly with ArgoCD because the CRDs live in the upstream chart's `crds/` directory — Helm (and ArgoCD) install them before any templates are validated.

Example `Application`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: appsmith
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://helm.appsmith.com
    chart: appsmith
    targetRevision: <chart-version>
    helm:
      valuesObject:
        mongodb:
          enabled: false
        mongodbCommunity:
          enabled: true
        mongodbOperator:
          enabled: true
  destination:
    server: https://kubernetes.default.svc
    namespace: appsmith
  syncPolicy:
    automated: {}
    syncOptions:
      - CreateNamespace=true
```

If you prefer a separate Application for the operator (for example, because the operator should be cluster-wide infrastructure while Appsmith is an app-team concern), set `mongodbOperator.enabled=false` on this Application and manage the operator via its own chart/Application.

---

## Uninstall

```bash
helm uninstall appsmith -n appsmith
kubectl delete namespace appsmith
```

This removes Appsmith, the bundled operator (if installed via this chart), and all operator-reconciled resources tied to its `MongoDBCommunity` CR.

The MongoDB CRDs installed by the subchart persist after uninstall (Helm never removes resources from `crds/`). To fully clean up:

```bash
kubectl delete crd mongodbcommunity.mongodbcommunity.mongodb.com
# The mongodb-kubernetes chart also installs CRDs for its enterprise features:
kubectl delete crd mongodb.mongodb.com
kubectl delete crd mongodbusers.mongodb.com
# (and any others from the chart you want to remove)
```

**Warning**: deleting these CRDs removes all matching resources across the cluster — only do this if nothing else relies on the operator.

---

## Troubleshooting

### `MongoDBCommunity` CR stays in `Pending` phase

**Check**: operator logs

```bash
kubectl logs -n appsmith -l app.kubernetes.io/name=mongodb-kubernetes-operator --tail=50
```

Common causes:
- The password Secret doesn't exist. If you set `mongodbCommunity.auth.passwordSecretName`, verify the Secret exists and has a `password` key.
- The MongoDB image can't be pulled. Check `kubectl describe pod <mongodbCommunity.name>-0` for image-pull errors.

### StatefulSet fails with `serviceaccount "mongodb-kubernetes-appdb" not found`

**Cause**: the operator is in a different namespace and was installed with `operator.watchNamespace="*"`. See [Cross-namespace operator setups](#cross-namespace-operator-setups).

**Fix**: reinstall or upgrade the operator with an explicit watch namespace list:

```bash
helm upgrade mongodb-operator mongodb/mongodb-kubernetes \
  -n <operator-namespace> --reuse-values \
  --set operator.watchNamespace="appsmith"
```

Then restart the operator: `kubectl rollout restart deploy/mongodb-kubernetes-operator -n <operator-namespace>`.

### Appsmith pod stuck in `Init`

**Cause**: the Appsmith init container waits for MongoDB to be reachable. If MongoDB isn't ready, this container keeps retrying.

**Fix**: check MongoDB first (`kubectl get mongodbcommunity -n appsmith`). If the phase is `Running` but Appsmith still won't progress, check the init container logs:

```bash
kubectl logs -n appsmith appsmith-0 -c mongo-init-container
```

### Password init Job fails with image pull error

**Symptom**: `<mongodbCommunity.name>-password-init` Job pod is in `ImagePullBackOff` for `alpine/kubectl:<version>`.

**Cause**: the pinned `alpine/kubectl` image tag isn't published on Docker Hub. The repository only publishes recent versions.

**Fix**: mirror the image to a registry you control, or update the chart to a supported tag. Report as a bug if you see this in a released chart version.
