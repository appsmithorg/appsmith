# Install Appsmith with the MongoDB Community Operator

This guide installs Appsmith using the [MongoDB Community Operator](https://github.com/mongodb/mongodb-kubernetes-operator) to manage the underlying MongoDB replica set. This is an alternative to the Bitnami MongoDB subchart that ships with the chart by default.

## Why use the operator

- MongoDB pods are managed by a dedicated controller that handles replica set membership, TLS/SCRAM credential lifecycle, and version upgrades
- The controller creates and maintains the connection-string secret that Appsmith consumes — no manual URL assembly
- Stays on supported, actively maintained MongoDB images (the Bitnami `mongodb` image has been deprecated by its publisher)

## What this chart does

When `mongodbCommunity.enabled: true`, the chart:

- Renders a `MongoDBCommunity` custom resource that the operator reconciles into a replica set
- Runs a one-time, idempotent pre-install Job that generates a random password and stores it in a Kubernetes Secret (unless you supply your own)
- Wires the Appsmith workload to read MongoDB's connection string from the operator-managed secret

The chart does **not** install the MongoDB Community Operator itself — that's a one-time cluster-level concern and must be handled separately (see Prerequisites).

---

## Prerequisites

1. Kubernetes 1.28+ (any distribution)
2. [Helm 3.14+](https://helm.sh/docs/intro/install/)
3. `kubectl` configured for the target cluster
4. A default `StorageClass` (or one you'll pass explicitly via `--set global.storageClass=<name>`)
5. **The MongoDB Community Operator installed in the cluster** (see below)

### Install the MongoDB Community Operator

The operator installs its own CRDs and reconciles `MongoDBCommunity` resources into running MongoDB replica sets. **By default, it only watches the namespace it is installed in.** To reconcile CRs in other namespaces — for example, when you install Appsmith somewhere other than the operator's namespace — install the operator cluster-wide or set an explicit watch list.

**Option A — Cluster-wide watch (recommended for multi-namespace setups):**

```bash
helm install mongodb-operator \
  oci://ghcr.io/mongodb/helm-charts/community-operator \
  --version 0.13.0 \
  --namespace mongodb-operator --create-namespace \
  --set operator.watchNamespace="*"
```

**Option B — Operator in the same namespace as Appsmith (simplest single-tenant setup):**

```bash
kubectl create namespace appsmith
helm install mongodb-operator \
  oci://ghcr.io/mongodb/helm-charts/community-operator \
  --version 0.13.0 --namespace appsmith
```

With Option B the operator only watches its own namespace (the default), which is the same namespace you'll install Appsmith into — so no `watchNamespace` flag is required.

Verify:

```bash
kubectl get deploy -A -l app.kubernetes.io/name=mongodb-kubernetes-operator
kubectl get crd mongodbcommunity.mongodbcommunity.mongodb.com
```

Alternative install methods (OLM, Kustomize, OperatorHub, etc.) are supported — this chart only requires that the operator is running, has watch scope over the namespace where you'll install Appsmith, and that the CRD is installed in the cluster before you enable `mongodbCommunity.enabled`.

---

## Install Appsmith

Once the operator is running, install Appsmith:

```bash
helm repo add appsmith https://helm.appsmith.com
helm repo update

kubectl create namespace appsmith

helm install appsmith appsmith/appsmith -n appsmith --wait --timeout 10m \
  --set mongodb.enabled=false \
  --set mongodbCommunity.enabled=true
```

Explanation:

| Flag | Purpose |
|---|---|
| `mongodb.enabled=false` | Don't deploy the default Bitnami MongoDB subchart |
| `mongodbCommunity.enabled=true` | Deploy a `MongoDBCommunity` CR for the operator to reconcile |

No MongoDB password needs to be supplied — the chart's pre-install Job autogenerates one.

### Verify the install

```bash
kubectl get pods -n appsmith
kubectl get mongodbcommunity -n appsmith
```

Expected output (abridged):

```
NAME                                     READY   STATUS
appsmith-0                               1/1     Running
appsmith-mongodb-0                       2/2     Running
appsmith-postgresql-0                    1/1     Running
appsmith-redis-master-0                  1/1     Running

NAME               PHASE     VERSION
appsmith-mongodb   Running   8.0.20
```

### Access the UI

```bash
kubectl port-forward -n appsmith svc/appsmith 8080:80
```

Open http://localhost:8080.

For production access, configure an Ingress — see [exposing Appsmith online](https://docs.appsmith.com/getting-started/setup/installation-guides/kubernetes/publish-appsmith-online).

---

## Retrieving the generated MongoDB password

The MongoDB user password is in a Secret named `appsmith-mongodb-password`:

```bash
kubectl get secret appsmith-mongodb-password -n appsmith \
  -o jsonpath='{.data.password}' | base64 -d
```

Appsmith itself reads its connection string from an operator-managed Secret:

```bash
kubectl get secret appsmith-mongodb-appsmith-appsmith -n appsmith \
  -o jsonpath='{.data.connectionString\.standardSrv}' | base64 -d
```

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
  --set mongodbCommunity.auth.passwordSecretName=my-mongodb-secret
```

When `mongodbCommunity.auth.passwordSecretName` is set, the chart skips the pre-install Job and assumes the Secret is correctly populated.

### Resource sizing

The defaults fit a development cluster. For production, pin replica count, resources, and storage:

```yaml
mongodbCommunity:
  enabled: true
  members: 3                         # replica set size
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

---

## Deploying with ArgoCD

With this chart, the simplest GitOps pattern is two Applications:

1. **Operator Application** — installs the MongoDB Community Operator once per cluster
2. **Appsmith Application** — installs Appsmith with `mongodbCommunity.enabled=true`

The operator Application should complete first, or users can simply install the operator out-of-band (via `helm install` or kubectl) before creating the Appsmith Application.

Example Appsmith `Application`:

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
  destination:
    server: https://kubernetes.default.svc
    namespace: appsmith
  syncPolicy:
    automated: {}
    syncOptions:
      - CreateNamespace=true
```

The Appsmith Application will fail to sync if the operator's CRD is not present in the cluster. Install the operator first — either via a sibling Application (with a `sync-wave` ordering it ahead) or out-of-band.

---

## Uninstall

```bash
helm uninstall appsmith -n appsmith
kubectl delete namespace appsmith
```

This removes the Appsmith release and all operator-reconciled resources tied to its `MongoDBCommunity` CR. The MongoDB Community Operator itself, its CRDs, and any other `MongoDBCommunity` resources elsewhere in the cluster are unaffected.

To fully remove the operator:

```bash
helm uninstall mongodb-operator -n mongodb-operator
kubectl delete namespace mongodb-operator
kubectl delete crd mongodbcommunity.mongodbcommunity.mongodb.com
```

**Warning**: deleting the CRD removes all `MongoDBCommunity` resources across the cluster — only do this if nothing else relies on the operator.

---

## Troubleshooting

### Install fails with "no matches for kind MongoDBCommunity"

**Symptom**:

```
Error: INSTALLATION FAILED: unable to build kubernetes objects from release manifest:
resource mapping not found for name: "appsmith-mongodb" namespace: "appsmith" from "":
no matches for kind "MongoDBCommunity" in version "mongodbcommunity.mongodb.com/v1"
ensure CRDs are installed first
```

**Cause**: the MongoDB Community Operator (and its CRD) isn't installed in the cluster. This chart requires the operator as a prerequisite — see the [Prerequisites](#prerequisites) section.

**Fix**: install the operator, then retry the Appsmith install:

```bash
helm install mongodb-operator \
  oci://ghcr.io/mongodb/helm-charts/community-operator \
  --version 0.13.0 \
  --namespace mongodb-operator --create-namespace
```

### MongoDB pod stuck in `Pending`

**Symptom**: `appsmith-mongodb-0` is `Pending` and `kubectl describe pod` shows `pod has unbound immediate PersistentVolumeClaims`.

**Cause**: no default `StorageClass` or the specified class can't provision.

**Fix**: pass a valid class:

```bash
--set global.storageClass=<your-class>
# or, to scope only to MongoDB:
--set mongodbCommunity.persistent.storageClass=<your-class>
```

### `MongoDBCommunity` CR stays in `Pending` phase

**Symptom**:

```
NAME               PHASE     VERSION
appsmith-mongodb   Pending
```

**Check**: operator logs

```bash
kubectl logs -n mongodb-operator -l app.kubernetes.io/name=mongodb-kubernetes-operator --tail=50
```

Common causes:
- The password Secret (`appsmith-mongodb-password`) doesn't exist. If you set `mongodbCommunity.auth.passwordSecretName`, verify the Secret exists and has a `password` key.
- The MongoDB image can't be pulled. Check `kubectl describe pod appsmith-mongodb-0` for image-pull errors.
- The operator isn't watching the namespace. Confirm the operator's watch scope includes your namespace.

### Appsmith pod stuck in `Init`

**Symptom**: `appsmith-0` is in `Init:1/3` or similar for more than a minute.

**Cause**: the Appsmith pod's init container waits for MongoDB to be reachable. If MongoDB is not yet ready, this container keeps retrying.

**Fix**: check MongoDB first (`kubectl get mongodbcommunity -n appsmith`). If the phase is `Running` but Appsmith still won't progress, check the init container logs:

```bash
kubectl logs -n appsmith appsmith-0 -c mongo-init-container
```

### Password init Job fails with image pull error

**Symptom**: `appsmith-mongodb-password-init` Job pod is in `ImagePullBackOff` with a `not found` error for `alpine/kubectl:<version>`.

**Cause**: the pinned `alpine/kubectl` image tag isn't published on Docker Hub. The `alpine/kubectl` repository only publishes recent versions.

**Fix**: in your own environment, mirror the image to a registry you control, or update the chart to a supported tag. If you see this in a released chart version, report it as a bug.
