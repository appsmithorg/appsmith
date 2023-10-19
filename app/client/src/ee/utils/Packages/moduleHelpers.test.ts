import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { convertModulesToArray, selectAllQueryModules } from "./moduleHelpers"; // Import the functions to be tested

// Mock data for testing
const modules = {
  1: {
    id: "mod-1",
    type: MODULE_TYPE.QUERY,
    name: "module 1",
    publicEntityId: "",
    packageId: "pkg-1",
    inputs: {},
    whitelistedPublicEntitySettingsForModule: [],
    whitelistedPublicEntitySettingsForModuleInstance: [],
    userPermissions: [],
  },
  2: {
    id: "mod-2",
    type: MODULE_TYPE.UI,
    name: "module 2",
    publicEntityId: "",
    packageId: "pkg-1",
    inputs: {},
    whitelistedPublicEntitySettingsForModule: [],
    whitelistedPublicEntitySettingsForModuleInstance: [],
    userPermissions: [],
  },
  3: {
    id: "mod-3",
    type: MODULE_TYPE.QUERY,
    name: "module 3",
    publicEntityId: "",
    packageId: "pkg-1",
    inputs: {},
    whitelistedPublicEntitySettingsForModule: [],
    whitelistedPublicEntitySettingsForModuleInstance: [],
    userPermissions: [],
  },
};

const moduleArray = Object.values(modules);

describe("convertModulesToArray", () => {
  it("should convert modules object to an array", () => {
    const result = convertModulesToArray(modules);

    // Perform assertions using @testing-library/react
    expect(result).toEqual(moduleArray);
  });
});

describe("selectAllQueryModules", () => {
  it("should select only modules of type MODULE_TYPE.QUERY", () => {
    const queryModules = selectAllQueryModules(moduleArray);

    // Perform assertions using @testing-library/react
    expect(queryModules).toHaveLength(2); // There are two MODULE_TYPE.QUERY modules
    expect(queryModules[0]).toHaveProperty("type", MODULE_TYPE.QUERY);
    expect(queryModules[1]).toHaveProperty("type", MODULE_TYPE.QUERY);
  });
});
