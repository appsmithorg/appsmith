set -o nounset

user_encryption_password="$1"
user_encryption_salt="$2"

cat<<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: encryption-config
data:
  APPSMITH_ENCRYPTION_PASSWORD: $user_encryption_password
  APPSMITH_ENCRYPTION_SALT: $user_encryption_salt
EOF