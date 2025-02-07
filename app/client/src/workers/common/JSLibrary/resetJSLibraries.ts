import _ from "./lodash-wrapper";
import { formatInTimeZone } from "date-fns-tz";
import forge from "node-forge";
import { defaultLibraries, JSLibraryAccessor } from "./index";
import { JSLibraries, libraryReservedIdentifiers } from "./index";
import { invalidEntityIdentifiers } from "../DependencyMap/utils";
import { objectKeys } from "@appsmith/utils";
const defaultLibImplementations = {
  lodash: _,
  moment: {
    zonedTimeToUtc: (date: string, timeZone: string) =>
      formatInTimeZone(new Date(date), timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    utcToZonedTime: (date: string, timeZone: string) =>
      formatInTimeZone(new Date(date), timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    tz: (date: string, timeZone: string) =>
      formatInTimeZone(new Date(date), timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    format: (date: string, format: string) =>
      formatInTimeZone(new Date(date), "UTC", format),
  },
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
    if (defaultLibraryAccessors.includes(key)) continue;

    try {
      delete (self as unknown as Record<string, unknown>)[key];
    } catch (e) {
      (self as unknown as Record<string, unknown>)[key] = undefined;
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
