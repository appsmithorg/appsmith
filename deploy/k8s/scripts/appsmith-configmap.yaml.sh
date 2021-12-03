set -o nounset

mongo_protocol="$1"
mongo_host="$2"
encoded_mongo_root_user="$3"
encoded_mongo_root_password="$4"
mongo_db="$5"
disable_telemetry="$6"

cat<<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: application-config
data:
  APPSMITH_MAIL_ENABLED: "false"
  # APPSMITH_MAIL_FROM: ""
  # APPSMITH_REPLY_TO: ""
  # APPSMITH_MAIL_HOST: ""
  # APPSMITH_MAIL_PORT: ""
  # APPSMITH_MAIL_SMTP_TLS_ENABLED: ""
  # APPSMITH_MAIL_USERNAME: ""
  # APPSMITH_MAIL_PASSWORD: ""
  # APPSMITH_MAIL_SMTP_AUTH: ""
  # APPSMITH_OAUTH2_GOOGLE_CLIENT_ID:  ""
  # APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET: ""
  # APPSMITH_OAUTH2_GITHUB_CLIENT_ID: ""
  # APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET:  ""
  APPSMITH_GOOGLE_MAPS_API_KEY: ""
  APPSMITH_REDIS_URL: redis://redis-service:6379
  APPSMITH_MONGODB_URI: $mongo_protocol$encoded_mongo_root_user:$encoded_mongo_root_password@$mongo_host/$mongo_db?retryWrites=true&authSource=admin
  APPSMITH_DISABLE_TELEMETRY: "$disable_telemetry"
  APPSMITH_RECAPTCHA_SITE_KEY: ""
  APPSMITH_RECAPTCHA_SECRET_KEY: ""
  APPSMITH_RECAPTCHA_ENABLED: "false"
  APPSMITH_DISABLE_INTERCOM: "false"
  # APPSMITH_PLUGIN_MAX_RESPONSE_SIZE_MB=5
EOF
