import camelCase from "lodash/camelCase";

export function toPascalCase(inputString: string) {
  const camelCaseString = camelCase(inputString);
  return camelCaseString.charAt(0).toUpperCase() + camelCaseString.slice(1);
}
