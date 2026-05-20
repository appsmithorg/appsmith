# appsmith

Appsmith is an open source framework to build admin panels, CRUD apps and workflows. Build everything you need, 10x faster.

Appsmith is an open-source platform for building internal tools, admin panels, dashboards, and workflows.
Connect to any datasource, drag-and-drop UI components, and deploy in minutes.

## Installation

See the [Kubernetes installation guide](https://docs.appsmith.com/getting-started/setup/installation-guides/kubernetes)
for prerequisites, step-by-step setup, and platform-specific instructions (EKS, GKE, Minikube, etc.).

## Values

### Redis (Bitnami subchart)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| redis.enabled | bool | `true` | Deploy the bundled Bitnami Redis subchart |

### MongoDB (Bitnami subchart)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| mongodb.enabled | bool | `true` | Deploy the bundled Bitnami MongoDB subchart |

### MongoDB Community Operator

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| mongodbCommunity.enabled | bool | `false` | Deploy a MongoDBCommunity custom resource |
| mongodbCommunity.name | string | `""` | Name of the MongoDBCommunity custom resource |
| mongodbCommunity.version | string | `"8.0.20"` | MongoDB version to deploy |
| mongodbCommunity.members | int | `1` | Number of replica set members |
| mongodbCommunity.auth.username | string | `"appsmith"` | MongoDB user for Appsmith |
| mongodbCommunity.auth.database | string | `"appsmith"` | Authentication database (also used as connection path) |
| mongodbCommunity.auth.passwordSecretName | string | `""` | Name of an existing Secret containing the password (key: password) |
| mongodbCommunity.persistent.storageSize | string | `"10Gi"` | Storage size for each MongoDB replica |
| mongodbCommunity.persistent.storageClass | string | `""` | StorageClass for MongoDB PVCs (empty uses cluster default) |
| mongodbCommunity.resources | object | `{}` | Resource requests/limits for MongoDB containers |
| mongodbCommunity.nodeSelector | object | `{}` | Node selector for MongoDB pods |
| mongodbCommunity.affinity | object | `{}` | Affinity rules for MongoDB pods |
| mongodbCommunity.tolerations | list | `[]` | Tolerations for MongoDB pods |
| mongodbCommunity.passwordInit.image.registry | string | `"docker.io"` | Registry for the kubectl image |
| mongodbCommunity.passwordInit.image.repository | string | `"alpine/kubectl"` | Repository path for the kubectl image |
| mongodbCommunity.passwordInit.image.tag | string | `"latest"` | Image tag. "latest" is used by default to sidestep upstream tag retention; pin for reproducibility. |
| mongodbCommunity.passwordInit.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the Job |
| mongodbOperator.enabled | bool | `false` | Install the MongoDB Kubernetes Operator subchart |

### PostgreSQL (Bitnami subchart)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| postgresql.enabled | bool | `true` | Deploy the bundled Bitnami PostgreSQL subchart (used by Keycloak) |

### External Secrets

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| externalSecrets.enabled | bool | `false` | Enable External Secrets Operator integration |
| externalSecrets.refreshInterval | string | `"1m"` | How often to refresh secrets from the remote provider |
| externalSecrets.remoteNameSecret | string | `""` | Name of the secret in the external provider |

### Monitoring

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| prometheus.enabled | bool | `false` | Deploy the bundled Prometheus subchart |
| metrics.enabled | bool | `false` | Enable the Appsmith metrics endpoint |
| metrics.port | int | `2019` | Port number to expose metrics on |

### Global parameters

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global | object | `{"namespaceOverride":"","storageClass":""}` | Global parameters that override values across the chart and its dependencies |
| fullnameOverride | string | `""` | String to fully override appsmith.fullname template |
| containerName | string | `"appsmith"` | Name of the container running in Appsmith pods |
| commonLabels | object | `{}` | Labels to add to all deployed objects |
| commonAnnotations | object | `{}` | Common annotations to add to all Appsmith resources (sub-charts are not considered). Evaluated as a template |
| schedulerName | string | `""` | Name of the scheduler (other than default) to dispatch pods |
| strategyType | string | `"RollingUpdate"` | StrategyType for the Appsmith workload |
| initContainer | object | `{}` | Init container image overrides for bundled dependencies |

### Appsmith image

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image | object | `{"pullPolicy":"IfNotPresent","pullSecrets":"","registry":"index.docker.io","repository":"appsmith/appsmith-ee","tag":"latest"}` | Appsmith container image configuration |
| _image | object | `{}` | DEPRECATED: use image instead. Backwards-compatible override merged on top of image. |

### Service account

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| serviceAccount.create | bool | `true` | Enable creation of ServiceAccount for Appsmith pods |
| serviceAccount.name | string | `""` | Name of the created serviceAccount |
| serviceAccount.annotations | object | `{}` | Additional Service Account annotations |

### Pod configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| annotations | object | `{}` | Annotations to add to the Deployment/StatefulSet resource |
| podAnnotations | object | `{}` | Annotations to add to Appsmith pods |
| podLabels | object | `{}` | Labels to add to Appsmith pods |
| podSecurityContext | object | `{}` | Pod-level securityContext for Appsmith pods |
| securityContext | object | `{}` | Container-level securityContext for the Appsmith container |

### Networking

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| service.type | string | `"ClusterIP"` | Kubernetes Service type |
| service.portName | string | `"appsmith"` | Appsmith service port name |
| service.loadBalancerIP | string | `""` | loadBalancerIP for the Appsmith Service |
| service.loadBalancerSourceRanges | list | `[]` | Address(es) that are allowed when service is LoadBalancer |
| service.annotations | object | `{}` | Provide any additional annotations that may be required |
| ingress.enabled | bool | `false` | Enable Ingress record generation for Appsmith |
| ingress.annotations | object | `{}` | Additional custom annotations for the ingress record |
| ingress.hosts | list | `[]` | Hosts served by the Ingress |
| ingress.certManager | bool | `false` | Enable ingress to use TLS certificates provided by Cert Manager |

### Workload

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| customCAcert | string | `nil` | Custom CA certificates to trust at runtime (map of filename to PEM content) |
| resources.limits | object | `{}` | Resource limits for the Appsmith container |
| resources.requests | object | `{"cpu":"500m","memory":"3000Mi"}` | Resource requests for the Appsmith container |
| autoscaling.enabled | bool | `false` | Enable the HorizontalPodAutoscaler |
| autoscaling.minReplicas | int | `2` | Minimum number of replicas for the HPA |
| autoscaling.maxReplicas | int | `2` | Maximum number of replicas for the HPA |
| autoscaling.targetCPUUtilizationPercentage | int | `5` | Target average CPU utilization (percentage) |
| nodeSelector | object | `{}` | Node selector for Appsmith pods |
| tolerations | list | `[]` | Tolerations for Appsmith pods |
| affinity | object | `{}` | Affinity rules for Appsmith pods |

### Persistence

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| persistence.enabled | bool | `true` | Enable data persistence using PVC |
| persistence.storageClass | string | `""` | PVC Storage Class |
| persistence.annotations | object | `{}` | Additional custom annotations for the PVC |
| persistence.localStorage | bool | `false` | Use local storage for PVC |
| persistence.storagePath | string | `"/tmp/hostpath_pv"` | Local storage path |
| persistence.accessModes | list | `["ReadWriteMany"]` | PV Access Mode |
| persistence.size | string | `"10Gi"` | PVC Storage Request |
| persistence.reclaimPolicy | string | `"Retain"` | Reclaim policy for the PV |
| persistence.existingClaim.enabled | string | `nil` | Use an existing PVC instead of creating one |
| persistence.existingClaim.name | string | `nil` | Name used to look up the existing PVC |
| persistence.existingClaim.claimName | string | `nil` | Explicit claimName to set on the volume mount |
| persistence.efs.enabled | string | `nil` | Enable EFS-backed persistence |
| persistence.efs.driver | string | `nil` | CSI driver name for the EFS volume |
| persistence.efs.volumeHandle | string | `nil` | EFS filesystem volume handle (fs-xxxx[::access-point]) |
| persistence.volumeClaimTemplates.dataSource | object | `{}` | Add dataSource to the VolumeClaimTemplate |
| storageClass.enabled | bool | `false` | Enable a chart-managed StorageClass |
| storageClass.bindingMode | string | `"Immediate"` | Binding mode for PVCs using this StorageClass |
| storageClass.defaultClass | bool | `false` | Mark this StorageClass as the cluster default |
| storageClass.allowVolumeExpansion | bool | `true` | Allow PVC expansion for this StorageClass |
| storageClass.reclaimPolicy | string | `"Delete"` | Reclaim policy for dynamically provisioned PVs |
| storageClass.provisioner | string | `""` | Provisioner name for this StorageClass |
| storageClass.annotations | object | `{}` | Annotations for the StorageClass |
| storageClass.mountOptions | object | `{}` | Mount options for volumes using this StorageClass |
| storageClass.parameters | object | `{}` | Provisioner-specific parameters for this StorageClass |

### Miscellaneous

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| podDisruptionBudgets.enabled | bool | `true` | Enable a PodDisruptionBudget for Appsmith pods |
| podDisruptionBudgets.minAvailable | int | `1` | Minimum available pods during voluntary disruptions |
| keda.enabled | bool | `false` | Enable KEDA ScaledObject for Appsmith |
| keda.pollingInterval | int | `30` | How often KEDA polls trigger sources (seconds) |
| keda.cooldownPeriod | int | `60` | Cooldown period before scaling down (seconds) |
| keda.minReplicaCount | int | `1` | Minimum replica count for KEDA |
| keda.maxReplicaCount | int | `6` | Maximum replica count for KEDA |
| keda.fallback.failureThreshold | int | `3` | Consecutive failures before fallback |
| keda.fallback.replicas | int | `4` | Replica count to fall back to |
| keda.triggers | list | `[]` | KEDA trigger definitions (passed through to ScaledObject) |
| autoupdate.enabled | bool | `false` | Enable the auto-update CronJob |
| autoupdate.scheduler | string | `"0 * * * *"` | CronJob schedule expression for auto-update |

### Application config

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| secretName | string | `""` | Name of an existing Secret for APPSMITH_* env vars (empty = chart creates one) |
| applicationConfig | object | `{"APPSMITH_CLIENT_LOG_LEVEL":"","APPSMITH_CUSTOM_DOMAIN":"","APPSMITH_DB_URL":"","APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX":"false","APPSMITH_DISABLE_TELEMETRY":"","APPSMITH_ENCRYPTION_PASSWORD":"","APPSMITH_ENCRYPTION_SALT":"","APPSMITH_FORM_LOGIN_DISABLED":"","APPSMITH_KEYCLOAK_DB_DRIVER":"","APPSMITH_KEYCLOAK_DB_PASSWORD":"","APPSMITH_KEYCLOAK_DB_URL":"","APPSMITH_KEYCLOAK_DB_USERNAME":"","APPSMITH_LICENSE_KEY":"","APPSMITH_MAIL_ENABLED":"","APPSMITH_MAIL_FROM":"","APPSMITH_MAIL_HOST":"","APPSMITH_MAIL_PASSWORD":"","APPSMITH_MAIL_PORT":"","APPSMITH_MAIL_SMTP_AUTH":"","APPSMITH_MAIL_SMTP_TLS_ENABLED":"","APPSMITH_MAIL_USERNAME":"","APPSMITH_OAUTH2_GITHUB_CLIENT_ID":"","APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET":"","APPSMITH_OAUTH2_GOOGLE_CLIENT_ID":"","APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET":"","APPSMITH_RECAPTCHA_ENABLED":"","APPSMITH_RECAPTCHA_SECRET_KEY":"","APPSMITH_RECAPTCHA_SITE_KEY":"","APPSMITH_REDIS_URL":"","APPSMITH_REPLY_TO":"","APPSMITH_SIGNUP_DISABLED":""}` | Map of APPSMITH_* environment variables for the application container |

### Other Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| redis.auth.enabled | bool | `false` |  |
| redis.master.nodeSelector | object | `{}` |  |
| redis.master.disableCommands | list | `[]` |  |
| redis.master.affinity | object | `{}` |  |
| redis.master.tolerations | list | `[]` |  |
| redis.replica.replicaCount | int | `1` |  |
| redis.replica.nodeSelector | object | `{}` |  |
| redis.replica.disableCommands | list | `[]` |  |
| redis.replica.affinity | object | `{}` |  |
| redis.replica.tolerations | list | `[]` |  |
| redis.image.registry | string | `"docker.io"` |  |
| redis.image.repository | string | `"redis"` |  |
| redis.image.tag | string | `"7.4.9"` |  |
| mongodb.service.nameOverride | string | `"appsmith-mongodb"` |  |
| mongodb.auth.rootUser | string | `"root"` |  |
| mongodb.auth.rootPassword | string | `"password"` |  |
| mongodb.replicaCount | int | `2` |  |
| mongodb.architecture | string | `"replicaset"` |  |
| mongodb.replicaSetName | string | `"rs0"` |  |
| mongodb.nodeSelector | object | `{}` |  |
| mongodb.affinity | object | `{}` |  |
| mongodb.tolerations | list | `[]` |  |
| mongodb.image.registry | string | `"docker.io"` |  |
| mongodb.image.repository | string | `"appsmith/mongodb"` |  |
| mongodb.image.tag | string | `"6.0.27"` |  |
| mongodb.arbiter.nodeSelector | object | `{}` |  |
| mongodb.arbiter.affinity | object | `{}` |  |
| mongodb.arbiter.tolerations | list | `[]` |  |
| mongodb.hidden.nodeSelector | object | `{}` |  |
| mongodb.hidden.affinity | object | `{}` |  |
| mongodb.hidden.tolerations | list | `[]` |  |
| mongodbOperator.operator | object | `{"telemetry":{"enabled":false}}` | Enable the upstream operator's phone-home telemetry. |
| postgresql.auth.username | string | `"root"` |  |
| postgresql.auth.password | string | `"password"` |  |
| postgresql.auth.postgresPassword | string | `"password"` |  |
| postgresql.auth.database | string | `"keycloak"` |  |
| postgresql.image.registry | string | `"docker.io"` |  |
| postgresql.image.repository | string | `"bitnamilegacy/postgresql"` |  |
| postgresql.image.tag | string | `"14.12.0"` |  |
| postgresql.primary.affinity | object | `{}` |  |
| postgresql.primary.nodeSelector | object | `{}` |  |
| postgresql.primary.tolerations | list | `[]` |  |
| postgresql.readReplicas.affinity | object | `{}` |  |
| postgresql.readReplicas.nodeSelector | object | `{}` |  |
| postgresql.readReplicas.tolerations | list | `[]` |  |
| prometheus.image.tag | string | `"v0.74.0"` |  |
| extraVolumes | list | `[]` | Additional volumes to add to the pod |
| extraVolumeMounts | list | `[]` | Additional volume mounts to add to the appsmith container |
| service.port | int | `80` | service port |
| service.nodePort | int | `8000` | Node port to expose if service type is "LoadBalancer" or "NodePort" |
| service.clusterIP | string | `""` | Appsmith service cluster IP |
| ingress.tls | bool | `false` | Enable TLS configuration for the host defined at `ingress.hosts` parameter |
| ingress.secrets | list | `[]` | Custom TLS certificates as secrets |
| ingress.certManagerTls | list | `[]` | Specify the TLS secret created by Cert Manager |
| ingress.className | string | `"nginx"` | IngressClass name for the Ingress resource |
| workload | object | `{"kind":"StatefulSet"}` | Select workload resource type: Deployment or StatefulSet |
| replicas | int | `1` | Number of replicas when autoscaling is disabled |
| persistence.localCluster | object | `{}` |  |
| persistence.pvNameOverride | string | `""` | Override the PV name |
| persistence.volumeClaimTemplates.selector | object | `{}` | A label query over volumes to consider for binding (e.g. when using local volumes) |
| persistence.volumeClaimTemplates.requests | object | `{}` | Custom PVC requests attributes |

## MongoDB Community Operator

The chart can deploy MongoDB via the [MongoDB Kubernetes Operator](https://github.com/mongodb/mongodb-kubernetes)
instead of the default Bitnami subchart. Set `mongodbOperator.enabled=true` and `mongodbCommunity.enabled=true`.

See [docs/install-mongodb-operator.md](docs/install-mongodb-operator.md) for the full guide and known limitations.

> **Preview feature** (chart 3.7.0) -- documented for fresh installs. A migration path from Bitnami-backed installs is being prepared separately.

## Testing

The chart ships with helm-unittest tests in `tests/`. See [tests/README.md](tests/README.md) for details on running them.

## Upgrades

- **Appsmith version upgrades** -- see the [Appsmith upgrade documentation](https://docs.appsmith.com).
- **Chart version upgrades** -- see the [chart upgrade guide](https://docs.appsmith.com) (coming soon).

## Documentation

Full documentation is available at [docs.appsmith.com](https://docs.appsmith.com), including:

- [Installation guides](https://docs.appsmith.com/getting-started/setup/installation-guides/kubernetes) (EKS, GKE, Minikube, and more)
- [Environment variable reference](https://docs.appsmith.com/getting-started/setup/environment-variables)
- [TLS / HTTPS setup](Setup-https.md)

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| Appsmith | <tech@appsmith.com> |  |

## Source Code

* <https://github.com/appsmithorg/appsmith>
