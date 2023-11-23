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
import type { JSLibrary } from "../../common/JSLibrary";
import { resetJSLibraries } from "../../common/JSLibrary/resetJSLibraries";
import { makeTernDefs } from "../../common/JSLibrary/ternDefinitionGenerator";
import type { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";
import log from "loglevel";

declare global {
  interface WorkerGlobalScope {
    [x: string]: any;
  }
}

declare const self: WorkerGlobalScope;

enum LibraryInstallError {
  NameCollisionError,
  ImportError,
  TernDefinitionError,
  LibraryOverrideError,
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

const removeDataTreeFromContext = () => {
  if (!dataTreeEvaluator) return {};
  const evalTree = dataTreeEvaluator?.getEvalTree();
  const dataTreeEntityNames = Object.keys(evalTree);
  const tempDataTreeStore: Record<string, any> = {};
  for (const entityName of dataTreeEntityNames) {
    tempDataTreeStore[entityName] = self[entityName];
    delete self[entityName];
  }
  return tempDataTreeStore;
};

function addTempStoredDataTreeToContext(
  tempDataTreeStore: Record<string, any>,
) {
  const dataTreeEntityNames = Object.keys(tempDataTreeStore);
  for (const entityName of dataTreeEntityNames) {
    self[entityName] = tempDataTreeStore[entityName];
  }
}

export async function installLibrary(
  request: EvalWorkerASyncRequest<{
    url: string;
    takenNamesMap: Record<string, true>;
    takenAccessors: Array<string>;
  }>,
) {
  const { data } = request;
  const { takenAccessors, takenNamesMap, url } = data;
  const defs: Def = {};
  /**
   * We need to remove the data tree from the global scope before importing the library.
   * This is because the library might have a variable with the same name as a data tree entity. If that happens, the data tree entity will be overridden by the library variable.
   * We store the data tree in a temporary variable and add it back to the global scope after the library is imported.
   */
  const tempDataTreeStore = removeDataTreeFromContext();

  // Map of all the currently installed libraries
  const libStore = takenAccessors.reduce(
    (acc: Record<string, unknown>, a: string) => {
      acc[a] = self[a];
      return acc;
    },
    {},
  );

  try {
    const envKeysBeforeInstallation = Object.keys(self);

    /** Holds keys of uninstalled libraries that cannot be removed from worker global.
     * Certain libraries are added to the global scope with { configurable: false }
     */
    const unsetLibraryKeys = envKeysBeforeInstallation.filter(
      (k) => self[k] === undefined,
    );

    const accessors: string[] = [];

    let module = null;
    try {
      self.importScripts(url);
      // Find keys add that were installed to the global scope.
      const keysAfterInstallation = Object.keys(self);
      accessors.push(
        ...difference(keysAfterInstallation, envKeysBeforeInstallation),
      );

      // Check the list of installed library to see if their values have changed.
      // This is to check if the newly installed library overwrites an already existing
      accessors.push(
        ...Object.keys(libStore).filter((k) => {
          return libStore[k] !== self[k];
        }),
      );

      accessors.push(...unsetLibraryKeys.filter((k) => self[k] !== undefined));

      for (let i = 0; i < accessors.length; i++) {
        if (
          takenNamesMap.hasOwnProperty(accessors[i]) ||
          takenAccessors.includes(accessors[i])
        ) {
          const uniqueName = generateUniqueAccessor(
            accessors[i],
            takenAccessors,
            takenNamesMap,
          );
          self[uniqueName] = self[accessors[i]];
          accessors[i] = uniqueName;
        }
      }
    } catch (e) {
      log.debug(e, `importScripts failed for ${url}`);
      try {
        module = await import(/* webpackIgnore: true */ url);
        if (module && typeof module === "object") {
          const uniqAccessor = generateUniqueAccessor(
            url,
            takenAccessors,
            takenNamesMap,
          );
          self[uniqAccessor] = flattenModule(module);
          accessors.push(uniqAccessor);
        }
      } catch (e) {
        log.debug(e, `dynamic import failed for ${url}`);
        throw new ImportError(url);
      }
    }

    // If no accessors at this point, installation likely failed.
    if (accessors.length === 0) {
      throw new Error("Unable to determine a unique accessor");
    }

    const name = accessors[accessors.length - 1];

    defs["!name"] = `LIB/${name}`;
    try {
      for (const key of accessors) {
        defs[key] = makeTernDefs(self[key]);
      }
    } catch (e) {
      for (const acc of accessors) {
        self[acc] = undefined;
      }
      log.debug(e, `ternDefinitions failed for ${url}`);
      throw new TernDefinitionError(
        `Failed to generate autocomplete definitions: ${name}`,
      );
    }

    // All the existing library and the newly installed one is added to global.
    Object.keys(libStore).forEach((k) => (self[k] = libStore[k]));

    //Reserve accessor names.
    for (const acc of accessors) {
      //we have to update invalidEntityIdentifiers as well
      libraryReservedIdentifiers[acc] = true;
      invalidEntityIdentifiers[acc] = true;
    }

    return { success: true, defs, accessor: accessors };
  } catch (error) {
    addTempStoredDataTreeToContext(tempDataTreeStore);
    takenAccessors.forEach((k) => (self[k] = libStore[k]));
    return { success: false, defs, error };
  }
}

export function uninstallLibrary(
  request: EvalWorkerSyncRequest<Array<string>>,
) {
  const { data } = request;
  const accessor = data;
  try {
    for (const key of accessor) {
      self[key] = undefined;
      //we have to update invalidEntityIdentifiers as well
      delete libraryReservedIdentifiers[key];
      delete invalidEntityIdentifiers[key];
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function loadLibraries(
  request: EvalWorkerASyncRequest<JSLibrary[]>,
) {
  resetJSLibraries();
  const { data: libs } = request;
  let message = "";
  const libStore: Record<string, unknown> = {};

  try {
    for (const lib of libs) {
      const url = lib.url as string;
      const accessors = lib.accessor;
      const keysBefore = Object.keys(self);
      let module = null;
      try {
        self.importScripts(url);
        const keysAfter = Object.keys(self);
        const defaultAccessors = difference(keysAfter, keysBefore);

        /**
         * Installing 2 different version of lodash tries to add the same accessor on the self object. Let take version a & b for example.
         * Installation of version a, will add _ to the self object and can be detected by looking at the differences in the previous step.
         * Now when version b is installed, differences will be [], since _ already exists in the self object.
         * We add all the installations to the libStore and see if the reference it points to in the self object changes.
         * If the references changes it means that it a valid accessor.
         */
        defaultAccessors.push(
          ...Object.keys(libStore).filter((k) => libStore[k] !== self[k]),
        );

        /** Sort the accessor list from backend and installed accessor list using the same rule to apply all modifications.
         * This is required only for UMD builds, since we always generate unique names for ESM.
         */
        accessors.sort();
        defaultAccessors.sort();

        for (let i = 0; i < defaultAccessors.length; i++) {
          self[accessors[i]] = self[defaultAccessors[i]];
          libStore[defaultAccessors[i]] = self[defaultAccessors[i]];
          libraryReservedIdentifiers[accessors[i]] = true;
          invalidEntityIdentifiers[accessors[i]] = true;
        }

        continue;
      } catch (e) {
        log.debug(e);
      }

      try {
        module = await import(/* webpackIgnore: true */ url);
        if (!module || typeof module !== "object") throw "Not an ESM module";
        const key = accessors[0];
        const flattenedModule = flattenModule(module);
        libStore[key] = flattenedModule;
        self[key] = flattenedModule;
        libraryReservedIdentifiers[key] = true;
        invalidEntityIdentifiers[key] = true;
      } catch (e) {
        log.debug(e);
        throw new ImportError(url);
      }
    }
    JSLibraries.push(...libs);
    return { success: true, message };
  } catch (e) {
    message = (e as Error).message;
    return { success: false, message };
  }
}

/**
 * This function is called only for ESM modules and generates a unique namespace for the module.
 * @param url
 * @param takenAccessors
 * @param takenNamesMap
 * @returns
 */
function generateUniqueAccessor(
  urlOrName: string,
  takenAccessors: Array<string>,
  takenNamesMap: Record<string, true>,
) {
  let name = urlOrName;
  // extract file name from url
  try {
    // Checks to see if a URL was passed
    const urlObject = new URL(urlOrName);
    // URL pattern for ESM modules from jsDelivr - https://cdn.jsdelivr.net/npm/stripe@13.3.0/+esm
    // Assuming the file name is the last part of the path
    const urlPathParts = urlObject.pathname.split("/");
    name = urlPathParts.pop() as string;
    name = name?.includes("+esm") ? (urlPathParts.pop() as string) : name;
  } catch (e) {}

  // Replace all non-alphabetic characters with underscores and remove trailing underscores
  const validVar = name.replace(/[^a-zA-Z]/g, "_").replace(/_+$/, "");
  if (
    !takenAccessors.includes(validVar) &&
    !takenNamesMap.hasOwnProperty(validVar)
  ) {
    return validVar;
  }
  let index = 0;
  while (index++ < 100) {
    const name = `${validVar}_${index}`;
    if (!takenAccessors.includes(name) && !takenNamesMap.hasOwnProperty(name)) {
      return name;
    }
  }
  throw new Error("Unable to generate a unique accessor");
}

export function flattenModule(module: Record<string, any>) {
  const keys = Object.keys(module);
  // If there are no keys other than default, return default.
  if (keys.length === 1 && keys[0] === "default") return module.default;
  // If there are keys other than default, return a new object with all the keys
  // and set its prototype of default export.
  const libModule = Object.create(module.default || {});
  for (const key of Object.keys(module)) {
    if (key === "default") continue;
    libModule[key] = module[key];
  }
  return libModule;
}
