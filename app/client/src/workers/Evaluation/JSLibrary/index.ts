import {
  defaultLibraries,
  JSLibraries,
  libraryReservedNames,
} from "utils/DynamicBindingUtils";

export function resetJSLibraries() {
  JSLibraries.length = 0;
  JSLibraries.push(...defaultLibraries);
  libraryReservedNames.length = 0;
  libraryReservedNames.push(...defaultLibraries.map((lib) => lib.name));
}
