# appsmith

Appsmith is an open source framework to build admin panels, CRUD apps and workflows. Build everything you need, 10x faster.

Organizations build custom applications like dashboards, admin panels, customer 360, IT automation, and service management tools to help their teams work more efficiently and effectively. Appsmith is an open-source low-code platform that streamlines custom application development, deployment, and maintenance.

## Installation

See the [Kubernetes installation guide](https://docs.appsmith.com/getting-started/setup/installation-guides/kubernetes)
for prerequisites, step-by-step setup, and platform-specific instructions (EKS, GKE, Minikube, etc.).

## Values

### Appsmith configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| secretName | string | `""` | Name of an existing Secret for APPSMITH_* env vars (empty = chart creates one) |
| applicationConfig | object | `{"APPSMITH_CLIENT_LOG_LEVEL":"","APPSMITH_CUSTOM_DOMAIN":"","APPSMITH_DB_URL":"","APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX":"false","APPSMITH_DISABLE_TELEMETRY":"","APPSMITH_ENCRYPTION_PASSWORD":"","APPSMITH_ENCRYPTION_SALT":"","APPSMITH_FORM_LOGIN_DISABLED":"","APPSMITH_KEYCLOAK_DB_DRIVER":"","APPSMITH_KEYCLOAK_DB_PASSWORD":"","APPSMITH_KEYCLOAK_DB_URL":"","APPSMITH_KEYCLOAK_DB_USERNAME":"","APPSMITH_LICENSE_KEY":"","APPSMITH_MAIL_ENABLED":"","APPSMITH_MAIL_FROM":"","APPSMITH_MAIL_HOST":"","APPSMITH_MAIL_PASSWORD":"","APPSMITH_MAIL_PORT":"","APPSMITH_MAIL_SMTP_AUTH":"","APPSMITH_MAIL_SMTP_TLS_ENABLED":"","APPSMITH_MAIL_USERNAME":"","APPSMITH_OAUTH2_GITHUB_CLIENT_ID":"","APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET":"","APPSMITH_OAUTH2_GOOGLE_CLIENT_ID":"","APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET":"","APPSMITH_RECAPTCHA_ENABLED":"","APPSMITH_RECAPTCHA_SECRET_KEY":"","APPSMITH_RECAPTCHA_SITE_KEY":"","APPSMITH_REDIS_URL":"","APPSMITH_REPLY_TO":"","APPSMITH_SIGNUP_DISABLED":""}` | Map of APPSMITH_* environment variables for the application container |
| image | object | `{"pullPolicy":"IfNotPresent","pullSecrets":"","registry":"index.docker.io","repository":"appsmith/appsmith-ee","tag":"latest"}` | Appsmith container image configuration |
| _image | object | `{}` | DEPRECATED: use image instead. Backwards-compatible override merged on top of image. |

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

### Workload configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| annotations | object | `{}` | Annotations to add to the Deployment/StatefulSet resource |
| podAnnotations | object | `{}` | Annotations to add to Appsmith pods |
| podLabels | object | `{}` | Labels to add to Appsmith pods |
| podSecurityContext | object | `{}` | Pod-level securityContext for Appsmith pods |
| securityContext | object | `{}` | Container-level securityContext for the Appsmith container |
| extraVolumes | list | `[]` | Additional volumes to add to the pod |
| extraVolumeMounts | list | `[]` | Additional volume mounts to add to the appsmith container |
| customCAcert | string | `nil` | Custom CA certificates to trust at runtime (map of filename to PEM content) |
| resources.limits | object | `{}` | Resource limits for the Appsmith container |
| resources.requests | object | `{"cpu":"500m","memory":"3000Mi"}` | Resource requests for the Appsmith container |
| workload | object | `{"kind":"StatefulSet"}` | Select workload resource type: Deployment or StatefulSet |
| replicas | int | `1` | Number of replicas when autoscaling is disabled |
| autoscaling.enabled | bool | `false` | Enable the HorizontalPodAutoscaler |
| autoscaling.minReplicas | int | `2` | Minimum number of replicas for the HPA |
| autoscaling.maxReplicas | int | `2` | Maximum number of replicas for the HPA |
| autoscaling.targetCPUUtilizationPercentage | int | `5` | Target average CPU utilization (percentage) |
| nodeSelector | object | `{}` | Node selector for Appsmith pods |
| tolerations | list | `[]` | Tolerations for Appsmith pods |
| affinity | object | `{}` | Affinity rules for Appsmith pods |
| podDisruptionBudgets.enabled | bool | `true` | Enable a PodDisruptionBudget for Appsmith pods |
| podDisruptionBudgets.minAvailable | int | `1` | Minimum available pods during voluntary disruptions |

### Redis (Bitnami subchart)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| redis.enabled | bool | `true` | Deploy the bundled Bitnami Redis subchart |
| redis.auth.enabled | bool | `false` | Enable Redis authentication |
| redis.master.nodeSelector | object | `{}` | Node selector for Redis master pods |
| redis.master.disableCommands | list | `[]` | Commands to disable on Redis master |
| redis.master.affinity | object | `{}` | Affinity rules for Redis master pods |
| redis.master.tolerations | list | `[]` | Tolerations for Redis master pods |
| redis.replica.replicaCount | int | `1` | Number of Redis replica pods |
| redis.replica.nodeSelector | object | `{}` | Node selector for Redis replica pods |
| redis.replica.disableCommands | list | `[]` | Commands to disable on Redis replicas |
| redis.replica.affinity | object | `{}` | Affinity rules for Redis replica pods |
| redis.replica.tolerations | list | `[]` | Tolerations for Redis replica pods |
| redis.image.registry | string | `"docker.io"` | Redis image registry |
| redis.image.repository | string | `"redis"` | Redis image repository |
| redis.image.tag | string | `"7.4.9"` | Redis image tag |

### MongoDB (Bitnami subchart)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| mongodb.enabled | bool | `true` | Deploy the bundled Bitnami MongoDB subchart |
| mongodb.service.nameOverride | string | `"appsmith-mongodb"` | Service name override for the MongoDB subchart |
| mongodb.auth.rootUser | string | `"root"` | MongoDB root username |
| mongodb.auth.rootPassword | string | `"password"` | MongoDB root password |
| mongodb.replicaCount | int | `2` | Number of MongoDB replica set members |
| mongodb.architecture | string | `"replicaset"` | MongoDB architecture (standalone or replicaset) |
| mongodb.replicaSetName | string | `"rs0"` | MongoDB replica set name |
| mongodb.nodeSelector | object | `{}` | Node selector for MongoDB pods |
| mongodb.affinity | object | `{}` | Affinity rules for MongoDB pods |
| mongodb.tolerations | list | `[]` | Tolerations for MongoDB pods |
| mongodb.image.registry | string | `"docker.io"` | MongoDB container image registry |
| mongodb.image.repository | string | `"appsmith/mongodb"` | MongoDB container image repository |
| mongodb.image.tag | string | `"6.0.27"` | MongoDB container image tag |
| mongodb.arbiter.nodeSelector | object | `{}` | Node selector for MongoDB arbiter pods |
| mongodb.arbiter.affinity | object | `{}` | Affinity rules for MongoDB arbiter pods |
| mongodb.arbiter.tolerations | list | `[]` | Tolerations for MongoDB arbiter pods |
| mongodb.hidden.nodeSelector | object | `{}` | Node selector for MongoDB hidden replica pods |
| mongodb.hidden.affinity | object | `{}` | Affinity rules for MongoDB hidden replica pods |
| mongodb.hidden.tolerations | list | `[]` | Tolerations for MongoDB hidden replica pods |

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
| mongodbOperator.operator | object | `{"telemetry":{"enabled":false}}` | Enable the upstream operator's phone-home telemetry |

### PostgreSQL (Bitnami subchart)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| postgresql.enabled | bool | `true` | Deploy the bundled Bitnami PostgreSQL subchart (used by Keycloak) |
| postgresql.auth.username | string | `"root"` | PostgreSQL application username |
| postgresql.auth.password | string | `"password"` | PostgreSQL application user password |
| postgresql.auth.postgresPassword | string | `"password"` | PostgreSQL admin (postgres) password |
| postgresql.auth.database | string | `"keycloak"` | PostgreSQL database name |
| postgresql.image.registry | string | `"docker.io"` | PostgreSQL container image registry |
| postgresql.image.repository | string | `"bitnamilegacy/postgresql"` | PostgreSQL container image repository |
| postgresql.image.tag | string | `"14.12.0"` | PostgreSQL container image tag |
| postgresql.primary.affinity | object | `{}` | Affinity rules for PostgreSQL primary pods |
| postgresql.primary.nodeSelector | object | `{}` | Node selector for PostgreSQL primary pods |
| postgresql.primary.tolerations | list | `[]` | Tolerations for PostgreSQL primary pods |
| postgresql.readReplicas.affinity | object | `{}` | Affinity rules for PostgreSQL read replica pods |
| postgresql.readReplicas.nodeSelector | object | `{}` | Node selector for PostgreSQL read replica pods |
| postgresql.readReplicas.tolerations | list | `[]` | Tolerations for PostgreSQL read replica pods |

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
| prometheus.image.tag | string | `"v0.74.0"` | Prometheus container image tag |
| metrics.enabled | bool | `false` | Enable the Appsmith metrics endpoint |
| metrics.port | int | `2019` | Port number to expose metrics on |

### Service account

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| serviceAccount.create | bool | `true` | Enable creation of ServiceAccount for Appsmith pods |
| serviceAccount.name | string | `""` | Name of the created serviceAccount |
| serviceAccount.annotations | object | `{}` | Additional Service Account annotations |

### Networking

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| service.type | string | `"ClusterIP"` | Kubernetes Service type |
| service.port | int | `80` | Service port |
| service.nodePort | int | `8000` | Node port to expose if service type is "LoadBalancer" or "NodePort" |
| service.portName | string | `"appsmith"` | Appsmith service port name |
| service.clusterIP | string | `""` | Appsmith service cluster IP |
| service.loadBalancerIP | string | `""` | loadBalancerIP for the Appsmith Service |
| service.loadBalancerSourceRanges | list | `[]` | Address(es) that are allowed when service is LoadBalancer |
| service.annotations | object | `{}` | Provide any additional annotations that may be required |
| ingress.enabled | bool | `false` | Enable Ingress record generation for Appsmith |
| ingress.annotations | object | `{}` | Additional custom annotations for the ingress record |
| ingress.hosts | list | `[]` | Hosts served by the Ingress |
| ingress.tls | bool | `false` | Enable TLS configuration for the host defined at `ingress.hosts` parameter |
| ingress.secrets | list | `[]` | Custom TLS certificates as secrets |
| ingress.certManager | bool | `false` | Enable ingress to use TLS certificates provided by Cert Manager |
| ingress.certManagerTls | list | `[]` | Specify the TLS secret created by Cert Manager |
| ingress.className | string | `"nginx"` | IngressClass name for the Ingress resource |

### Persistence

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| persistence.enabled | bool | `true` | Enable data persistence using PVC |
| persistence.storageClass | string | `""` | PVC Storage Class |
| persistence.annotations | object | `{}` | Additional custom annotations for the PVC |
| persistence.localStorage | bool | `false` | Use local storage for PVC |
| persistence.storagePath | string | `"/tmp/hostpath_pv"` | Local storage path |
| persistence.localCluster | object | `{}` | Local cluster configuration for local-storage scenarios |
| persistence.accessModes | list | `["ReadWriteMany"]` | PV Access Mode |
| persistence.size | string | `"10Gi"` | PVC Storage Request |
| persistence.reclaimPolicy | string | `"Retain"` | Reclaim policy for the PV |
| persistence.pvNameOverride | string | `""` | Override the PV name |
| persistence.existingClaim.enabled | string | `nil` | Use an existing PVC instead of creating one |
| persistence.existingClaim.name | string | `nil` | Name used to look up the existing PVC |
| persistence.existingClaim.claimName | string | `nil` | Explicit claimName to set on the volume mount |
| persistence.efs.enabled | string | `nil` | Enable EFS-backed persistence |
| persistence.efs.driver | string | `nil` | CSI driver name for the EFS volume |
| persistence.efs.volumeHandle | string | `nil` | EFS filesystem volume handle (fs-xxxx[::access-point]) |
| persistence.volumeClaimTemplates.selector | object | `{}` | A label query over volumes to consider for binding (e.g. when using local volumes) |
| persistence.volumeClaimTemplates.requests | object | `{}` | Custom PVC requests attributes |
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

### Other Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
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

## Testing

The chart ships with helm-unittest tests in `tests/`. See [tests/README.md](tests/README.md) for details on running them.

## Documentation

Full documentation is available at [docs.appsmith.com](https://docs.appsmith.com), including:

- [Planning your Appsmith deployment](https://docs.appsmith.com/getting-started/setup/instance-configuration/helm-chart#planning-your-deployment)
- [Installation guide](https://docs.appsmith.com/getting-started/setup/installation-guides/kubernetes)
- [Appsmith version upgrades](https://docs.appsmith.com/getting-started/setup/instance-management/update-appsmith)
- [Environment variable reference](https://docs.appsmith.com/getting-started/setup/environment-variables)

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| Appsmith | <tech@appsmith.com> |  |

## Source Code

* <https://github.com/appsmithorg/appsmith>
