set -o nounset

mongo_root_user="$1"
mongo_root_password="$2"
mongo_database="$3"


cat <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: mongo-config
data:
  MONGO_INITDB_DATABASE: $mongo_database
  MONGO_INITDB_ROOT_USERNAME: $mongo_root_user
  MONGO_INITDB_ROOT_PASSWORD: $mongo_root_password
EOF