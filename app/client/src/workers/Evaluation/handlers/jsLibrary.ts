import difference from "lodash/difference";
import { JSLibraries, libraryReservedNames } from "utils/DynamicBindingUtils";
import { makeTernDefs } from "../JSLibrary/ternDefinitionGenerator";
import { EvalWorkerRequest } from "../types";

export function installLibrary(request: EvalWorkerRequest) {
  const { requestData } = request;
  const defs: any = {};
  try {
    const url = requestData;
    const currentEnvKeys = Object.keys(self);
    //@ts-expect-error test
    const unsetKeys = currentEnvKeys.filter((key) => self[key] === undefined);
    //@ts-expect-error test
    self.importScripts(url);
    const accessor = difference(Object.keys(self), currentEnvKeys) as Array<
      string
    >;
    if (accessor.length === 0) {
      for (const key of unsetKeys) {
        //@ts-expect-error test
        if (!self[key]) continue;
        accessor.push(key);
      }
    }
    if (accessor.length === 0) return { status: true, defs, accessor };
    const name = accessor[accessor.length - 1];
    for (const acc of accessor) {
      libraryReservedNames.add(acc);
    }
    defs["!name"] = `LIB/${name}`;
    for (const key of accessor) {
      //@ts-expect-error no types
      defs[key] = makeTernDefs(self[key]);
    }
    return { success: true, defs, accessor };
  } catch (e) {
    return { success: false, defs };
  }
}

export function uninstallLibrary(request: EvalWorkerRequest) {
  const { requestData } = request;
  const accessor = requestData;
  try {
    for (const key of accessor) {
      //@ts-expect-error test
      self[key] = undefined;
      libraryReservedNames.delete(key);
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function loadLibraries(request: EvalWorkerRequest) {
  //Add types
  const { requestData } = request;
  const urls = requestData.map((lib: any) => lib.url);
  const keysBefore = Object.keys(self);
  try {
    //@ts-expect-error no types found
    self.importScripts(...urls);
    const keysAfter = Object.keys(self);
    const newKeys = difference(keysAfter, keysBefore);
    for (const key of newKeys) {
      libraryReservedNames.add(key);
    }
    JSLibraries.push(...requestData);
    return true;
  } catch (e) {
    return false;
  }
}
