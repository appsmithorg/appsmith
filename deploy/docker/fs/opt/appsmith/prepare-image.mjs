import * as fs from "fs/promises";

const TMP = process.env.TMP;
const NGINX_WWW_PATH = process.env.NGINX_WWW_PATH;

async function applyNginxChanges() {
  const contents = await fs.readFile("/etc/nginx/nginx.conf", "utf8")

  const modContents = contents
    .replace("pid /run/nginx.pid;", `pid ${TMP}/nginx.pid;`)
    .replace("# server_tokens off;", "server_tokens off; more_set_headers 'Server: ';")
    .replace("gzip on;", "gzip on; gzip_types *;")
    .replace("include /etc/nginx/conf.d/*.conf;", [
      "include /etc/nginx/conf.d/*.conf;",
      `include ${TMP}/nginx-app.conf;`,
      `root ${NGINX_WWW_PATH};`,
    ].join("\n"));

  await Promise.all([
    fs.writeFile("/etc/nginx/nginx.conf.original", contents),
    fs.writeFile("/etc/nginx/nginx.conf", modContents),
    fs.rm("/etc/nginx/sites-enabled", { recursive: true }),
    fs.rm("/etc/nginx/conf.d", { recursive: true }),
  ])
}

await applyNginxChanges();
