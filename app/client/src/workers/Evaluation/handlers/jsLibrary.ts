import {
  createMessage,
  customJSLibraryMessages,
} from "@appsmith/constants/messages";
import difference from "lodash/difference";
import type { Def } from "tern";
import { invalidEntityIdentifiers } from "workers/common/DependencyMap/utils";
import {
  JSLibraries,
  libraryReservedIdentifiers,
} from "../../common/JSLibrary";
import { resetJSLibraries } from "../../common/JSLibrary/resetJSLibraries";
import { makeTernDefs } from "../../common/JSLibrary/ternDefinitionGenerator";
import type { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";

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

const removeDataTreeFromContext = () => {
  if (!dataTreeEvaluator) return {};
  const evalTree = dataTreeEvaluator?.getEvalTree();
  const dataTreeEntityNames = Object.keys(evalTree);
  const tempDataTreeStore: Record<string, any> = {};
  for (const entityName of dataTreeEntityNames) {
    // @ts-expect-error: self is a global variable
    tempDataTreeStore[entityName] = self[entityName];
    // @ts-expect-error: self is a global variable
    delete self[entityName];
  }
  return tempDataTreeStore;
};

function addTempStoredDataTreeToContext(
  tempDataTreeStore: Record<string, any>,
) {
  const dataTreeEntityNames = Object.keys(tempDataTreeStore);
  for (const entityName of dataTreeEntityNames) {
    // @ts-expect-error: self is a global variable
    self[entityName] = tempDataTreeStore[entityName];
  }
}

export async function installLibrary(request: EvalWorkerASyncRequest) {
  const { data } = request;
  const { takenAccessors, takenNamesMap, url } = data;
  const defs: Def = {};
  /**
   * We need to remove the data tree from the global scope before importing the library.
   * This is because the library might have a variable with the same name as a data tree entity. If that happens, the data tree entity will be overridden by the library variable.
   * We store the data tree in a temporary variable and add it back to the global scope after the library is imported.
   */
  const tempDataTreeStore = removeDataTreeFromContext();
  try {
    const currentEnvKeys = Object.keys(self);

    //@ts-expect-error Find libraries that were uninstalled.
    const unsetKeys = currentEnvKeys.filter((key) => self[key] === undefined);

    const existingLibraries: Record<string, any> = {};
    for (const acc of takenAccessors) {
      existingLibraries[acc] = self[acc];
    }
    let module = null;
    try {
      self.importScripts(url);
    } catch (e) {
      try {
        module = await import(/* webpackIgnore: true */ url);
      } catch (e) {
        throw new ImportError(url);
      }
    }

    // Find keys add that were installed to the global scope.
    const accessors = difference(
      Object.keys(self),
      currentEnvKeys,
    ) as Array<string>;

    // If no keys were added to the global scope, check if the module is a ESM module.
    if (accessors.length === 0) {
      if (module && typeof module === "object") {
        const uniqAccessor = generateUniqueAccessor(
          url,
          takenAccessors,
          takenNamesMap,
        );
        // @ts-expect-error no types
        self[uniqAccessor] = flattenModule(module);
        accessors.push(uniqAccessor);
      }
    }

    addTempStoredDataTreeToContext(tempDataTreeStore);
    checkForNameCollision(accessors, takenNamesMap);
    checkIfUninstalledEarlier(accessors, unsetKeys);
    checkForOverrides(url, accessors, takenAccessors, existingLibraries);
    if (accessors.length === 0)
      return { status: false, defs, accessor: accessors };

    //Reserves accessor names.
    const name = accessors[accessors.length - 1];

    defs["!name"] = `LIB/${name}`;
    try {
      for (const key of accessors) {
        //@ts-expect-error no types
        defs[key] = makeTernDefs(self[key]);
      }
    } catch (e) {
      for (const acc of accessors) {
        //@ts-expect-error no types
        self[acc] = undefined;
      }
      throw new TernDefinitionError(
        `Failed to generate autocomplete definitions: ${name}`,
      );
    }

    //Reserve accessor names.
    for (const acc of accessors) {
      //we have to update invalidEntityIdentifiers as well
      libraryReservedIdentifiers[acc] = true;
      invalidEntityIdentifiers[acc] = true;
    }

    return { success: true, defs, accessor: accessors };
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
      //we have to update invalidEntityIdentifiers as well
      delete libraryReservedIdentifiers[key];
      delete invalidEntityIdentifiers[key];
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function loadLibraries(request: EvalWorkerASyncRequest) {
  resetJSLibraries();
  //Add types
  const { data: libs } = request;
  let message = "";

  try {
    for (const lib of libs) {
      const url = lib.url;
      const accessor = lib.accessor;
      const keysBefore = Object.keys(self);
      let module = null;
      try {
        self.importScripts(url);
      } catch (e) {
        message = (e as Error).message;
        try {
          module = await import(/* webpackIgnore: true */ url);
        } catch (e) {
          message = (e as Error).message;
        }
      }
      const keysAfter = Object.keys(self);
      const newKeys = difference(keysAfter, keysBefore);
      if (newKeys.length === 0 && module && typeof module === "object") {
        self[accessor[0]] = flattenModule(module);
        newKeys.push(accessor[0]);
      }
      for (const key of newKeys) {
        //we have to update invalidEntityIdentifiers as well
        libraryReservedIdentifiers[key] = true;
        invalidEntityIdentifiers[key] = true;
      }
    }
    JSLibraries.push(...libs);
    return { success: true, message };
  } catch (e) {
    message = (e as Error).message;
    return { success: false, message };
  }
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

/**
 * This function is called only for ESM modules and generates a unique namespace for the module.
 * @param url
 * @param takenAccessors
 * @param takenNamesMap
 * @returns
 */
function generateUniqueAccessor(
  url: string,
  takenAccessors: Array<string>,
  takenNamesMap: Record<string, true>,
) {
  // extract file name from url
  const urlObject = new URL(url);
  // URL pattern for ESM modules from jsDelivr - https://cdn.jsdelivr.net/npm/stripe@13.3.0/+esm
  // Assuming the file name is the last part of the path
  const urlPathParts = urlObject.pathname.split("/");
  let fileName = urlPathParts.pop();
  fileName = fileName?.includes("esm") ? urlPathParts.pop() : fileName;

  // This should never happen. This is just to avoid the typescript error.
  if (!fileName) throw new Error("Unable to generate a unique accessor");
  // Replace all non-alphabetic characters with underscores and remove trailing underscores
  const validVar = fileName.replace(/[^a-zA-Z]/g, "_").replace(/_+$/, "");
  if (
    !takenAccessors.includes(validVar) &&
    !takenNamesMap.hasOwnProperty(validVar)
  ) {
    return validVar;
  }
  const index = 1;
  while (true && index < 100) {
    const name = `Library_${index}`;
    if (!takenAccessors.includes(name) && !takenNamesMap.hasOwnProperty(name)) {
      return name;
    }
  }
  throw new Error("Unable to generate a unique accessor");
}

function flattenModule(module: Record<string, any>) {
  const keys = Object.keys(module);
  // If there are no keys other than default, return default.
  if (keys.length === 1 && keys[0] === "default") return module.default;
  // If there are keys other than default, return a new object with all the keys
  // and set its prototype of default export.
  const libModule = Object.create(module.default);
  for (const key of Object.keys(module)) {
    if (key === "default") continue;
    libModule[key] = module[key];
  }
  return libModule;
}
