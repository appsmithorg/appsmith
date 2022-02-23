import {
  groupAndFilterDependantsMap,
  getEntityDependants,
} from "sagas/WidgetLoadingSaga";

describe("Widget loading state utils", () => {
  describe("groupAndFilterDependantsMap", () => {
    it("groups entites and filters self-dependencies", () => {
      const entitiesDependantsMap = groupAndFilterDependantsMap({
        "Query1.config": ["Query1"],
        "Query1.config.body": ["Query1.config"],
        "Query1.data": ["JS_file.func1", "Query1"], // dependant
        "Query2.config": ["Query2"],
        "Query2.config.body": ["Query2.config"],
        "Query2.run": ["Query2", "JS_file.func2"], // dependant
        "Query3.config": ["Query3"],
        "Query3.config.body": ["Query3.config"],
      });
      expect(entitiesDependantsMap).toStrictEqual({
        Query1: { "Query1.data": ["JS_file.func1"] },
        Query2: { "Query2.run": ["JS_file.func2"] },
      });
    });
  });

  describe("getEntityDependants", () => {
    it("handles simple dependency", () => {
      const dependants = getEntityDependants(
        ["Query1"],
        {
          Query1: {
            "Query1.data": ["JS_file.func1"],
            "Query1.run": ["JS_file.func2"],
          },
          JS_file: {
            "JS_file.func1": ["Select1.options"],
            "JS_file.func2": ["Select2.options"],
          },
        },
        new Set<string>(),
      );
      expect(dependants).toStrictEqual({
        names: new Set(["JS_file", "Select1", "Select2"]),
        fullPaths: new Set([
          "JS_file.func1",
          "Select1.options",
          "JS_file.func2",
          "Select2.options",
        ]),
      });
    });
  });
});
