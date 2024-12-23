import * as fs from "fs"
import {dirname} from "path"
import {spawnSync} from "child_process"
import {X509Certificate} from "crypto"

// The custom domain is expected to only have the domain. So if it has a protocol, we ignore the whole value.
// This was the effective behaviour before Caddy.
const CUSTOM_DOMAIN = (process.env.APPSMITH_CUSTOM_DOMAIN || "").replace(/^https?:\/\/.+$/, "")
const CaddyfilePath = process.env.TMP + "/Caddyfile"
const AppsmithCaddy = process.env._APPSMITH_CADDY

// Rate limit environment.
const isRateLimitingEnabled = process.env.APPSMITH_RATE_LIMIT !== "disabled"
const RATE_LIMIT = parseInt(process.env.APPSMITH_RATE_LIMIT || 100, 10)

let certLocation = null
if (CUSTOM_DOMAIN !== "") {
  try {
    fs.accessSync("/appsmith-stacks/ssl/fullchain.pem", fs.constants.R_OK)
    certLocation = "/appsmith-stacks/ssl"
  } catch {
    // no custom certs, see if old certbot certs are there.
    const letsEncryptCertLocation = "/appsmith-stacks/letsencrypt/live/" + CUSTOM_DOMAIN
    const fullChainPath = letsEncryptCertLocation + `/fullchain.pem`
    try {
      fs.accessSync(fullChainPath, fs.constants.R_OK)
      console.log("Old Let's Encrypt cert file exists, now checking if it's expired.")
      if (!isCertExpired(fullChainPath)) {
        certLocation = letsEncryptCertLocation
      }
    } catch {
      // no certs there either, ignore.
    }
  }

}

const frameAncestorsPolicy = (process.env.APPSMITH_ALLOWED_FRAME_ANCESTORS || "'self'")
  .replace(/;.*$/, "")

const monitoringParts = [{
  path: "/monitoring/traces",
  rewrite: "/v1/traces",
}, {
  path: "/monitoring/metrics",
  rewrite: "/v1/metrics",
}];

const parts = []

parts.push(`
{
  debug
  admin 0.0.0.0:2019
  persist_config off
  acme_ca_root /etc/ssl/certs/ca-certificates.crt
  servers {
    trusted_proxies static 0.0.0.0/0
    metrics
  }
  ${isRateLimitingEnabled ? "order rate_limit before basicauth" : ""}
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
    header_up X-Appsmith-Request-Id {http.request.uuid}
  }
}

(all-config) {
  log {
    output stdout
  }

  # skip logs for health check
  log_skip /api/v1/health

  # skip logs for sourcemap files
  @source-map-files {
    path_regexp ^.*\.(js|css)\.map$
  }
  log_skip @source-map-files

  # The internal request ID header should never be accepted from an incoming request.
  request_header -X-Appsmith-Request-Id

  # Ref: https://stackoverflow.com/a/38191078/151048
  # We're only accepting v4 UUIDs today, in order to not make it too lax unless needed.
  @valid-request-id expression {header.X-Request-Id}.matches("(?i)^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$")
  header @valid-request-id X-Request-Id {header.X-Request-Id}
  @invalid-request-id expression !{header.X-Request-Id}.matches("(?i)^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$")
  header @invalid-request-id X-Request-Id invalid_request_id
  request_header @invalid-request-id X-Request-Id invalid_request_id

  header {
    -Server
    Content-Security-Policy "frame-ancestors ${frameAncestorsPolicy}"
    X-Content-Type-Options "nosniff"
    X-Appsmith-Request-Id {http.request.uuid}
  }

  header /static/* {
    Cache-Control "public, max-age=31536000, immutable"
  }

  request_body {
    max_size ${process.env.APPSMITH_CODEC_SIZE || 150}MB
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

${
  monitoringParts.map((telemetry) => `
  handle ${telemetry.path} {
    @unauthorized not header api-key "${process.env.APPSMITH_NEW_RELIC_OTLP_LICENSE_KEY}"
    respond @unauthorized "Forbidden" 403

    @method_not_allowed not method POST
    respond @method_not_allowed "Method Not Allowed" 405

    rewrite * ${telemetry.rewrite}
    import reverse_proxy 4318
  }`).join("\n")
}

  redir /supervisor /supervisor/
  handle_path /supervisor/* {
    import reverse_proxy 9001
  }

  ${isRateLimitingEnabled ? `rate_limit {
    zone dynamic_zone {
      # This key is designed to work irrespective of any load balancers running on the Appsmith container.
      # We use "+" as the separator here since we don't expect it in any of the placeholder values here, and has no
      # significance in header value syntax.
      key {header.Forwarded}+{header.X-Forwarded-For}+{remote_host}
      events ${RATE_LIMIT}
      window 1s
    }
  }`: ""}

  handle_errors {
    respond "{err.status_code} {err.status_text}" {err.status_code}
    header {
      # Remove the Server header from the response.
      -Server
      # Remove Cache-Control header from the response.
      -Cache-Control
    }
  }
}

# We bind to http on 80, so that localhost requests don't get redirected to https.
:${process.env.PORT || 80} {
  import all-config
}
`)

if (CUSTOM_DOMAIN !== "") {
  if (certLocation) {
    // There's a custom certificate, don't bind to any exact domain.
    parts.push(`
    https:// {
      import all-config
      tls ${certLocation}/fullchain.pem ${certLocation}/privkey.pem
    }
    `)

  } else {
    // No custom certificate, bind to the custom domain explicitly, so Caddy can auto-provision the cert.
    parts.push(`
    https://${CUSTOM_DOMAIN} {
      import all-config
    }
    `)

  }

  // We have to own the http-to-https redirect, since we need to remove the `Server` header from the response.
  parts.push(`
  http://${CUSTOM_DOMAIN} {
    redir https://{host}{uri}
    header -Server
    header Connection close
  }
  `)
}

if (!process.argv.includes("--no-finalize-index-html")) {
  finalizeHtmlFiles()
}

fs.mkdirSync(dirname(CaddyfilePath), { recursive: true })
fs.writeFileSync(CaddyfilePath, parts.join("\n"))
spawnSync(AppsmithCaddy, ["fmt", "--overwrite", CaddyfilePath])
spawnSync(AppsmithCaddy, ["reload", "--config", CaddyfilePath])

function finalizeHtmlFiles() {
  let info = null;
  try {
    info = JSON.parse(fs.readFileSync("/opt/appsmith/info.json", "utf8"))
  } catch(e) {
    // info will be empty, that's okay.
    console.error("Error reading info.json", e.message)
  }

  const extraEnv = {
    APPSMITH_VERSION_ID: info?.version ?? "",
    APPSMITH_VERSION_SHA: info?.commitSha ?? "",
    APPSMITH_VERSION_RELEASE_DATE: info?.imageBuiltAt ?? "",
    APPSMITH_HOSTNAME: process.env.HOSTNAME ?? "appsmith-0"
  }

  for (const file of ["index.html", "404.html"]) {
    const content = fs.readFileSync("/opt/appsmith/editor/" + file, "utf8").replaceAll(
      /\{\{env\s+"(APPSMITH_[A-Z0-9_]+)"}}/g,
      (_, name) => (process.env[name] || extraEnv[name] || "")
    )

    fs.writeFileSync(process.env.WWW_PATH + "/" + file, content)
  }
}

function isCertExpired(path) {
  const cert = new X509Certificate(fs.readFileSync(path, "utf-8"))
  console.log(path, cert)
  return new Date(cert.validTo) < new Date()
}
