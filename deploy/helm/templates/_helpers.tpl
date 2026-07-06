{{/*
Expand the name of the chart.
*/}}
{{- define "appsmith.name" -}}
{{- default .Chart.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "appsmith.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.fullnameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "appsmith.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "appsmith.labels" -}}
appsmith.sh/chart: {{ include "appsmith.chart" . }}
{{ include "appsmith.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "appsmith.selectorLabels" -}}
app.kubernetes.io/name: {{ include "appsmith.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "appsmith.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "appsmith.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Allow the release namespace to be overridden for multi-namespace deployments in combined charts.
*/}}
{{- define "appsmith.namespace" -}}
    {{- if .Values.global -}}
        {{- if .Values.global.namespaceOverride }}
            {{- .Values.global.namespaceOverride -}}
        {{- else -}}
            {{- .Release.Namespace -}}
        {{- end -}}
    {{- else -}}
        {{- .Release.Namespace -}}
    {{- end }}
{{- end -}}

{{/*
Kubernetes standard labels
*/}}
{{- define "labels.standard" -}}
app.kubernetes.io/name: {{ include "names.name" . }}
helm.sh/chart: {{ include "names.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Expand the name of the chart.
*/}}
{{- define "names.name" -}}
{{- default .Chart.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "names.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Return  the proper Storage Class
*/}}
{{- define "storage.class" -}}

{{- $storageClass := .persistence.storageClass -}}
{{- if .global -}}
    {{- if .global.storageClass -}}
        {{- $storageClass = .global.storageClass -}}
    {{- end -}}
{{- end -}}

{{- if $storageClass -}}
  {{- if (eq "-" $storageClass) -}}
      {{- printf "storageClassName: \"\"" -}}
  {{- else }}
      {{- printf "storageClassName: %s" $storageClass -}}
  {{- end -}}
{{- end -}}

{{- end -}}
{{/*
Get the PV name, using override if specified
*/}}
{{- define "appsmith.pvName" -}}
{{- .Values.persistence.pvNameOverride | default (include "appsmith.fullname" .) -}}
{{- end -}}

{{/*
Returns "true" when Appsmith should target the operator-managed MongoDB,
meaning: the MongoDBCommunity CR is enabled, Bitnami MongoDB is disabled, and
no other config source could be supplying APPSMITH_DB_URL (the values-level
applicationConfig keys, secretName, secrets, or externalSecrets).

Used to gate both the operator-mode init container (which waits for the
operator-managed service) and the explicit APPSMITH_DB_URL env injection
(which would otherwise silently override a user-supplied URL).
*/}}
{{- define "appsmith.useOperatorMongo" -}}
{{- if and .Values.mongodbCommunity.enabled (not .Values.mongodb.enabled) (not .Values.applicationConfig.APPSMITH_DB_URL) (not .Values.applicationConfig.APPSMITH_MONGODB_URI) (not .Values.secretName) (not .Values.secrets) (not .Values.externalSecrets.enabled) -}}
true
{{- end -}}
{{- end -}}

{{/*
Password init Job image: the kubectl image used by the pre-install/pre-upgrade
Job that bootstraps the MongoDB user password Secret.
*/}}
{{- define "appsmith.mongoPasswordInitImage" -}}
{{- $img := .Values.mongodbCommunity.passwordInit.image -}}
{{- printf "%s/%s:%s" $img.registry $img.repository $img.tag -}}
{{- end -}}

{{/*
Init container image used to wait for the MongoDBCommunity replica set.

Follows the same registry the upstream operator uses for MongoDBCommunity pods.
The intent is that users with a private registry or pull-through proxy only
configure the image source in one place (mongodbOperator.mongodb.repo) and the
init container picks up the same path automatically.

Resolution order:
  1. .Values.initContainer.mongodb.image — full override from the user.
  2. Otherwise construct "<repo>/mongodb-community-server:<version>-ubi8", where:
       - <repo> follows .Values.mongodbOperator.mongodb.repo when set (either by
         the subchart defaults when mongodbOperator.enabled=true, or by explicit
         user override when the subchart is disabled).
       - Falls back to "quay.io/mongodb" when unset (matches the subchart's
         current default in v1.8.0).
  The image name ("mongodb-community-server") and suffix ("-ubi8") are pinned
  because the operator hardcodes those for MongoDBCommunity resources regardless
  of the chart's other mongodb.* values.

  An existing "-ubi8" suffix on mongodbCommunity.version is trimmed before the
  suffix is re-appended, so the append is idempotent. The suffix is defined once
  ($suffix) and used for both the trim and the append, so they can't drift if it
  ever needs to change. This lets private-registry
  users (whose mirror only carries "-ubi8" tags, and whose operator consumes the
  CR spec.version verbatim) set mongodbCommunity.version: "8.0.20-ubi8" once and
  drive both the CR and this init image from that single value — no separate
  initContainer.mongodb.image override needed.
*/}}
{{- define "appsmith.mongoInitContainerImage" -}}
{{- if ((.Values.initContainer).mongodb).image -}}
{{- .Values.initContainer.mongodb.image -}}
{{- else -}}
{{- $repo := ((.Values.mongodbOperator).mongodb).repo | default "quay.io/mongodb" -}}
{{- $suffix := "-ubi8" -}}
{{- $ver := .Values.mongodbCommunity.version | toString | trimSuffix $suffix -}}
{{- printf "%s/mongodb-community-server:%s%s" $repo $ver $suffix -}}
{{- end -}}
{{- end -}}

{{/*
MongoDBCommunity CR name
Returns the user-provided mongodbCommunity.name if set, otherwise computes
"<fullname>-mongo". The "-mongo" suffix (vs "-mongodb") intentionally avoids
collision with the Bitnami MongoDB subchart's StatefulSet/pod names during
the Mode B transition window.

Truncated to 60 chars so that the StatefulSet's pod ordinals (name + "-N")
stay inside the 63-char DNS-label limit. Users overriding mongodbCommunity.name
are responsible for keeping their own value short enough.
*/}}
{{- define "appsmith.mongoCommunityName" -}}
{{- if .Values.mongodbCommunity.name -}}
{{- .Values.mongodbCommunity.name -}}
{{- else -}}
{{- printf "%s-mongo" (include "appsmith.fullname" .) | trunc 60 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
MongoDB Operator: connection string secret name
The operator auto-generates a secret named <CR name>-<db>-<username>
*/}}
{{- define "appsmith.mongoOperatorSecretName" -}}
{{- printf "%s-%s-%s" (include "appsmith.mongoCommunityName" .) .Values.mongodbCommunity.auth.database .Values.mongodbCommunity.auth.username -}}
{{- end -}}

{{/*
MongoDB Operator: headless service name
The operator creates a service named <CR name>-svc
*/}}
{{- define "appsmith.mongoOperatorServiceName" -}}
{{- printf "%s-svc" (include "appsmith.mongoCommunityName" .) -}}
{{- end -}}

{{/*
MongoDB Operator: password secret name
Uses existing secret if provided, otherwise derives from the CR name
*/}}
{{- define "appsmith.mongoOperatorPasswordSecretName" -}}
{{- if .Values.mongodbCommunity.auth.passwordSecretName -}}
{{- .Values.mongodbCommunity.auth.passwordSecretName -}}
{{- else -}}
{{- printf "%s-password" (include "appsmith.mongoCommunityName" .) -}}
{{- end -}}
{{- end -}}

{{/*
Redis: password secret name
Uses existing secret if provided, otherwise derives "{release}-redis-secret"
*/}}
{{- define "appsmith.redisSecretName" -}}
{{- .Values.redis.auth.existingSecret | default (printf "%s-redis-secret" .Release.Name) -}}
{{- end -}}

{{/*
Redis: validate the redis.auth.password configuration.

redis.auth.password is a Bitnami subchart passthrough that the Appsmith
templates never read on their own. There is exactly ONE supported way to use
it: the fully self-managed path, where the operator also disables the chart's
bootstrap secret (existingSecret: "") and hands the app a matching connection
string via applicationConfig.APPSMITH_REDIS_URL. Any other use silently splits
the password between Redis and the app, so we fail fast instead.

Invoked from a template that always renders (configMap.yaml) so it evaluates on
every `helm template`/install/upgrade.
*/}}
{{- define "appsmith.validateRedisAuth" -}}
{{- if .Values.redis.auth.password -}}
{{- if or .Values.redis.auth.existingSecret (not .Values.applicationConfig.APPSMITH_REDIS_URL) -}}
{{ fail (printf "redis.auth.password is set, which is only supported on the self-managed path. Choose one of:\n  1. Leave redis.auth.password unset and let the chart bootstrap a password (default), or supply your own secret via redis.auth.existingSecret / redis.auth.existingSecretPasswordKey.\n  2. Self-manage the password: set redis.auth.password, set redis.auth.existingSecret: \"\", and set applicationConfig.APPSMITH_REDIS_URL=redis://:<password>@%s-redis-master:6379 so the app uses the same credential." .Release.Name) }}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Redis: master service hostname (FQDN inside the cluster).
Reuses the bundled `common.names.fullname` helper (the one the subchart's master
Service uses), evaluated in the redis subchart's context (.Subcharts.redis), so the
host always matches the Service it renders — including the edge cases where the
release name contains "redis" (the subchart collapses its fullname to just the
release name) or redis.nameOverride / redis.fullnameOverride is set.
Only valid when redis.enabled (the subchart context exists); all callers gate on it.
*/}}
{{- define "appsmith.redisMasterHost" -}}
{{- printf "%s-master.%s.svc.cluster.local" (include "common.names.fullname" .Subcharts.redis) (include "appsmith.namespace" .) -}}
{{- end -}}

{{/*
Redis: kubectl image used by the password-init Job.
Kept independent from the MongoDB equivalent so the two bootstraps don't share config.
*/}}
{{- define "appsmith.redisPasswordInitImage" -}}
{{- $img := .Values.redisAuth.passwordInit.image -}}
{{- printf "%s/%s:%s" $img.registry $img.repository $img.tag -}}
{{- end -}}

{{/*
Renders a value that contains template.
*/}}
{{- define "tplvalues.render" -}}
    {{- if typeIs "string" .value }}
        {{- tpl .value .context }}
    {{- else }}
        {{- tpl (.value | toYaml) .context }}
    {{- end }}
{{- end -}}