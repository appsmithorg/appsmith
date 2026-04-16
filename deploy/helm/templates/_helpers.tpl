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
*/}}
{{- define "appsmith.mongoInitContainerImage" -}}
{{- if ((.Values.initContainer).mongodb).image -}}
{{- .Values.initContainer.mongodb.image -}}
{{- else -}}
{{- $repo := ((.Values.mongodbOperator).mongodb).repo | default "quay.io/mongodb" -}}
{{- printf "%s/mongodb-community-server:%s-ubi8" $repo .Values.mongodbCommunity.version -}}
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
Renders a value that contains template.
*/}}
{{- define "tplvalues.render" -}}
    {{- if typeIs "string" .value }}
        {{- tpl .value .context }}
    {{- else }}
        {{- tpl (.value | toYaml) .context }}
    {{- end }}
{{- end -}}