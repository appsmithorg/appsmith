import type { Link } from ".";
import type { BackupState } from "../BackupState";
import fsPromises from "fs/promises";

const SECRETS_WARNING = `
***************************** IMPORTANT!!! *****************************
*** Please ensure you have saved the APPSMITH_ENCRYPTION_SALT and    ***
*** APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file. ***
*** These values are not included in the backup export.              ***
************************************************************************
`;

/**
 * Exports the docker environment file to the backup folder. If encryption is not enabled, sensitive information is
 * not written to the backup folder.
 */
export class EnvFileLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    console.log("Exporting docker environment file");
    const content = await fsPromises.readFile(
      "/appsmith-stacks/configuration/docker.env",
      { encoding: "utf8" },
    );
    let cleanedContent = removeSensitiveEnvData(content);

    if (this.state.isEncryptionEnabled) {
      cleanedContent +=
        "\nAPPSMITH_ENCRYPTION_SALT=" +
        process.env.APPSMITH_ENCRYPTION_SALT +
        "\nAPPSMITH_ENCRYPTION_PASSWORD=" +
        process.env.APPSMITH_ENCRYPTION_PASSWORD;
    }

    await fsPromises.writeFile(
      this.state.backupRootPath + "/docker.env",
      cleanedContent,
    );
    console.log("Exporting docker environment file done.");
  }

  async postBackup() {
    if (!this.state.isEncryptionEnabled) {
      console.log(SECRETS_WARNING);
    }
  }
}

export function removeSensitiveEnvData(content: string): string {
  // Remove encryption and Mongodb data from docker.env
  const outLines: string[] = [];

  content.split(/\r?\n/).forEach((line) => {
    if (
      !line.startsWith("APPSMITH_ENCRYPTION") &&
      !line.startsWith("APPSMITH_MONGODB") &&
      !line.startsWith("APPSMITH_DB_URL=")
    ) {
      outLines.push(line);
    }
  });

  return outLines.join("\n");
}
