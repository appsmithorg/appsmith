import cron from "node-cron";
import * as childProcess from "child_process";
import log from "loglevel";

export function cronStart() {
  cron.schedule("0 0 * * SUN", () => {
    log.info("Deleting logs older than 7 days");
    childProcess.spawn("find", [
      "/appsmith-stacks/logs/backend",
      "/appsmith-stacks/logs/rts/",
      "/appsmith-stacks/logs/editor/",
      "-name",
      "*.log*",
      "-type",
      "f",
      "-mtime",
      "+7",
      "-delete",
    ]);
  });

  cron.schedule("* * * * 0", () => {
    log.info("Renewing certificate");
    childProcess.spawn("/opt/appsmith/renew-certificate.sh");
  });
}
