import lodashPackageJson from "lodash/package.json";
import momentPackageJson from "moment-timezone/package.json";

export type TJSLibrary = {
  version?: string;
  docsURL: string;
  name: string;
  accessor: string[];
  url?: string;
};

export const defaultLibraries: TJSLibrary[] = [
  {
    accessor: ["_"],
    version: lodashPackageJson.version,
    docsURL: `https://lodash.com/docs/${lodashPackageJson.version}`,
    name: "lodash",
  },
  {
    accessor: ["moment"],
    version: momentPackageJson.version,
    docsURL: `https://momentjs.com/docs/`,
    name: "moment",
  },
  {
    accessor: ["xmlParser"],
    version: "3.17.5",
    docsURL: "https://github.com/NaturalIntelligence/fast-xml-parser",
    name: "xmlParser",
  },
  {
    accessor: ["forge"],
    version: "1.3.0",
    docsURL: "https://github.com/digitalbazaar/forge",
    name: "forge",
  },
  {
    accessor: ["deep-diff"],
    version: "1.0.2",
    docsURL: "https://github.com/flitbit/diff#readme",
    name: "deep-diff",
  },
];

export const JSLibraries = [...defaultLibraries];
export const libraryReservedIdentifiers = defaultLibraries.reduce(
  (acc, lib) => {
    lib.accessor.forEach((a) => (acc[a] = true));
    return acc;
  },
  {} as Record<string, boolean>,
);
