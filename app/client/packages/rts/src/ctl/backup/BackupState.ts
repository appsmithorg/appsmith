export class BackupState {
  readonly args: readonly string[];
  readonly initAt: string = new Date().toISOString().replace(/:/g, "-");
  readonly errors: string[] = [];

  backupRootPath: string = "";
  archivePath: string = "";

  isEncryptionEnabled: boolean = false;

  constructor(args: string[]) {
    this.args = Object.freeze([...args]);

    // We seal `this` so that no link in the chain can "add" new properties to the state. This is intentional. If any
    // link wants to save data in the `BackupState`, which shouldn't even be needed in most cases, it should do so by
    // explicitly declaring a property in this class. No surprises.
    Object.seal(this);
  }
}
