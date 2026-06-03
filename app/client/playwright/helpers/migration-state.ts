import * as fs from "fs";
import * as path from "path";
import type {
  MigrationState,
  MigrationPage,
} from "../fixtures/migration.setup";

const STATE_FILE = path.resolve(__dirname, "../.state/migration.json");

export function loadMigrationState(): MigrationState {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      `Migration state file not found at ${STATE_FILE}. ` +
        "Ensure the migration-setup project ran successfully.",
    );
  }

  const state: MigrationState = JSON.parse(
    fs.readFileSync(STATE_FILE, "utf-8"),
  );

  return state;
}

export function getPage(state: MigrationState, key: string): MigrationPage {
  const page = state.pages[key];
  if (!page) {
    const available = Object.keys(state.pages);
    throw new Error(
      `Page "${key}" not found in migration state. Available keys: [${available.join(", ")}]`,
    );
  }
  return page;
}
