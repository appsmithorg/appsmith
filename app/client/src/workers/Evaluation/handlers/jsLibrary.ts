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

// class NameCollisionError extends Error {
//   code = LibraryInstallError.NameCollisionError;
//   constructor(accessors: string) {
//     super(
//       createMessage(customJSLibraryMessages.NAME_COLLISION_ERROR, accessors),
//     );
//     this.name = "NameCollisionError";
//   }
// }

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

// class LibraryOverrideError extends Error {
//   code = LibraryInstallError.LibraryOverrideError;
//   data: any;
//   constructor(name: string, data: any) {
//     super(createMessage(customJSLibraryMessages.LIB_OVERRIDE_ERROR, name));
//     this.name = "LibraryOverrideError";
//     this.data = data;
//   }
// }

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

export const MARK_LIBRARY_AS_UNINSTALLED = Symbol.for(
  "MARK_LIBRARY_AS_UNINSTALLED",
);

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
  const tempLibStore = takenAccessors.reduce(
    (acc: Record<string, unknown>, a: string) => {
      //@ts-expect-error no types
      acc[a] = self[a];
      return acc;
    },
    {},
  );

  try {
    const envKeysBeforeInstallation = Object.keys(self);

    const unsetKeys = envKeysBeforeInstallation.filter(
      //@ts-expect-error no types
      (k) => self[k] === MARK_LIBRARY_AS_UNINSTALLED,
    );

    const existingLibraries: Record<string, any> = {};
    for (const acc of takenAccessors) {
      existingLibraries[acc] = self[acc];
    }

    const accessors = [];

    let module = null;
    try {
      self.importScripts(url);
      // Find keys add that were installed to the global scope.
      accessors.push(
        ...Object.keys(self)
          .filter((k) => {
            if (unsetKeys.includes(k)) {
              // @ts-expect-error no types
              return self[k] !== MARK_LIBRARY_AS_UNINSTALLED;
            }
            return envKeysBeforeInstallation.includes(k);
          })
          .map((k) => ({ original: k, modified: k })),
      );
    } catch (e) {
      try {
        module = await import(/* webpackIgnore: true */ url);
        if (module && typeof module === "object") {
          const uniqAccessor = generateUniqueAccessor(
            url,
            takenAccessors,
            takenNamesMap,
          );
          // @ts-expect-error no types
          self[uniqAccessor] = flattenModule(module);
          accessors.push({ original: uniqAccessor, modified: uniqAccessor });
        }
      } catch (e) {
        throw new ImportError(url);
      }
    }

    // If no keys were added to the global scope, check if the module is a ESM module.
    if (accessors.length === 0)
      return { status: false, defs, accessor: accessors };

    const collidingNames = accessors.map(
      (k) =>
        takenNamesMap.hasOwnProperty(k.modified) ||
        takenAccessors.includes(k.modified),
    );

    for (const cn of collidingNames) {
      const newName = generateUniqueAccessor(
        cn.modified,
        takenAccessors,
        takenNamesMap,
      );
      cn.modified = newName;
      //@ts-expect-error no types
      self[newName] = self[cn];
    }

    addTempStoredDataTreeToContext(tempDataTreeStore);
    //@ts-expect-error no types
    Object.keys(tempLibStore).forEach((k) => (self[k] = tempLibStore[k]));

    if (accessors.length === 0)
      return { status: false, defs, accessor: accessors };

    //Reserves accessor names.
    const name = accessors[accessors.length - 1]?.modified;

    defs["!name"] = `LIB/${name}`;
    try {
      for (const key of accessors) {
        //@ts-expect-error no types
        defs[key.modified] = makeTernDefs(self[key?.modified]);
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
      libraryReservedIdentifiers[acc.modified] = true;
      invalidEntityIdentifiers[acc.modified] = true;
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
        try {
          module = await import(/* webpackIgnore: true */ url);
        } catch (e) {
          message = (e as Error).message;
        }
      }

      if (module && typeof module === "object") {
        const key = accessor[0].modified;
        self[key] = flattenModule(module);
        libraryReservedIdentifiers[key] = true;
        invalidEntityIdentifiers[key] = true;
      } else {
        const keysAfter = Object.keys(self);
        const newKeys = difference(keysAfter, keysBefore);
        for (const key of newKeys) {
          const modifiedKey =
            accessor.find((a: any) => a.original === key)?.modified || key;
          //@ts-expect-error no types
          self[modifiedKey] = self[key];
          try {
            //@ts-expect-error no types
            delete self[key];
          } catch (e) {
            //@ts-expect-error no types
            self[key] = undefined;
          }
          libraryReservedIdentifiers[modifiedKey] = true;
          invalidEntityIdentifiers[modifiedKey] = true;
        }
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
  let fileName = urlOrName;
  // extract file name from url
  try {
    // Checks to see if a URL was passed
    const urlObject = new URL(urlOrName);
    // URL pattern for ESM modules from jsDelivr - https://cdn.jsdelivr.net/npm/stripe@13.3.0/+esm
    // Assuming the file name is the last part of the path
    const urlPathParts = urlObject.pathname.split("/");
    fileName = urlPathParts.pop() as string;
    fileName = fileName?.includes("esm")
      ? (urlPathParts.pop() as string)
      : fileName;
  } catch (e) {}

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
