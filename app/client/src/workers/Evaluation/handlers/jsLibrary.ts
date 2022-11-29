import difference from "lodash/difference";
import { JSLibraries, libraryReservedNames } from "../../common/JSLibrary";
import { makeTernDefs } from "../../common/JSLibrary/ternDefinitionGenerator";
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
    try {
      for (const key of accessor) {
        //@ts-expect-error no types
        defs[key] = makeTernDefs(self[key]);
      }
    } catch (e) {
      for (const acc of accessor) {
        libraryReservedNames.delete(acc);
        //@ts-expect-error no types
        self[acc] = undefined;
      }
      return { success: false, defs, message: (e as Error).message };
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
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function loadLibraries(request: EvalWorkerRequest) {
  //Add types
  const { requestData } = request;
  const urls = requestData.map((lib: any) => lib.url);
  const keysBefore = Object.keys(self);
  let message = "";

  try {
    //@ts-expect-error no types found
    self.importScripts(...urls);
  } catch (e) {
    message = (e as Error).message;
  }
  const keysAfter = Object.keys(self);
  const newKeys = difference(keysAfter, keysBefore);
  for (const key of newKeys) {
    libraryReservedNames.add(key);
  }
  JSLibraries.push(...requestData);
  return { success: !message, message };
}
