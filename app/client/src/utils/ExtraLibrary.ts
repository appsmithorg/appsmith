import _, { VERSION as lodashVersion } from "lodash";
import moment from "moment-timezone";
import forge from "node-forge";
import parser from "fast-xml-parser";

export type ExtraLibrary = {
  version: string;
  docsURL: string;
  name: string;
  description?: string;
  accessor: string;
  lib: any;
};

class ExtraLibraryClass {
  private static instance: ExtraLibraryClass;
  private libraries: ExtraLibrary[];

  private constructor(libraries: ExtraLibrary[]) {
    this.libraries = libraries;
  }

  public static getInstance(): ExtraLibraryClass {
    if (!ExtraLibraryClass.instance) {
      ExtraLibraryClass.instance = new ExtraLibraryClass(defaultLibraries);
    }
    return ExtraLibraryClass.instance;
  }

  addLibrary(library: ExtraLibrary) {
    this.libraries.push(library);
  }
  removeLibrary(library: ExtraLibrary) {
    this.libraries.push(library);
  }
  getLibraries() {
    return this.libraries;
  }
}

export const defaultLibraries: ExtraLibrary[] = [
  {
    accessor: "_",
    lib: _,
    version: lodashVersion,
    docsURL: `https://lodash.com/docs/${lodashVersion}`,
    name: "lodash",
    description:
      "A utility library delivering consistency, customization, performance, & extras.",
  },
  {
    accessor: "moment",
    lib: moment,
    version: moment.version,
    docsURL: `https://momentjs.com/docs/`,
    name: "moment",
    description: "Parse, validate, manipulate, and display dates",
  },
  {
    accessor: "xmlParser",
    lib: parser,
    version: "3.17.5",
    docsURL: "https://github.com/NaturalIntelligence/fast-xml-parser",
    name: "xmlParser",
    description: "Parse XML to JS/JSON very fast without C/C++ based libraries",
  },
  {
    accessor: "forge",
    // We are removing some functionalities of node-forge because they wont
    // work in the worker thread
    lib: _.omit(forge, ["tls", "http", "xhr", "socket", "task"]),
    version: "0.10.0",
    docsURL: "https://github.com/digitalbazaar/forge",
    name: "forge",
    description:
      "JavaScript implementations of network transports, cryptography, ciphers, PKI, message digests, and various utilities.",
  },
];

export default ExtraLibraryClass;
