import * as fs from "fs";

export const VERSION =
  (() => {
    try {
      return JSON.parse(fs.readFileSync("/opt/appsmith/info.json")).version;
    } catch {}
  })() || "SNAPSHOT";
