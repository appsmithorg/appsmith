# Install Appsmith with the MongoDB Kubernetes Operator

> **Preview feature in chart 3.7.0.** Documented for fresh installs in this release. A documented migration path from an existing Bitnami-backed Appsmith release is being prepared separately — if you have an existing install, watch for that documentation before changing `mongodbCommunity.enabled` on a release with production data. Pilot this path on non-production clusters before relying on it for production data.

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

### Verify the install

```bash
kubectl get pods -n appsmith
kubectl get mongodbcommunity -n appsmith
```

Expected output (abridged):

```text
NAME                              READY   STATUS
appsmith-0                        1/1     Running
appsmith-mongo-0                  2/2     Running
appsmith-postgresql-0             1/1     Running
appsmith-redis-master-0           1/1     Running
mongodb-kubernetes-operator-...   1/1     Running

NAME             PHASE     VERSION
appsmith-mongo   Running   8.0.20
```

### Access the UI

```bash
kubectl port-forward -n appsmith svc/appsmith 8080:80
```

Open http://localhost:8080.

For production access, configure an Ingress — see [exposing Appsmith online](https://docs.appsmith.com/getting-started/setup/installation-guides/kubernetes/publish-appsmith-online).

---

## Retrieving the generated MongoDB password

The MongoDB user password is in a Secret named `<mongodbCommunity.name>-password` — for a release named `appsmith` with default naming, that's `appsmith-mongo-password`:

```bash
kubectl get secret appsmith-mongo-password -n appsmith \
  -o jsonpath='{.data.password}' | base64 -d
```

Appsmith itself reads its connection string from an operator-managed Secret:

```bash
kubectl get secret appsmith-mongo-appsmith-appsmith -n appsmith \
  -o jsonpath='{.data.connectionString\.standardSrv}' | base64 -d
```

---

## Common configuration

### Bring your own MongoDB password Secret

If you manage secrets externally (Vault, SOPS, ExternalSecrets, etc.), create the Secret yourself and point the chart at it via `mongodbCommunity.auth.passwordSecretName`. The Secret must contain a single key named `password` holding the plaintext password — the example below uses `kubectl create secret` to show the required format, but you can produce the same shape through whatever tooling you already use.

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

---

## Uninstall

Delete the `MongoDBCommunity` resource first so the operator can finish processing its finalizer while it's still running. Then uninstall the release and remove the namespace:

```bash
# 1. Delete the CR and wait for the operator to clear its finalizer
kubectl delete mongodbcommunity -n appsmith --all --wait=true

# 2. Uninstall Appsmith (and the bundled operator, if enabled)
helm uninstall appsmith -n appsmith

# 3. Remove the namespace
kubectl delete namespace appsmith
```

Skipping step 1 can leave the `MongoDBCommunity` resource stuck with an unresolved finalizer once the operator Deployment is gone, which blocks namespace deletion. If that happens, see the [troubleshooting section](#namespace-deletion-hangs-after-helm-uninstall).

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

### Namespace deletion hangs after `helm uninstall`

**Symptom**: `kubectl delete namespace appsmith` never completes after uninstalling the release. The `MongoDBCommunity` resource is still listed with a `deletionTimestamp` set.

**Cause**: the `MongoDBCommunity` CR has a finalizer that the operator is responsible for removing. When `mongodbOperator.enabled=true`, Helm may tear down the operator Deployment before the operator finishes processing the CR's deletion, leaving the finalizer in place forever.

**Fix**: clear the finalizer manually, then the namespace deletion proceeds:

```bash
kubectl patch mongodbcommunity -n appsmith <mongodbCommunity.name> \
  --type=merge -p '{"metadata":{"finalizers":[]}}'
```

### Appsmith pod stuck in `Init`

**Cause**: the Appsmith init container waits for MongoDB to be reachable. If MongoDB isn't ready, this container keeps retrying.

**Fix**: check MongoDB first (`kubectl get mongodbcommunity -n appsmith`). If the phase is `Running` but Appsmith still won't progress, check the init container logs:

```bash
kubectl logs -n appsmith appsmith-0 -c mongo-init-container
```

### Password init Job fails with image pull error

**Symptom**: `<mongodbCommunity.name>-password-init` Job pod is in `ImagePullBackOff` for `alpine/kubectl`.

**Cause**: the cluster cannot pull `docker.io/alpine/kubectl` — either the registry is unreachable (air-gapped) or policy blocks pulls from Docker Hub.

**Fix**: override the image to point at your registry:

```bash
--set mongodbCommunity.passwordInit.image.registry=my-registry.example.com
--set mongodbCommunity.passwordInit.image.repository=my/kubectl
--set mongodbCommunity.passwordInit.image.tag=1.34.2
```
