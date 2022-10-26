export function ternDefinitionGenerator(obj: Record<string, any>) {
  const cachedObjs: any = [];
  const cachedValues: any = [];
  const def = {};
  const protoDef = {};
  function generate(obj: Record<string, any>, def: Record<string, any>) {
    const keys = Object.keys(obj);
    for (const key of keys) {
      const cached = cachedObjs.findIndex((c: any) => c == obj[key]);
      if (cached > -1) {
        def[key] = cachedValues[cached];
        continue;
      } else if (typeof obj[key] === "object") {
        def[key] = {};
        generate(obj[key], def[key]);
      } else if (typeof obj[key] === "function") {
        def[key] = {};
        generate(obj[key], def[key]);
      } else {
        def[key] = {
          "!type": getTernDocType(obj[key]),
        };
      }
      cachedObjs.push(obj[key]);
      cachedValues.push(def[key]);
    }
  }
  try {
    generate(obj, def);
    generate(obj.prototype, protoDef);
  } catch (e) {
    return Object.keys(obj || {}).reduce((acc, key) => {
      acc[key] = acc[key] || {};
      acc[key] = {
        "!type":
          typeof obj[key] === "function"
            ? "fn()"
            : typeof obj[key] === "boolean"
            ? "bool"
            : typeof obj[key],
      };
      return acc;
    }, {} as any);
  }
  return { ...def, prototype: protoDef };
}

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
