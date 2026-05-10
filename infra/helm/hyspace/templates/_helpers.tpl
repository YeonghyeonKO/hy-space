{{- define "hyspace.fullname" -}}
hyspace-{{ required "instanceName is required" .Values.instanceName }}
{{- end }}

{{- define "hyspace.labels" -}}
app.kubernetes.io/name: hyspace
app.kubernetes.io/instance: {{ include "hyspace.fullname" . }}
{{- end }}

{{- define "hyspace.backendSelectorLabels" -}}
app.kubernetes.io/name: hyspace
app.kubernetes.io/instance: {{ include "hyspace.fullname" . }}
app.kubernetes.io/component: backend
{{- end }}

{{- define "hyspace.frontendSelectorLabels" -}}
app.kubernetes.io/name: hyspace
app.kubernetes.io/instance: {{ include "hyspace.fullname" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{- define "hyspace.secretName" -}}
{{- if .Values.keycloak.existingSecret -}}
{{ .Values.keycloak.existingSecret }}
{{- else -}}
{{ include "hyspace.fullname" . }}-secret
{{- end }}
{{- end }}

{{- define "hyspace.host" -}}
{{ include "hyspace.fullname" . }}.{{ .Values.ingress.domain }}
{{- end }}

{{- define "hyspace.databaseUrl" -}}
{{- if .Values.postgresql.internal -}}
postgresql+asyncpg://{{ .Values.postgresql.username }}:$(DATABASE_PASSWORD)@{{ include "hyspace.fullname" . }}-postgresql:{{ .Values.postgresql.port }}/{{ .Values.postgresql.database }}
{{- else -}}
postgresql+asyncpg://{{ .Values.postgresql.username }}:$(DATABASE_PASSWORD)@{{ .Values.postgresql.host }}:{{ .Values.postgresql.port }}/{{ .Values.postgresql.database }}
{{- end }}
{{- end }}

{{- define "hyspace.dbSecretName" -}}
{{- if .Values.postgresql.existingSecret -}}
{{ .Values.postgresql.existingSecret }}
{{- else -}}
{{ include "hyspace.fullname" . }}-secret
{{- end }}
{{- end }}

{{- define "hyspace.dbSecretKey" -}}
{{- if .Values.postgresql.existingSecret -}}
{{ .Values.postgresql.existingSecretKey }}
{{- else -}}
postgresql-password
{{- end }}
{{- end }}

{{- define "hyspace.imagePullSecrets" -}}
{{- if .Values.imageRegistry.enabled }}
- name: {{ include "hyspace.fullname" . }}-registry
{{- else if .Values.imagePullSecrets }}
{{- toYaml .Values.imagePullSecrets }}
{{- end }}
{{- end }}

{{- define "hyspace.sslVolume" -}}
{{- if .Values.ssl.existingConfigMap -}}
configMap:
  name: {{ .Values.ssl.existingConfigMap }}
{{- else if .Values.ssl.existingSecret -}}
secret:
  secretName: {{ .Values.ssl.existingSecret }}
{{- else -}}
configMap:
  name: {{ include "hyspace.fullname" . }}-ca-cert
{{- end }}
{{- end }}
