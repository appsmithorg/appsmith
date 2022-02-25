import { PluginType } from "entities/Action";
import {
  DataTreeJSAction,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import {
  groupAndFilterDependantsMap,
  getEntityDependants,
} from "sagas/WidgetLoadingSaga";

const JS_object_dsl: DataTreeJSAction = {
  pluginType: PluginType.JS,
  name: "",
  ENTITY_TYPE: ENTITY_TYPE.JSACTION,
  body: "",
  meta: {},
  dynamicBindingPathList: [],
  bindingPaths: {},
  variables: [],
  dependencyMap: {},
};

describe("Widget loading state utils", () => {
  describe("groupAndFilterDependantsMap", () => {
    it("groups entites and filters self-dependencies", () => {
      const groupedDependantsMap = groupAndFilterDependantsMap(
        {
          "Query1.config": ["Query1"],
          "Query1.config.body": ["Query1.config"],
          "Query1.data": ["JS_file.func1", "Query1"], // dependant

          "Query2.config": ["Query2"],
          "Query2.config.body": ["Query2.config"],
          "Query2.run": ["Query2", "JS_file.func2"], // dependant

          "Query3.config": ["Query3"],
          "Query3.config.body": ["Query3.config"],

          "JS_file.func1": ["Select1.options"], // dependant
          "JS_file.func2": ["Select1.options"], // dependant

          "Select1.options": [
            "Select1.selectedOptionValue",
            "Select1.selectedOptionLabel",
            "Select1",
          ],
          "Select2.options": [
            "Select2.selectedOptionValue",
            "Select2.selectedOptionLabel",
            "Select2",
          ],
        },
        {
          JS_file: { ...JS_object_dsl, name: "JS_file" },
        },
      );
      expect(groupedDependantsMap).toStrictEqual({
        Query1: { "Query1.data": ["JS_file.func1"] },
        Query2: { "Query2.run": ["JS_file.func2"] },
        JS_file: {
          "JS_file.func1": ["Select1.options"],
          "JS_file.func2": ["Select1.options"],
        },
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
          },
          JS_file: {
            "JS_file.func1": ["Select1.options"],
          },
        },
        new Set<string>(),
      );
      expect(dependants).toStrictEqual({
        names: new Set(["JS_file", "Select1"]),
        fullPaths: new Set(["JS_file.func1", "Select1.options"]),
      });
    });
  });
});
