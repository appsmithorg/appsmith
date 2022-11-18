import difference from "lodash/difference";
import {
  JSLibraries,
  libraryReservedNames,
  TJSLibrary,
} from "utils/DynamicBindingUtils";
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
  const reservedNames = difference(keysPostInstallation, existingKeys);
  const libraryAccessor = reservedNames.pop();
  if (!libraryAccessor) return { status: true, defs, reservedNames };

  libraryReservedNames.push(...reservedNames);
  //@ts-expect-error test
  const library = self[libraryAccessor];
  JSLibraries.push({
    accessor: libraryAccessor,
    lib: library,
    name: libraryAccessor,
    docsURL: url,
  });
  defs["!name"] = `LIB/${libraryAccessor}`;
  defs[libraryAccessor] = ternDefinitionGenerator(library);
  return { status: true, defs, libraryAccessor, reservedNames };
}

export function uninstallLibrary(requestData: string) {
  const accessor = requestData;
  //@ts-expect-error test
  self[accessor] = undefined;
  return true;
}

export function loadLibraries(requestData: TJSLibrary[]) {
  const urls = requestData.map((lib) => lib.url);
  const keysBeforeInstallation = Object.keys(self);
  try {
    //@ts-expect-error no types found
    self.importScripts(...urls);
    const keysPostInstallation = Object.keys(self);
    const reservedNames = difference(
      keysPostInstallation,
      keysBeforeInstallation,
    );
    libraryReservedNames.push(...reservedNames);
    JSLibraries.push(...requestData);
    return true;
  } catch (e) {
    return false;
  }
}
