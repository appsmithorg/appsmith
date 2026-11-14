import fsPromises from "fs/promises";
import * as Constants from "./constants";

export async function backup_error(err) {
  console.error(err);
  const logPath = Constants.getAppsmithctlLogPath();

  await fsPromises.mkdir(logPath, { recursive: true });
  await fsPromises.appendFile(
    logPath + "/backup.log",
    new Date().toISOString() + " [ ERROR ] " + err + "\n",
  );
}

export async function backup_info(msg) {
  console.log(msg);
  const logPath = Constants.getAppsmithctlLogPath();

  await fsPromises.mkdir(logPath, { recursive: true });
  await fsPromises.appendFile(
    logPath + "/backup.log",
    new Date().toISOString() + " [ INFO ] " + msg + "\n",
  );
}
