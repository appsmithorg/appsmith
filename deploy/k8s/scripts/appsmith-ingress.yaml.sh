set -o nounset

custom_domain="$1"
ssl_enable="$2"

if [[ "$ssl_enable" == "true" ]]; then
  cat <<EOF
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: appsmith-ingress
      annotations:
        kubernetes.io/ingress.class: "nginx"
        cert-manager.io/issuer: "letsencrypt-production"
        nginx.ingress.kubernetes.io/ssl-redirect: "true"
        nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    spec:
      tls:
        - hosts:
            - $custom_domain
          secretName: lego-tls
      rules:
      - host: $custom_domain
        http:
          paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: appsmith-service
                port:
                  number: 80
EOF
else
  cat << EOF
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: appsmith-ingress
      annotations:
        kubernetes.io/ingress.class: "nginx"
    spec:
      rules:
      - host: $custom_domain
        http:
          paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: appsmith-service
                port:
                  number: 80
EOF
fi
