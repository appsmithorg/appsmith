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
  const parentType = typeof obj;
  let canAddMore = true;

  const cachedDefs: any = [];
  const visitedReferences: any = [];

  if (!obj || (parentType !== "object" && parentType !== "function")) {
    defs["!type"] = getTernDocType(obj);
    return defs;
  }
  const queue = Object.keys(obj as any)
    .filter((key) => !ignoredKeys.includes(key))
    .map((key) => [key, obj, defs]);

  visitedReferences.push(obj);
  cachedDefs.push(defs);

  if (parentType === "function") {
    defs["!type"] = "fn()";
    const prototypeKeys = obj.prototype
      ? Object.keys(obj.prototype).filter((key) => !ignoredKeys.includes(key))
      : [];
    if (prototypeKeys.length) {
      defs.prototype = {};
      visitedReferences.push(obj.prototype);
      cachedDefs.push(defs.prototype);
      queue.push(
        ...prototypeKeys.map((key) => [key, obj.prototype, defs.prototype]),
      );
    }
  }

  while (queue.length) {
    if (canAddMore) {
      canAddMore = queue.length < 200;
    }
    const [current, src, target] = queue.shift() as any;
    const type = typeof src[current];
    if (src[current] && type === "object") {
      if (visitedReferences.includes(src[current])) {
        target[current] = cachedDefs[visitedReferences.indexOf(src[current])];
        continue;
      }
      target[current] = {};
      visitedReferences.push(src[current]);
      cachedDefs.push(target[current]);
      canAddMore &&
        queue.push(
          ...Object.keys(src[current])
            .filter((key) => !ignoredKeys.includes(key))
            .map((key) => [key, src[current], target[current]]),
        );
    } else if (type === "function") {
      if (visitedReferences.includes(src[current])) {
        target[current] = cachedDefs[visitedReferences.indexOf(src[current])];
        continue;
      }
      target[current] = {
        "!type": "fn()",
      };
      visitedReferences.push(src[current]);
      cachedDefs.push(target[current]);
      const prototypeKeys = src[current].prototype
        ? Object.keys(src[current].prototype).filter(
            (key) => !ignoredKeys.includes(key),
          )
        : [];
      if (prototypeKeys.length) {
        target[current].prototype = {};
        canAddMore &&
          queue.push(
            ...prototypeKeys.map((key) => [
              key,
              src[current].prototype,
              target[current].prototype,
            ]),
          );
      }
      canAddMore &&
        queue.push(
          ...Object.keys(src[current])
            .filter((key) => !ignoredKeys.includes(key))
            .map((key) => [key, src[current], target[current]]),
        );
    } else {
      target[current] = {
        "!type": getTernDocType(src[current]),
      };
    }
  }

  return defs;
}
