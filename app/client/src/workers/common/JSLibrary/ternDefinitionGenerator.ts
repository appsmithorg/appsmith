import log from "loglevel";
import type { Def } from "tern";

function getTernDocType(obj: any) {
  const type = typeof obj;
  switch (type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "bool";
    case "undefined":
      return "?";
    case "function":
      return "fn()";
    default:
      return "?";
  }
}

const ignoredKeys = [
  "constructor",
  "WINDOW",
  "window",
  "self",
  "arguments",
  "caller",
  "length",
  "name",
];

export function makeTernDefs(obj: any) {
  const defs: Def = {};
  const cachedDefs: any = [];
  const visitedReferences: any = [];
  const MAX_ITERATIONS = 5000;
  let iteration_count = 1;
  const baseObjPrototype = Object.getPrototypeOf({});

  const queue = [[obj, defs]];

  try {
    while (queue.length && iteration_count < MAX_ITERATIONS) {
      const [src, target] = queue.shift() as any;
      if (visitedReferences.includes(src)) {
        target["!type"] = cachedDefs[visitedReferences.indexOf(src)]["!type"];
        continue;
      }
      const type = typeof src;
      if (!src || (type !== "object" && type !== "function")) {
        target["!type"] = getTernDocType(src);
        continue;
      } else if (type === "function") {
        target["!type"] = "fn()";
      }
      queue.push(
        ...Object.getOwnPropertyNames(src)
          .filter((key) => !ignoredKeys.includes(key))
          .map((key) => {
            target[key] = {};
            return [src[key], target[key]];
          }),
      );
      if (type === "object") {
        const prototype = Object.getPrototypeOf(src);
        if (prototype !== baseObjPrototype) {
          queue.push(
            ...Object.getOwnPropertyNames(prototype)
              .filter((key) => !ignoredKeys.includes(key))
              .map((key) => {
                target[key] = {};
                return [src[key], target[key]];
              }),
          );
        }
      }
      iteration_count++;
    }
  } catch (e) {
    log.debug("Unknown depth", e);
  }
  return defs;
}
