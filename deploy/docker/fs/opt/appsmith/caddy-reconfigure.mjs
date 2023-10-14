import * as fs from "fs"

const parts = []

const APPSMITH_CUSTOM_DOMAIN = process.env.APPSMITH_CUSTOM_DOMAIN
const listenTarget = APPSMITH_CUSTOM_DOMAIN && !process.env.DYNO ? APPSMITH_CUSTOM_DOMAIN : ":80"

let tlsConfig = ""
try {
  fs.accessSync("/appsmith-stacks/ssl/fullchain.pem", fs.constants.R_OK)
  tlsConfig = "tls /appsmith-stacks/ssl/fullchain.pem /appsmith-stacks/ssl/privkey.pem"
} catch (_) {
  // no custom certs, see if old certbot certs are there.
  try {
    let certFile = `/etc/letsencrypt/live/${APPSMITH_CUSTOM_DOMAIN}/fullchain.pem`
    fs.accessSync(certFile, fs.constants.R_OK)
    tlsConfig = `tls ${certFile} /etc/letsencrypt/live/${APPSMITH_CUSTOM_DOMAIN}/privkey.pem`
  } catch (_) {
    // no certs there either, ignore.
  }
}

const content = `
{
  admin 127.0.0.1:2019
  persist_config off
  servers {
    trusted_proxies static 0.0.0.0/0
  }
}

(file_server) {
  file_server {
    precompressed br gzip
    disable_canonical_uris
  }
}

(reverse_proxy) {
  reverse_proxy {
    to 127.0.0.1:{args[0]}
    header_up -Forwarded
  }
}

${listenTarget}

header -Server

header Content-Security-Policy "frame-ancestors {$APPSMITH_ALLOWED_FRAME_ANCESTORS:'self' *}"
header X-Content-Type-Options "nosniff"

request_body {
  max_size 150MB
}

root * /opt/appsmith/editor

@file_exists file
handle @file_exists {
  import file_server
}

handle {
  root * {$NGINX_WWW_PATH}
  try_files /loading.html /index.html
  import file_server
}

handle /info {
  root * /opt/appsmith
  rewrite * /info.json
  import file_server
}

@backend path /api/* /oauth2/* /login/*
handle @backend {
  import reverse_proxy 8080
}

handle /rts/* {
  import reverse_proxy 8091
}

redir /supervisor /supervisor/
handle_path /supervisor/* {
  import reverse_proxy 9001
}

handle_errors {
  respond "{err.status_code} {err.status_text}" {err.status_code}
}

${tlsConfig}
`
  // This is formatting changes, otherwise Caddy will complain that the Caddyfile is not formatted right.
  .replaceAll(/^( {2})+/gm, (m) => "\t".repeat(m.length / 2)).trim() + "\n"

fs.writeFileSync(process.env.TMP + "/Caddyfile", fmt(parts.join("\n")))
