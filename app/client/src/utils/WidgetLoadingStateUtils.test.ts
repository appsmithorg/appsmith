import {
  groupAndFilterDependantsMap,
  getEntityDependants,
} from "sagas/WidgetLoadingSaga";

describe("Widget loading state utils", () => {
  describe("groupAndFilterDependantsMap", () => {
    it("groups entites and filters self-dependencies", () => {
      const entitiesDependantsMap = groupAndFilterDependantsMap({
        "SelectQuery1.config": ["SelectQuery1"],
        "SelectQuery1.config.body": ["SelectQuery1.config"],
        "SelectQuery1.data": ["SelectJS.apivalues", "SelectQuery1"], // dependant
        "SelectQuery2.config": ["SelectQuery2"],
        "SelectQuery2.config.body": ["SelectQuery2.config"],
        "SelectQuery2.run": ["SelectQuery2", "SelectJS.apiValues2"], // dependant
        "SelectQuery3.config": ["SelectQuery3"],
        "SelectQuery3.config.body": ["SelectQuery3.config"],
      });
      expect(entitiesDependantsMap).toStrictEqual({
        SelectQuery1: { "SelectQuery1.data": ["SelectJS.apivalues"] },
        SelectQuery2: { "SelectQuery2.run": ["SelectJS.apiValues2"] },
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
