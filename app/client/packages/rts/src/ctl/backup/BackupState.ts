import { getTimeStampInISO } from "./index";

export class BackupState {
  readonly args: string[];
  readonly initAt: string = getTimeStampInISO();
  readonly errors: string[] = [];

  backupRootPath: string = "";
  archivePath: string = "";

  encryptionPassword: string = "";

  constructor(args: string[]) {
    this.args = args;

    // We seal `this` so that no link in the chain can "add" new properties to the state. This is intentional. If any
    // link wants to save data in the `BackupState`, which shouldn't even be needed in most cases, it should do so by
    // explicitly declaring a property in this class. No surprises.
    Object.seal(this);
  }

  isEncryptionEnabled() {
    return !!this.encryptionPassword;
  }
}
