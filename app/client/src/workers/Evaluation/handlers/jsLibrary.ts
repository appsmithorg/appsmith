import { difference } from "lodash";
import type { Def } from "tern";
import { invalidEntityIdentifiers } from "workers/common/DependencyMap/utils";
import {
  JSLibraries,
  JSLibraryAccessor,
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    super(`The script at ${url} cannot be installed.`);
    this.name = "ImportError";
  }
}

class TernDefinitionError extends Error {
  code = LibraryInstallError.TernDefinitionError;
  constructor(name: string) {
    super(`Failed to generate autocomplete definitions for ${name}.`);
    this.name = "TernDefinitionError";
  }
}

const removeDataTreeFromContext = () => {
  if (!dataTreeEvaluator) return {};

  const evalTree = dataTreeEvaluator?.getEvalTree();
  const dataTreeEntityNames = Object.keys(evalTree);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tempDataTreeStore: Record<string, any> = {};

  for (const entityName of dataTreeEntityNames) {
    tempDataTreeStore[entityName] = self[entityName];
    delete self[entityName];
  }

  return tempDataTreeStore;
};

function addTempStoredDataTreeToContext(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      /**
       * Try to import the library using importScripts
       * This works for UMD modules
       * If this fails, we try to import the library using dynamic import
       */
      self.importScripts(url);

      // Find keys add that were installed to the global scope.
      const keysAfterInstallation = Object.keys(self);

      let differentiatingKeys = difference(
        keysAfterInstallation,
        envKeysBeforeInstallation,
      );

      // Changing default export to library specific name, if default exported
      const uniqueName = generateUniqueAccessor(
        url,
        takenAccessors,
        takenNamesMap,
      );

      movetheDefaultExportedLibraryToAccessorKey(
        differentiatingKeys,
        uniqueName,
      );

      // Following the same process which was happening earlier
      const keysAfterDefaultOperation = Object.keys(self);

      differentiatingKeys = difference(
        keysAfterDefaultOperation,
        envKeysBeforeInstallation,
      );
      accessors.push(...differentiatingKeys);

      /**
       * Check the list of installed library to see if their values have changed.
       * This is to check if the newly installed library overwrites an already existing one
       * For eg. let's say lodash v1 and v2 both have the same accessor `_`.
       * If lodash v1 is installed first, `_` will be added to the global scope.
       * This value is stored in libStore. ie libStore['_'] = lodash v1
       * Now when lodash v2 is installed, `_` will be added to the global scope again.
       * We check if the value of `_` has changed to detect this. ie . libStore['_'] !== lodash v2
       * If it has changed, we add the new value to the global scope with a unique name.
       * */
      accessors.push(
        ...Object.keys(libStore).filter((k) => {
          return libStore[k] !== self[k];
        }),
      );

      /**
       * Certain libraries are added to the global scope with { configurable: false }
       * These libraries cannot be removed from the global scope via delete operation so we set them to undefined them during uninstall request.
       * These library accessors are removed from takenAccessors list.
       * So they will remain in the global scope even after uninstallation. self[accessor] = undefined.
       * Any attempt to reinstall the same library will overwrite the library with undefined and we need to detect these accessors.
       */
      accessors.push(...unsetLibraryKeys.filter((k) => self[k] !== undefined));

      // Generate unique names for accessors that are already taken.
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
        // If importScripts fails, try to import the library using dynamic import
        module = await import(/* webpackIgnore: true */ url);

        // If the module is not an object, it is not a valid ESM library
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

    // Name of the library is the last accessor. This is totally random and needs fixing.
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

    // Restore the libraries from libStore to the global scope.
    // This is done to ensure that the libraries are not overwritten by the newly installed library.
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
        let defaultAccessors = difference(keysAfter, keysBefore);

        // Changing default export to library accessors name which was saved when it was installed, if default export present
        movetheDefaultExportedLibraryToAccessorKey(
          defaultAccessors,
          accessors[0],
        );

        // Following the same process which was happening earlier
        const keysAfterDefaultOperation = Object.keys(self);

        defaultAccessors = difference(keysAfterDefaultOperation, keysBefore);

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

        /**
         * Sort the accessor list from backend and installed accessor list using the same rule to apply all modifications.
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
    JSLibraryAccessor.regenerateSet();

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
    /**
     * URL pattern for ESM modules from jsDelivr - https://cdn.jsdelivr.net/npm/stripe@13.3.0/+esm
     * Assuming the file name is the last part of the path
     * TODO: Find a better way to extract the file name from the URL
     * TODO: Handle the case where the URL is from a different CDN like unpkg, cdnjs etc.
     */
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

  /**
   * If the accessor is already taken, generate a unique name by appending an index to the accessor.
   * The index is incremented until a unique name is found.
   * 100 is a very large number and this loop should never run more than a few times.
   */
  while (index++ < 100) {
    const name = `${validVar}_${index}`;

    if (!takenAccessors.includes(name) && !takenNamesMap.hasOwnProperty(name)) {
      return name;
    }
  }

  throw new Error("Unable to generate a unique accessor");
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// This function will update the self keys only when the diffAccessors has default included in it.
function movetheDefaultExportedLibraryToAccessorKey(
  diffAccessors: string[],
  uniqAccessor: string,
) {
  if (diffAccessors.length > 0 && diffAccessors.includes("default")) {
    // mapping default functionality to library name accessor
    self[uniqAccessor] = self["default"];
    // deleting the reference of default key from the self object
    delete self["default"];
    // mapping all the references of differentiating keys from the self object to the self[uniqAccessor] key object
    diffAccessors.map((key) => {
      if (key !== "default") {
        self[uniqAccessor][key] = self[key];
        // deleting the references from the self object
        delete self[key];
      }
    });
  }
}
