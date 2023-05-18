import { installLibrary, uninstallLibrary } from "../jsLibrary";
import { EVAL_WORKER_SYNC_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import * as mod from "../../../common/JSLibrary/ternDefinitionGenerator";

jest.mock("../../../common/JSLibrary/ternDefinitionGenerator");

describe("Tests to assert install/uninstall flows", function () {
  beforeAll(() => {
    self.importScripts = jest.fn(() => {
      //@ts-expect-error importScripts is not defined in the test environment
      self.lodash = {};
    });

    const mockTernDefsGenerator = jest.fn(() => ({}));

    jest.mock("../../../common/JSLibrary/ternDefinitionGenerator.ts", () => {
      return {
        makeTernDefs: mockTernDefsGenerator,
      };
    });
  });

  it("should install a library", function () {
    const res = installLibrary({
      data: {
        url: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
        takenAccessors: [],
        takenNamesMap: {},
      },
      method: EVAL_WORKER_SYNC_ACTION.INSTALL_LIBRARY,
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

  it("Reinstalling a different version of the same installed library should fail", function () {
    const res = installLibrary({
      data: {
        url: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.0/lodash.min.js",
        takenAccessors: ["lodash"],
        takenNamesMap: {},
      },
      method: EVAL_WORKER_SYNC_ACTION.INSTALL_LIBRARY,
    });
    expect(res).toEqual({
      success: false,
      defs: {},
      error: expect.any(Error),
    });
  });

  it("Detects name space collision where there is another entity(api, widget or query) with the same name", function () {
    //@ts-expect-error ignore
    delete self.lodash;
    const res = installLibrary({
      data: {
        url: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.0/lodash.min.js",
        takenAccessors: [],
        takenNamesMap: { lodash: true },
      },
      method: EVAL_WORKER_SYNC_ACTION.INSTALL_LIBRARY,
    });
    expect(res).toEqual({
      success: false,
      defs: {},
      error: expect.any(Error),
    });
  });

  it("Removes or set the accessors to undefined on the global object on uninstallation", function () {
    //@ts-expect-error ignore
    self.lodash = {};
    const res = uninstallLibrary({
      data: ["lodash"],
      method: EVAL_WORKER_SYNC_ACTION.UNINSTALL_LIBRARY,
    });
    expect(res).toEqual({ success: true });
    //@ts-expect-error ignore
    expect(self.lodash).toBeUndefined();
  });
});
