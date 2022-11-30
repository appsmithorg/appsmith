import difference from "lodash/difference";
import { JSLibraries, libraryReservedNames } from "../../common/JSLibrary";
import { makeTernDefs } from "../../common/JSLibrary/ternDefinitionGenerator";
import { EvalWorkerRequest } from "../types";

enum LibraryInstallError {
  NameCollisionError,
  ImportError,
  TernDefinitionError,
  LibraryOverrideError,
}

class NameCollisionError extends Error {
  code: number = LibraryInstallError.NameCollisionError;
  constructor(accessors: string) {
    const message = `Name collision detected: ${accessors}`;
    super(message);
    this.name = "NameCollisionError";
  }
}

class ImportError extends Error {
  code: number = LibraryInstallError.ImportError;
  constructor(url: string) {
    const message = `The script at ${url} cannot be installed.`;
    super(message);
    this.name = "ImportError";
  }
}

class TernDefinitionError extends Error {
  code: number = LibraryInstallError.TernDefinitionError;
  constructor(name: string) {
    const message = `Failed to generate autocomplete definitions for ${name}.`;
    super(message);
    this.name = "TernDefinitionError";
  }
}

class LibraryOverrideError extends Error {
  code: number = LibraryInstallError.LibraryOverrideError;
  data: any;
  constructor(name: string, data: any) {
    const message = `The library ${name} is already installed. 
    If you are trying to install a different version, uninstall the library first.`;
    super(message);
    this.name = "LibraryOverrideError";
    this.data = data;
  }
}

export function installLibrary(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { takenAccessors, takenNamesMap, url } = requestData;
  const defs: any = {};
  try {
    const currentEnvKeys = Object.keys(self);

    //@ts-expect-error Find libraries that were uninstalled.
    const unsetKeys = currentEnvKeys.filter((key) => self[key] === undefined);

    const existingLibraries: Record<string, any> = {};

    for (const acc of takenAccessors) {
      existingLibraries[acc] = self[acc];
    }

    try {
      //@ts-expect-error Local install begins.
      self.importScripts(url);
    } catch (e) {
      throw new ImportError(url);
    }

    // Find keys add that were installed to the global scope.
    const accessor = difference(Object.keys(self), currentEnvKeys) as Array<
      string
    >;

    checkForNameCollision(accessor, takenNamesMap);

    checkIfUninstalledEarlier(accessor, unsetKeys);

    checkForOverrides(url, accessor, takenAccessors, existingLibraries);

    if (accessor.length === 0) return { status: false, defs, accessor };

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
  } catch (error) {
    return { success: false, defs, error };
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

function checkForNameCollision(
  accessor: string[],
  takenNamesMap: Record<string, any>,
) {
  const collidingNames = accessor.filter((key: string) => takenNamesMap[key]);
  if (collidingNames.length) {
    for (const acc of accessor) {
      //@ts-expect-error no types
      self[acc] = undefined;
    }
    throw new NameCollisionError(collidingNames.join(", "));
  }
}

function checkIfUninstalledEarlier(accessor: string[], unsetKeys: string[]) {
  if (accessor.length > 0) return;
  for (const key of unsetKeys) {
    //@ts-expect-error no types
    if (!self[key]) continue;
    accessor.push(key);
  }
}

function checkForOverrides(
  url: string,
  accessor: string[],
  takenAccessors: string[],
  existingLibraries: Record<string, any>,
) {
  if (accessor.length > 0) return;
  const overriddenAccessors: Array<string> = [];
  for (const acc of takenAccessors) {
    //@ts-expect-error no types
    if (existingLibraries[acc] === self[acc]) continue;
    //@ts-expect-error no types
    self[acc] = existingLibraries[acc];
    overriddenAccessors.push(acc);
  }
  if (overriddenAccessors.length === 0) return;
  throw new LibraryOverrideError(url, overriddenAccessors);
}
