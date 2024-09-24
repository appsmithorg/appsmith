import { flattenModule, installLibrary, uninstallLibrary } from "../jsLibrary";
import {
  EVAL_WORKER_ASYNC_ACTION,
  EVAL_WORKER_SYNC_ACTION,
} from "ee/workers/Evaluation/evalWorkerActions";
import * as mod from "../../../common/JSLibrary/ternDefinitionGenerator";

jest.mock("../../../common/JSLibrary/ternDefinitionGenerator");

declare const self: WorkerGlobalScope;

describe("Tests to assert install/uninstall flows", function () {
  beforeAll(() => {
    self.importScripts = jest.fn(() => {
      self.lodash = {};
    });

    self.import = jest.fn();

    const mockTernDefsGenerator = jest.fn(() => ({}));

    jest.mock("../../../common/JSLibrary/ternDefinitionGenerator.ts", () => {
      return {
        makeTernDefs: mockTernDefsGenerator,
      };
    });
  });

  it("should install a library", async function () {
    const res = await installLibrary({
      data: {
        url: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
        takenAccessors: [],
        takenNamesMap: {},
      },
      method: EVAL_WORKER_ASYNC_ACTION.INSTALL_LIBRARY,
      webworkerTelemetry: {},
    });

    //
    expect(self.importScripts).toHaveBeenCalled();
    expect(mod.makeTernDefs).toHaveBeenCalledWith({});

    expect(res).toEqual({
      success: true,
      defs: {
        "!name": "LIB/lodash",
        lodash: undefined,
      },
      accessor: ["lodash"],
    });
  });

  it("Reinstalling a different version of the same installed library should create a new accessor", async function () {
    const res = await installLibrary({
      data: {
        url: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.0/lodash.min.js",
        takenAccessors: ["lodash"],
        takenNamesMap: {},
      },
      method: EVAL_WORKER_ASYNC_ACTION.INSTALL_LIBRARY,
      webworkerTelemetry: {},
    });

    expect(res).toEqual({
      success: true,
      defs: {
        "!name": "LIB/lodash_1",
        lodash_1: undefined,
      },
      accessor: ["lodash_1"],
    });
  });

  it("Detects name space collision where there is another entity(api, widget or query) with the same name and creates a unique accessor", async function () {
    delete self["lodash"];
    const res = await installLibrary({
      data: {
        url: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.0/lodash.min.js",
        takenAccessors: ["lodash_1"],
        takenNamesMap: { lodash: true },
      },
      method: EVAL_WORKER_ASYNC_ACTION.INSTALL_LIBRARY,
      webworkerTelemetry: {},
    });

    expect(res).toEqual({
      success: true,
      defs: {
        "!name": "LIB/lodash_2",
        lodash_2: undefined,
      },
      accessor: ["lodash_2"],
    });
    delete self["lodash_2"];
  });

  it("Removes or set the accessors to undefined on the global object on un-installation", async function () {
    self.lodash = {};
    const res = await uninstallLibrary({
      data: ["lodash"],
      method: EVAL_WORKER_SYNC_ACTION.UNINSTALL_LIBRARY,
      webworkerTelemetry: {},
    });

    expect(res).toEqual({ success: true });
    expect(self.lodash).toBeUndefined();
  });

  it("Test flatten of ESM module", () => {
    /** ESM with default and named exports */
    const library = {
      default: {
        method: "Hello",
      },
      method: "Hello",
    };

    const flatLibrary1 = flattenModule(library);

    expect(flatLibrary1).toEqual({
      method: "Hello",
    });

    expect(Object.getPrototypeOf(flatLibrary1)).toEqual({
      method: "Hello",
    });

    /** ESM with named exports only */
    const library2 = {
      method: "Hello",
    };

    const flatLibrary2 = flattenModule(library2);

    expect(flatLibrary2).toEqual({
      method: "Hello",
    });

    /** ESM with default export only */
    const library3 = {
      default: {
        method: "Hello",
      },
    };

    const flatLibrary3 = flattenModule(library3);

    expect(flatLibrary3).toEqual({
      method: "Hello",
    });
  });
});
