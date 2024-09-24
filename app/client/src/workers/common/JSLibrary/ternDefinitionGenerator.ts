import log from "loglevel";
import type { Def } from "tern";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTernDocType(obj: any) {
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

export function typeToTernType(type: string) {
  if (type === "boolean") return "bool";

  if (type === "function") return "fn()";

  if (type === "number") return "number";

  if (type === "array") return "[]";

  if (type === "string") return "string";

  return "?";
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeTernDefs(obj: any) {
  const defs: Def = {};
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedDefs: any = [];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visitedReferences: any = [];
  const MAX_ITERATIONS = 5000;
  let iteration_count = 1;
  const baseObjPrototype = Object.getPrototypeOf({});

  const queue = [[obj, defs]];

  try {
    while (queue.length && iteration_count < MAX_ITERATIONS) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
