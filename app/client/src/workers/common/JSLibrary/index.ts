import _, { VERSION as lodashVersion } from "lodash";
import moment from "moment-timezone";
import parser from "fast-xml-parser";
import forge from "node-forge";

export type TJSLibrary = {
  version?: string;
  docsURL: string;
  name: string;
  accessor: string[];
  lib?: any;
  url?: string;
};
export const defaultLibraries: TJSLibrary[] = [
  {
    accessor: ["_"],
    lib: _,
    version: lodashVersion,
    docsURL: `https://lodash.com/docs/${lodashVersion}`,
    name: "lodash",
  },
  {
    accessor: ["moment"],
    lib: moment,
    version: moment.version,
    docsURL: `https://momentjs.com/docs/`,
    name: "moment",
  },
  {
    accessor: ["xmlParser"],
    lib: parser,
    version: "3.17.5",
    docsURL: "https://github.com/NaturalIntelligence/fast-xml-parser",
    name: "xmlParser",
  },
  {
    accessor: ["forge"],
    // We are removing some functionalities of node-forge because they wont
    // work in the worker thread
    lib: _.omit(forge, ["tls", "http", "xhr", "socket", "task"]),
    version: "1.3.0",
    docsURL: "https://github.com/digitalbazaar/forge",
    name: "forge",
  },
];

export const JSLibraries = [...defaultLibraries];
export const libraryReservedNames = new Set(
  ...defaultLibraries.map((lib) => lib.accessor[0]),
);
/**
 * creates dynamic list of constants based on
 * current list of extra libraries i.e lodash("_"), moment etc
 * to be used in widget and entity name validations
 */
export const defaultLibraryNames = defaultLibraries.reduce(
  (prev: Record<string, string>, curr) => {
    prev[curr.accessor[0]] = curr.accessor[0];
    return prev;
  },
  {},
);

export function resetJSLibraries() {
  JSLibraries.length = 0;
  JSLibraries.push(...defaultLibraries);
  const defaultLibraryAccessors = defaultLibraries.map(
    (lib) => lib.accessor[0],
  );
  for (const key of libraryReservedNames) {
    if (!defaultLibraryAccessors.includes(key)) {
      try {
        // @ts-expect-error: Types are not available
        delete self[key];
      } catch (e) {
        // @ts-expect-error: Types are not available
        self[key] = undefined;
      }
      libraryReservedNames.delete(key);
    }
  }
  return JSLibraries;
}
