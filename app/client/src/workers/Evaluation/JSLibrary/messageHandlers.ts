import difference from "lodash/difference";
import { defaultLibraries } from "utils/DynamicBindingUtils";
import { additionalLibrariesNames } from "../evaluate";
import { ternDefinitionGenerator } from "./ternDefinitionGenerator";

export function installLibrary(requestData: string) {
  const url = requestData;
  const existingKeys = Object.keys(self);
  const defs: any = {};
  try {
    //@ts-expect-error test
    self.importScripts(url);
  } catch (e) {
    return { status: false, defs };
  }
  const keysPostInstallation = Object.keys(self);
  const libraryAccessor = difference(keysPostInstallation, existingKeys).pop();
  if (!libraryAccessor) return { status: true, defs };
  //@ts-expect-error test
  const library = self[libraryAccessor];
  defaultLibraries.push({
    accessor: libraryAccessor,
    lib: library,
    name: libraryAccessor,
    docsURL: url,
  });
  defs["!name"] = `LIB/${libraryAccessor}`;
  defs[libraryAccessor] = ternDefinitionGenerator(library);
  return { status: true, defs, libraryAccessor };
}

export function uninstallLibrary(requestData: string) {
  const accessor = requestData;
  //@ts-expect-error test
  self[accessor] = undefined;
  return true;
}

export function loadLibraries(requestData: string[]) {
  const urls = requestData;
  const existingKeys = Object.keys(self);
  try {
    //@ts-expect-error no types found
    self.importScripts(...urls);
    const keysPostInstallation = Object.keys(self);
    const libraryAccessors = difference(keysPostInstallation, existingKeys);
    additionalLibrariesNames.push(...libraryAccessors);
    return true;
  } catch (e) {
    return false;
  }
}
