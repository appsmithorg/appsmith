import fs from "node:fs";
import os from "os";
import path from "path";
import * as utils from "./utils";
import * as restore from "./restore";

let mockConfigPath: string;

// Use the real parser, remapping only the installed paths to isolated fixtures.
jest.mock("child_process", () => {
  const actual = jest.requireActual("child_process");

  return {
    ...actual,
    execFileSync: (file, args, options) =>
      actual.execFileSync(
        file,
        args.map((arg) => {
          if (arg === "/opt/appsmith/env-file.py") {
            return jest
              .requireActual("path")
              .resolve(
                __dirname,
                "../../../../../../deploy/docker/fs/opt/appsmith/env-file.py",
              );
          }

          if (arg === "/appsmith-stacks/configuration/docker.env") {
            return mockConfigPath;
          }

          return arg;
        }),
        options,
      ),
  };
});
jest.mock("./restore", () => ({ run: jest.fn() }));
jest.mock("./backup", () => ({ run: jest.fn() }));
jest.mock("./export_db", () => ({ run: jest.fn() }));
jest.mock("./import_db", () => ({ run: jest.fn() }));
jest.mock("./enable_form_login", () => ({ run: jest.fn() }));
jest.mock("./check_replica_set", () => ({ exec: jest.fn() }));
jest.mock("./version", () => ({ exec: jest.fn() }));
jest.mock("./mongo_shell_utils", () => ({ exec: jest.fn() }));

const originalEnv = { ...process.env };
const originalArgv = process.argv;
const configPath = "/appsmith-stacks/configuration/docker.env";
const dbUrl =
  "mongodb://user:password@db.example/appsmith?authSource=admin&replicaSet=rs0";
let directory: string;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "appsmith-url-test-"));
  mockConfigPath = path.join(directory, "docker.env");
  fs.writeFileSync(mockConfigPath, "");

  for (const name of [
    "APPSMITH_DB_URL",
    "APPSMITH_MONGODB_URI",
    "APPSMITH_MONGO_DB_URI",
  ]) {
    delete process.env[name];
  }

  process.argv = ["node", "appsmithctl", "restore"];
  const readFile = fs.readFileSync.bind(fs);

  jest
    .spyOn(fs, "readFileSync")
    .mockImplementation((file, ...args) =>
      readFile(file === configPath ? mockConfigPath : file, ...args),
    );
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();

  for (const name in process.env) {
    if (!(name in originalEnv)) delete process.env[name];
  }

  Object.assign(process.env, originalEnv);
  process.argv = originalArgv;
  fs.rmSync(directory, { recursive: true, force: true });
});

describe("complete database configuration — GHSA-h6hh-wqxc-5hw9", () => {
  test.each([dbUrl, `'${dbUrl}'`, `"${dbUrl}"`])(
    "file fallback preserves URL and decodes quotes: %s",
    (value) => {
      fs.writeFileSync(mockConfigPath, `APPSMITH_DB_URL=${value}\n`);
      expect(utils.getDburl()).toBe(dbUrl);
    },
  );

  test("uses exact names, the last assignment, and decoded quote concatenation", () => {
    fs.writeFileSync(
      mockConfigPath,
      `APPSMITH_DB_URL_EXTRA=ignored\nAPPSMITH_DB_URL=old\nAPPSMITH_DB_URL='${dbUrl}'"'"'s' # note\n`,
    );
    expect(utils.getDburl()).toBe(dbUrl + "'s");
  });

  test.each([
    "APPSMITH_DB_URL",
    "APPSMITH_MONGODB_URI",
    "APPSMITH_MONGO_DB_URI",
  ])("external %s takes precedence over the file", (name) => {
    process.env[name] = dbUrl;
    fs.writeFileSync(mockConfigPath, "APPSMITH_DB_URL=stored\n");
    expect(utils.getDburl()).toBe(dbUrl);
  });

  test("file fallback supports the legacy URL name", () => {
    fs.writeFileSync(mockConfigPath, `APPSMITH_MONGODB_URI='${dbUrl}'\n`);
    expect(utils.getDburl()).toBe(dbUrl);
  });

  test.each(["APPSMITH_DB_URL", "APPSMITH_MONGODB_URI"])(
    "CLI loads the complete file-only %s before restore",
    (name) => {
      fs.writeFileSync(mockConfigPath, `${name}='${dbUrl}'\n`);
      let received: string;

      (restore.run as jest.Mock).mockImplementation(() => {
        received = utils.getDburl();
      });
      jest.isolateModules(() => {
        jest.requireActual("./index");
      });
      expect(restore.run).toHaveBeenCalledTimes(1);
      expect(received).toBe(dbUrl);
      expect(process.env.APPSMITH_DB_URL).toBe(dbUrl);
    },
  );

  test("CLI decodes literal quotes without replacing an external legacy URL", () => {
    process.env.APPSMITH_MONGODB_URI = dbUrl;
    fs.writeFileSync(
      mockConfigPath,
      "APPSMITH_DB_URL=stored\nAPPSMITH_ENCRYPTION_PASSWORD='a'\"'\"'b'\n",
    );
    jest.isolateModules(() => {
      jest.requireActual("./index");
    });
    expect(process.env.APPSMITH_DB_URL).toBe(dbUrl);
    expect(process.env.APPSMITH_ENCRYPTION_PASSWORD).toBe("a'b");
  });

  test("CLI does not manufacture an undefined URL", () => {
    jest.isolateModules(() => {
      jest.requireActual("./index");
    });
    expect(process.env.APPSMITH_DB_URL).toBeUndefined();
  });

  test("CLI preserves external values, including explicitly empty non-URL settings", () => {
    process.env.APPSMITH_DB_URL = dbUrl;
    process.env.APPSMITH_INSTANCE_NAME = "";
    fs.writeFileSync(
      mockConfigPath,
      "APPSMITH_DB_URL=stored\nAPPSMITH_INSTANCE_NAME=stored\n",
    );
    jest.isolateModules(() => {
      jest.requireActual("./index");
    });
    expect(process.env.APPSMITH_DB_URL).toBe(dbUrl);
    expect(process.env.APPSMITH_INSTANCE_NAME).toBe("");
  });

  test("CLI rejects malformed configuration before dispatching restore", () => {
    fs.writeFileSync(mockConfigPath, "APPSMITH_DB_URL='private-value\n");
    expect(() =>
      jest.isolateModules(() => {
        jest.requireActual("./index");
      }),
    ).toThrow(
      "Environment configuration cannot be loaded. Check docker.env syntax and permissions.",
    );
    expect(restore.run).not.toHaveBeenCalled();
  });

  test("file fallback rejects malformed configuration without exposing values", () => {
    fs.writeFileSync(mockConfigPath, "APPSMITH_DB_URL='private-value\n");
    expect(() => utils.getDburl()).toThrow(
      "Environment configuration cannot be loaded. Check docker.env syntax and permissions.",
    );
    expect(
      JSON.stringify((console.error as jest.Mock).mock.calls),
    ).not.toContain("private-value");
  });
});
