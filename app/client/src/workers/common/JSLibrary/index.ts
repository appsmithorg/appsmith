import lodashPackageJson from "lodash/package.json";
import momentPackageJson from "moment-timezone/package.json";

export interface JSLibrary {
  version?: string;
  docsURL: string;
  name: string;
  accessor: string[];
  url?: string;
  id?: string;
}

export const defaultLibraries: JSLibrary[] = [
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
    accessor: ["forge"],
    version: "1.3.0",
    docsURL: "https://github.com/digitalbazaar/forge",
    name: "forge",
  },
];

export const JSLibraries = [...defaultLibraries];

const JSLibraryAccessorModifier = () => {
  let jsLibraryAccessorSet = new Set(
    JSLibraries.flatMap((lib) => lib.accessor),
  );

  return {
    regenerateSet: () => {
      jsLibraryAccessorSet = new Set(
        JSLibraries.flatMap((lib) => lib.accessor),
      );

      return;
    },
    getSet: () => {
      return jsLibraryAccessorSet;
    },
  };
};

export const JSLibraryAccessor = JSLibraryAccessorModifier();

export const libraryReservedIdentifiers = defaultLibraries.reduce(
  (acc, lib) => {
    lib.accessor.forEach((a) => (acc[a] = true));

    return acc;
  },
  {} as Record<string, boolean>,
);
