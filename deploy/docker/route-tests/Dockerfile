FROM appsmith/base-ce:release

SHELL ["bash", "-eux", "-c"]

RUN <<END
  version="$(basename "$(curl -sS --write-out '%{redirect_url}' 'https://github.com/Orange-OpenSource/hurl/releases/latest')")"
  curl -sS --location "https://github.com/Orange-OpenSource/hurl/releases/download/$version/hurl-$version-$(uname -m)-unknown-linux-gnu.tar.gz" \
    | tar xvz -C /tmp --strip-components 1
  mv /tmp/hurl /bin
  chmod +x /bin/hurl

  version="$(basename "$(curl -sS --write-out '%{redirect_url}' 'https://github.com/FiloSottile/mkcert/releases/latest')")"
  curl -sS --location "https://github.com/FiloSottile/mkcert/releases/download/$version/mkcert-$version-linux-$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')" \
    -o /bin/mkcert

  chmod +x /bin/mkcert
END

ENV PATH=/opt/caddy:/opt/node/bin:$PATH

WORKDIR /code

ENTRYPOINT [ "bash", "entrypoint.sh" ]
