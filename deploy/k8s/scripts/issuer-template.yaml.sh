set -o nounset

user_email="$1"
issuer_server="$2"


if [[ -z $user_email ]]; then
cat <<EOF
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: letsencrypt-production
spec:
  acme:
    # The ACME server URL    
    server: $issuer_server
    # Email address used for ACME registration
    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: letsencrypt-production
    # Enable the HTTP-01 challenge provider
    solvers:
    - http01:
        ingress:
          class:  nginx
EOF
else
cat <<EOF
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: letsencrypt-production
spec:
  acme:
    # The ACME server URL    
    server: $issuer_server
    # Email address used for ACME registration
    email: $user_email
    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: letsencrypt-production
    # Enable the HTTP-01 challenge provider
    solvers:
    - http01:
        ingress:
          class:  nginx
EOF
fi