import _ from "lodash";

export const isTernFunctionDef = (data: any) =>
  typeof data === "string" && /^fn\((?:[\w,: \(\)->])*\) -> [\w]*$/.test(data);

export const createObjectPeekData = (
  defs: any,
  data: any,
  peekData: any,
  parentKey: string,
) => {
  Object.keys(defs).forEach((key: string) => {
    if (key.indexOf("!") === -1) {
      const childKeyPathArray = [parentKey, key];
      if (isObject(defs[key])) {
        if (Object.keys(defs[key]).length > 0) {
          peekData[key] = {};
          const result = createObjectPeekData(
            defs[key],
            data[key],
            peekData[key],
            key,
          );
          _.set(peekData, childKeyPathArray, result.peekData);
        } else {
          peekData[key] = data[key];
        }
      } else {
        peekData[key] = isTernFunctionDef(defs[key])
          ? // eslint-disable-next-line @typescript-eslint/no-empty-function
            function () {} // tern inference required here
          : data[key];
      }
    }
  });
  return { peekData };
};

const isObject = (data: any) =>
  typeof data === "object" && !Array.isArray(data) && data !== null;
