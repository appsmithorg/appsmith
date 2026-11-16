import { getDatabaseNameFromMongoURI, getDburl } from "../utils";

/** Collection names mongodump compares with `==`. */
const COLLECTION_NAME = /^[A-Za-z0-9_-]+$/;

export class BackupState {
  readonly args: readonly string[];
  readonly excludedCollections: readonly string[];
  readonly initAt: string = new Date().toISOString().replace(/:/g, "-");
  readonly errors: string[] = [];

  backupRootPath: string = "";
  archivePath: string = "";

  isEncryptionEnabled: boolean = false;

  constructor(args: string[]) {
    this.args = Object.freeze([...args]);
    // APPSMITH_DB_URL must name the database, for example /appsmith.
    // Appsmith does not run without it. mongodump also refuses
    // --excludeCollection unless that database is in the URI.
    this.excludedCollections = Object.freeze(
      resolveExcludedCollections(
        process.env.APPSMITH_BACKUP_EXCLUDE_COLLECTIONS,
        getDatabaseNameFromMongoURI(getDburl()),
      ),
    );

    // We seal `this` so that no link in the chain can "add" new properties to the state. This is intentional. If any
    // link wants to save data in the `BackupState`, which shouldn't even be needed in most cases, it should do so by
    // explicitly declaring a property in this class. No surprises.
    Object.seal(this);
  }
}

/**
 * Names from `APPSMITH_BACKUP_EXCLUDE_COLLECTIONS` that belong to `databaseName`.
 * A dotted value is `database.collection`. It is kept only when the database matches.
 * An unset variable excludes nothing.
 */
export function resolveExcludedCollections(
  envValue: string | undefined,
  databaseName: string,
): string[] {
  const names = (envValue ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  const excluded = new Set<string>();

  for (const name of names) {
    const collection = collectionInDatabase(name, databaseName);

    if (collection == null) {
      continue;
    }

    if (!COLLECTION_NAME.test(collection)) {
      console.warn(
        `Backup exclusion "${collection}" does not look like a collection name. ` +
          "Passing it to mongodump anyway. " +
          "It is ignored when no collection has that exact name.",
      );
    }

    excluded.add(collection);
  }

  return [...excluded];
}

/** A bare name is a collection. `database.collection` is kept only when the database matches. */
function collectionInDatabase(
  name: string,
  databaseName: string,
): string | null {
  const dot = name.indexOf(".");

  if (dot === -1) {
    return name;
  }

  const database = name.slice(0, dot).trim();
  const collection = name.slice(dot + 1).trim();

  if (
    database.length > 0 &&
    database === databaseName &&
    collection.length > 0
  ) {
    return collection;
  }

  console.warn(
    `Backup exclusion "${name}" was not applied. ` +
      `Its database does not match "${databaseName}".`,
  );

  return null;
}
