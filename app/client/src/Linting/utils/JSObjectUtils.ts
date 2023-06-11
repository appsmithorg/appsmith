import { parseJSObject } from "@shared/ast";

export class JSObjectUtils {
  static getKeyValuePairs(body: string): [string, string][] | null {
    const replaceExportDefault = body.replace("export default", "");
    const { parsedObject, success } = parseJSObject(replaceExportDefault);
    if (!success) return null;
    return parsedObject.map((ele) => [ele.key, ele.value]);
  }
}
