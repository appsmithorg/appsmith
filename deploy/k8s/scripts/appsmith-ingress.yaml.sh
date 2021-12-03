set -o nounset

custom_domain="$1"
ssl_enable="$2"

if [[ "$ssl_enable" == "true" ]]; then
  cat <<EOF
    apiVersion: networking.k8s.io/v1beta1
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
      backend:
        serviceName: "appsmith-editor"
        servicePort: 80
      rules:
      - host: $custom_domain
        http:
          paths:
          - path: /api
            pathType: Prefix
            backend:
              serviceName: appsmith-backend-service
              servicePort: 8080
          - path: /oauth2
            pathType: Prefix
            backend:
              serviceName: appsmith-backend-service
              servicePort: 8080
          - path: /login
            pathType: Prefix
            backend:
              serviceName: appsmith-backend-service
              servicePort: 8080
          - path: /static
            pathType: Prefix
            backend:
              serviceName: appsmith-editor
              servicePort: 80
          - path: /
            pathType: Prefix
            backend:
              serviceName: appsmith-editor
              servicePort: 80
EOF
else
  cat << EOF
    apiVersion: networking.k8s.io/v1beta1
    kind: Ingress
    metadata:
      name: appsmith-ingress
      annotations:
        kubernetes.io/ingress.class: "nginx"
    spec:

      backend:
        serviceName: "appsmith-editor"
        servicePort: 80
      rules:
      - host: $custom_domain
        http:
          paths:
          - path: /api
            pathType: Prefix
            backend:
              serviceName: appsmith-backend-service
              servicePort: 8080
          - path: /oauth2
            pathType: Prefix
            backend:
              serviceName: appsmith-backend-service
              servicePort: 8080
          - path: /login
            pathType: Prefix
            backend:
              serviceName: appsmith-backend-service
              servicePort: 8080
          - path: /static
            pathType: Prefix
            backend:
              serviceName: appsmith-editor
              servicePort: 80
          - path: /
            pathType: Prefix
            backend:
              serviceName: appsmith-editor
              servicePort: 80
EOF
fi
