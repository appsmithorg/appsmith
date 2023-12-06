import * as fs from "fs"
import {dirname} from "path"
import {spawnSync} from "child_process"
import {X509Certificate} from "crypto"

const APPSMITH_CUSTOM_DOMAIN = process.env.APPSMITH_CUSTOM_DOMAIN ?? null
const CaddyfilePath = process.env.TMP + "/Caddyfile"

let certLocation = null
if (APPSMITH_CUSTOM_DOMAIN != null) {
  try {
    fs.accessSync("/appsmith-stacks/ssl/fullchain.pem", fs.constants.R_OK)
    certLocation = "/appsmith-stacks/ssl"
  } catch (_) {
    // no custom certs, see if old certbot certs are there.
    const letsEncryptCertLocation = "/etc/letsencrypt/live/" + APPSMITH_CUSTOM_DOMAIN
    const fullChainPath = letsEncryptCertLocation + `/fullchain.pem`
    try {
      fs.accessSync(fullChainPath, fs.constants.R_OK)
      console.log("Old Let's Encrypt cert file exists, now checking if it's expired.")
      if (!isCertExpired(fullChainPath)) {
        certLocation = letsEncryptCertLocation
      }
    } catch (_) {
      // no certs there either, ignore.
    }
  }

}

const tlsConfig = certLocation == null ? "" : `tls ${certLocation}/fullchain.pem ${certLocation}/privkey.pem`

const parts = []

parts.push(`
{
  admin 127.0.0.1:2019
  persist_config off
  acme_ca_root /etc/ssl/certs/ca-certificates.crt
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

(all-config) {
  log {
    output stdout
  }
  skip_log /api/v1/health

  header {
    -Server
    Content-Security-Policy "frame-ancestors ${process.env.APPSMITH_ALLOWED_FRAME_ANCESTORS ?? "'self' *"}"
    X-Content-Type-Options "nosniff"
  }

  request_body {
    max_size 150MB
  }

  handle {
    root * {$WWW_PATH}
    try_files /loading.html /index.html
    import file_server
  }

  root * /opt/appsmith/editor
  @file file
  handle @file {
    import file_server
    skip_log
  }

  handle /static/* {
    error 404
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
}

localhost:80 127.0.0.1:80 {
  import all-config
}

${APPSMITH_CUSTOM_DOMAIN || ":80"} {
  import all-config
  ${tlsConfig}
}
`)

fs.mkdirSync(dirname(CaddyfilePath), { recursive: true })
fs.writeFileSync(CaddyfilePath, parts.join("\n"))
spawnSync("/opt/caddy/caddy", ["fmt", "--overwrite", CaddyfilePath])
spawnSync("/opt/caddy/caddy", ["reload", "--config", CaddyfilePath])

function isCertExpired(path) {
  const cert = new X509Certificate(fs.readFileSync(path, "utf-8"))
  console.log(path, cert)
  return new Date(cert.validTo) < new Date()
}
