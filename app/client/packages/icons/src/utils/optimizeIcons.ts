#!/usr/bin/env node

import type { PathLike } from "fs";
import fg from "fast-glob";
import fs from "fs-extra";
import { optimize } from "svgo";

async function optimizeIcons() {
  const entries = await fg("./src/icons/**/*.svg");

  entries.map(async (filepath: PathLike) => {
    await fs.readFile(filepath, "utf-8", async (err, file) => {
      if (err) {
        // eslint-disable-next-line no-console
        return console.error(err);
      }

      await fs.writeFile(filepath, optimize(file).data, "utf8", function (err) {
        // eslint-disable-next-line no-console
        if (err) return console.error(err);
      });
    });
  });

  // eslint-disable-next-line no-console
  console.error("\x1b[32mIcon optimisation completed successfully!\x1b[0m");
}

optimizeIcons();
