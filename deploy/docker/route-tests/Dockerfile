FROM node

WORKDIR /opt

RUN set -o xtrace \
# Install Hurl
  && v="$(curl -sS --write-out '%{redirect_url}' 'https://github.com/Orange-OpenSource/hurl/releases/latest' | sed 's,.*/,,')" \
  && curl -LsS "https://github.com/Orange-OpenSource/hurl/releases/download/$v/hurl-$v-$(uname -m)-unknown-linux-gnu.tar.gz" \
    | tar -xz \
  && mv hurl* hurl \
# Install Caddy
  && mkdir -p caddy \
  && v="$(curl --write-out '%{redirect_url}' 'https://github.com/caddyserver/caddy/releases/latest' | sed 's,.*/v,,')" \
  && curl --location "https://github.com/caddyserver/caddy/releases/download/v$v/caddy_${v}_linux_$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/').tar.gz" \
    | tar -xzC caddy \
# Install mkcert
  && v="$(curl --write-out '%{redirect_url}' 'https://github.com/FiloSottile/mkcert/releases/latest' | sed 's,.*/v,,')" \
  && curl --location "https://github.com/FiloSottile/mkcert/releases/download/v$v/mkcert-v$v-linux-$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')" --output mkcert \
  && chmod +x mkcert \
  && /opt/mkcert -install

WORKDIR /code
ENTRYPOINT [ "bash", "entrypoint.sh" ]
