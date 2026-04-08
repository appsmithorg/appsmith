import * as fs from "fs";
import * as path from "path";
import type { MigrationState } from "../fixtures/migration.setup";

const STATE_FILE = path.resolve(__dirname, "../.state/migration.json");

export function loadMigrationState(): MigrationState {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      `Migration state file not found at ${STATE_FILE}. ` +
        "Ensure the migration-setup project ran successfully.",
    );
  }

  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}
