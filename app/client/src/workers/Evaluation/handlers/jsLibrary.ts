import {
  createMessage,
  customJSLibraryMessages,
} from "@appsmith/constants/messages";
import difference from "lodash/difference";
import { Def } from "tern";
import {
  JSLibraries,
  libraryReservedIdentifiers,
  resetJSLibraries,
} from "../../common/JSLibrary";
import { makeTernDefs } from "../../common/JSLibrary/ternDefinitionGenerator";
import { EvalWorkerSyncRequest } from "../types";

enum LibraryInstallError {
  NameCollisionError,
  ImportError,
  TernDefinitionError,
  LibraryOverrideError,
}

class NameCollisionError extends Error {
  code = LibraryInstallError.NameCollisionError;
  constructor(accessors: string) {
    super(
      createMessage(customJSLibraryMessages.NAME_COLLISION_ERROR, accessors),
    );
    this.name = "NameCollisionError";
  }
}

class ImportError extends Error {
  code = LibraryInstallError.ImportError;
  constructor(url: string) {
    super(createMessage(customJSLibraryMessages.IMPORT_URL_ERROR, url));
    this.name = "ImportError";
  }
}

class TernDefinitionError extends Error {
  code = LibraryInstallError.TernDefinitionError;
  constructor(name: string) {
    super(createMessage(customJSLibraryMessages.DEFS_FAILED_ERROR, name));
    this.name = "TernDefinitionError";
  }
}

class LibraryOverrideError extends Error {
  code = LibraryInstallError.LibraryOverrideError;
  data: any;
  constructor(name: string, data: any) {
    super(createMessage(customJSLibraryMessages.LIB_OVERRIDE_ERROR, name));
    this.name = "LibraryOverrideError";
    this.data = data;
  }
}

export function installLibrary(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { takenAccessors, takenNamesMap, url } = data;
  const defs: Def = {};
  try {
    const currentEnvKeys = Object.keys(self);

    //@ts-expect-error Find libraries that were uninstalled.
    const unsetKeys = currentEnvKeys.filter((key) => self[key] === undefined);

    const existingLibraries: Record<string, any> = {};

    for (const acc of takenAccessors) {
      existingLibraries[acc] = self[acc];
    }

    try {
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
      libraryReservedIdentifiers[acc] = true;
    }

    return { success: true, defs, accessor };
  } catch (error) {
    return { success: false, defs, error };
  }
}

export function uninstallLibrary(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const accessor = data;
  try {
    for (const key of accessor) {
      try {
        delete self[key];
      } catch (e) {
        //@ts-expect-error ignore
        self[key] = undefined;
      }
      delete libraryReservedIdentifiers[key];
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function loadLibraries(request: EvalWorkerSyncRequest) {
  resetJSLibraries();
  //Add types
  const { data } = request;
  const urls = data.map((lib: any) => lib.url);
  const keysBefore = Object.keys(self);
  let message = "";

  try {
    self.importScripts(...urls);
  } catch (e) {
    message = (e as Error).message;
  }
  const keysAfter = Object.keys(self);
  const newKeys = difference(keysAfter, keysBefore);
  for (const key of newKeys) {
    libraryReservedIdentifiers[key] = true;
  }
  JSLibraries.push(...data);
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
