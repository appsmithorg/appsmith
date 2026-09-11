import { execFile } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs/promises";

/** Validate persisted configuration and quote literal overrides using the startup parser. */
export async function serializeEnvFile(
  content: string,
  values: Record<string, string>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const failure = () =>
      reject(
        new Error(
          "Environment configuration cannot be persisted. Check docker.env for unsupported names, " +
            "unquoted expressions or malformed assignments, and ensure supplied values contain no control characters. " +
            "Resolve expressions from a trusted source and single-quote intentional literal expressions. " +
            "Do not source the file to convert it.",
        ),
      );
    const child = execFile(
      "/usr/bin/python3",
      ["/opt/appsmith/env-file.py", "merge", "-"],
      { timeout: 10000, maxBuffer: 4 * 1024 * 1024, encoding: "utf8" },
      (error, stdout) => {
        // Child-process errors can carry stdout/stderr containing secret values.
        if (error) failure();
        else resolve(stdout);
      },
    );

    child.stdin.on("error", failure);
    child.stdin.end(JSON.stringify({ content, values }));
  });
}

/** Replace only a fully validated file, using a private sibling on the same filesystem. */
export async function writeEnvFile(file: string, content: string) {
  const temporary = `${file}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(temporary, content, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    await fs.rename(temporary, file);
  } finally {
    try {
      await fs.unlink(temporary);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
