import _ from "./lodash-wrapper";
import moment from "moment-timezone";
import forge from "node-forge";
import { defaultLibraries, JSLibraryAccessor } from "./index";
import { JSLibraries, libraryReservedIdentifiers } from "./index";
import { invalidEntityIdentifiers } from "../DependencyMap/utils";
import { objectKeys } from "@appsmith/utils";
const defaultLibImplementations = {
  lodash: _,
  moment: moment,
  // We are removing some functionalities of node-forge because they wont
  // work in the worker thread
  forge: /*#__PURE*/ _.omit(forge, ["tls", "http", "xhr", "socket", "task"]),
};

export function resetJSLibraries() {
  JSLibraries.length = 0;
  JSLibraries.push(...defaultLibraries);
  const defaultLibraryAccessors = defaultLibraries.map(
    (lib) => lib.accessor[0],
  );

  for (const key of objectKeys(libraryReservedIdentifiers)) {
    if (defaultLibraryAccessors.includes(String(key))) continue;

    try {
      // @ts-expect-error: Types are not available
      delete self[String(key)];
    } catch (e) {
      // @ts-expect-error: Types are not available
      self[String(key)] = undefined;
    }
    //we have to update invalidEntityIdentifiers as well
    delete libraryReservedIdentifiers[key];
    delete invalidEntityIdentifiers[key];
  }

  JSLibraries.forEach((library) => {
    if (!(library.name in defaultLibImplementations))
      throw new Error(
        `resetJSLibraries(): implementation for library ${library.name} not found. Have you forgotten to add it to the defaultLibrariesImpls object?`,
      );

    // @ts-expect-error: Types are not available
    self[library.accessor] = defaultLibImplementations[library.name];
  });
  JSLibraryAccessor.regenerateSet();
}
