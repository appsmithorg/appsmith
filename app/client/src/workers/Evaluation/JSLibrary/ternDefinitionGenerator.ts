import log from "loglevel";

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

const ignoredKeys = ["constructor", "WINDOW", "window", "self"];

export function makeTernDefs(obj: any) {
  const defs: Record<string, unknown> = {};
  const cachedDefs: any = [];
  const visitedReferences: any = [];

  const queue = [[obj, defs]];

  try {
    while (queue.length) {
      const [src, target] = queue.shift() as any;
      if (visitedReferences.includes(src)) {
        target["!type"] = cachedDefs[visitedReferences.indexOf(src)]["!type"];
        continue;
      }
      const type = typeof src;
      if (src && type === "object") {
        queue.push(
          ...Object.keys(src)
            .filter((key) => !ignoredKeys.includes(key))
            .map((key) => {
              target[key] = {};
              return [src[key], target[key]];
            }),
        );
        visitedReferences.push(src);
        cachedDefs.push(target);
      } else if (type === "function") {
        target["!type"] = "fn()";
        queue.push(
          ...Object.keys(src)
            .filter((key) => !ignoredKeys.includes(key))
            .map((key) => {
              target[key] = {};
              return [src[key], target[key]];
            }),
        );
        const prototypeKeys = src.prototype
          ? Object.keys(src.prototype).filter(
              (key) => !ignoredKeys.includes(key),
            )
          : [];
        if (prototypeKeys.length) {
          target.prototype = {};
          queue.push([src.prototype, target.prototype]);
        }
        visitedReferences.push(src);
        cachedDefs.push(target);
      } else {
        target["!type"] = getTernDocType(src);
      }
    }
  } catch (e) {
    log.debug("Unknown depth", e);
  }

  return defs;
}
