import difference from "lodash/difference";
import { JSLibraries, libraryReservedNames } from "../../common/JSLibrary";
import { makeTernDefs } from "../../common/JSLibrary/ternDefinitionGenerator";
import { EvalWorkerRequest } from "../types";

class NameCollisionError extends Error {
  constructor(accessors: string) {
    const message = `Name collision detected: ${accessors}`;
    super(message);
    this.name = "NameCollisionError";
  }
}

class ImportError extends Error {
  constructor(url: string) {
    const message = `The script at ${url} cannot be installed.`;
    super(message);
    this.name = "ImportError";
  }
}

class TernDefinitionError extends Error {
  constructor(name: string) {
    const message = `Failed to generate autocomplete definitions for ${name}.`;
    super(message);
    this.name = "TernDefinitionError";
  }
}

export function installLibrary(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { takenNamesMap, url } = requestData;
  const defs: any = {};
  try {
    const currentEnvKeys = Object.keys(self);

    //@ts-expect-error Find libraries that were uninstalled.
    const unsetKeys = currentEnvKeys.filter((key) => self[key] === undefined);

    try {
      //@ts-expect-error Local install begins.
      self.importScripts(url);
    } catch (e) {
      throw new ImportError(`The script at ${url} cannot be installed.`);
    }

    // Find keys add that were installed to the global scope.
    const accessor = difference(Object.keys(self), currentEnvKeys) as Array<
      string
    >;

    // Checks collision with existing names.
    const collidingNames = accessor.filter((key) => takenNamesMap[key]);
    if (collidingNames.length) {
      for (const acc of accessor) {
        //@ts-expect-error no types
        self[acc] = undefined;
      }
      throw new NameCollisionError(collidingNames.join(", "));
    }

    /* Check if the library is being reinstalled(uninstall and then install again) */
    if (accessor.length === 0) {
      for (const key of unsetKeys) {
        //@ts-expect-error test
        if (!self[key]) continue;
        accessor.push(key);
      }
    }

    if (accessor.length === 0) return { status: true, defs, accessor };

    //Reserves accessor names.
    const name = accessor[accessor.length - 1];

    defs["!name"] = `LIB/${name}`;
    try {
      for (const key of accessor) {
        //@ts-expect-error no types
        defs[key] = makeTernDefs(self[key]);
      }
    } catch (e) {
      for (const acc of accessor) {
        //@ts-expect-error no types
        self[acc] = undefined;
      }
      throw new TernDefinitionError(
        `Failed to generate autocomplete definitions: ${name}`,
      );
    }

    //Reserve accessor names.
    for (const acc of accessor) {
      libraryReservedNames.add(acc);
    }

    return { success: true, defs, accessor };
  } catch (e) {
    return { success: false, defs, message: (e as Error).message };
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
