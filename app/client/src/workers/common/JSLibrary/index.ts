import lodashPackageJson from "lodash/package.json";
import momentPackageJson from "moment-timezone/package.json";

export type TJSLibrary = {
  version?: string;
  docsURL: string;
  name: string;
  accessor: Array<{ original: string; modified: string }>;
  url?: string;
};

export const defaultLibraries: TJSLibrary[] = [
  {
    accessor: [{ original: "_", modified: "_" }],
    version: lodashPackageJson.version,
    docsURL: `https://lodash.com/docs/${lodashPackageJson.version}`,
    name: "lodash",
  },
  {
    accessor: [{ original: "moment", modified: "moment" }],
    version: momentPackageJson.version,
    docsURL: `https://momentjs.com/docs/`,
    name: "moment",
  },
  {
    accessor: [{ original: "forge", modified: "forge" }],
    version: "1.3.0",
    docsURL: "https://github.com/digitalbazaar/forge",
    name: "forge",
  },
];

export const JSLibraries = [...defaultLibraries];
export const libraryReservedIdentifiers = defaultLibraries.reduce(
  (acc, lib) => {
    lib.accessor.forEach((a) => (acc[a.modified] = true));
    return acc;
  },
  {} as Record<string, boolean>,
);
