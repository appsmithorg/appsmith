import * as fs from "fs/promises";

const TMP = process.env.TMP;
const NGINX_WWW_PATH = process.env.NGINX_WWW_PATH;

async function applyNginxChanges() {
  const contents = await fs.readFile("/etc/nginx/nginx.conf", "utf8")

  const modContents = contents
    .replace("pid /run/nginx.pid;", `pid ${TMP}/nginx.pid;`)
    .replace("include /etc/nginx/sites-enabled/*;", "")
    .replace("include /etc/nginx/conf.d/*.conf;", [
      `include ${TMP}/nginx-app.conf;`,
      `root ${NGINX_WWW_PATH};`,
    ].join("\n"));

  await fs.writeFile("/etc/nginx/nginx.conf", modContents);
}

await applyNginxChanges();
