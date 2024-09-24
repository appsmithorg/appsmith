import { PluginType } from "entities/Action";
import type {
  WidgetEntity,
  ActionEntity,
  JSActionEntity,
} from "ee/entities/DataTree/types";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  findLoadingEntities,
  getEntityDependantPaths,
  groupAndFilterDependantsMap,
} from "utils/WidgetLoadingStateUtils";
import WidgetFactory from "../WidgetProvider/factory";

const JS_object_tree: JSActionEntity = {
  pluginType: PluginType.JS,
  name: "",
  ENTITY_TYPE: ENTITY_TYPE.JSACTION,
  body: "",
  meta: {},
  dynamicBindingPathList: [],
  bindingPaths: {},
  reactivePaths: {},
  variables: [],
  dependencyMap: {},
  actionId: "",
};

// @ts-expect-error: meta property not provided
const Select_tree: WidgetEntity = {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  widgetId: "",
  type: "",
  widgetName: "",
  renderMode: "CANVAS",
  version: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
  animateLoading: true,
};

const Query_tree: ActionEntity = {
  data: {},
  actionId: "",
  config: {},
  run: {},
  clear: {},
  ENTITY_TYPE: ENTITY_TYPE.ACTION,
  datasourceUrl: "",
  responseMeta: {
    isExecutionSuccess: true,
  },
  isLoading: false,
};

const Api_tree: ActionEntity = {
  data: {},
  actionId: "",
  config: {},
  run: {},
  clear: {},
  ENTITY_TYPE: ENTITY_TYPE.ACTION,
  datasourceUrl: "",
  responseMeta: {
    isExecutionSuccess: true,
  },
  isLoading: false,
};

const Table_tree: WidgetEntity = {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  widgetId: "",
  type: "TABLE_WIDGET",
  widgetName: "",
  renderMode: "CANVAS",
  version: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
  animateLoading: true,
  meta: {},
};

const baseDataTree = {
  JS_file: { ...JS_object_tree, name: "JS_file" },
  Select1: { ...Select_tree, name: "Select1" },
  Select2: { ...Select_tree, name: "Select2" },
  Select3: { ...Select_tree, name: "Select3" },
  Table1: { ...Table_tree, name: "Table1" },
  Query1: { ...Query_tree, name: "Query1" },
  Query2: { ...Query_tree, name: "Query2" },
  Query3: { ...Query_tree, name: "Query3" },
  Api1: { ...Api_tree, name: "Api1" },
};

describe("Widget loading state utils", () => {
  describe("findLoadingEntites", () => {
    // Select1.options -> JS_file.func1 -> Query1.data
    // Select2.options -> JS_file.func2 -> Query2.data
    // JS_file.func3 -> Query3.data
    const baseInverseMap = {
      "Query1.config": ["Query1"],
      "Query1.config.body": ["Query1.config"],
      "Query1.data": ["JS_file.func1", "Query1"],

      "Query2.config": ["Query2"],
      "Query2.config.body": ["Query2.config"],
      "Query2.data": ["JS_file.func2", "Query2"],

      "Query3.config": ["Query3"],
      "Query3.config.body": ["Query3.config"],
      "Query3.data": ["JS_file.func3"],

      "JS_file.func1": ["Select1.options"],
      "JS_file.func2": ["Select2.options"],

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
      "Select3.options": [
        "Select3.selectedOptionValue",
        "Select3.selectedOptionLabel",
        "Select3",
      ],
    };

    beforeAll(() => {
      // mock WidgetFactory.getLoadingProperties
      const loadingPropertiesMap = new Map<string, RegExp[]>();

      loadingPropertiesMap.set("TABLE_WIDGET", [/.tableData$/]);

      jest
        .spyOn(WidgetFactory, "getLoadingProperties")
        .mockImplementation((widgetType) =>
          loadingPropertiesMap.get(widgetType),
        );
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    // Select1.options -> JS_file.func1 -> Query1.data
    it("handles linear dependencies", () => {
      const loadingEntites = findLoadingEntities(
        ["Query1"],
        baseDataTree,
        baseInverseMap,
      );

      expect(loadingEntites).toStrictEqual(new Set(["Select1"]));
    });

    // Select1.options -> JS_file.func1 -> Query1.data
    // Select2.options -> JS_file.func2 -> Query2.data
    // Select3.options -> none
    it("handles multiple dependencies", () => {
      const loadingEntites = findLoadingEntities(
        ["Query1", "Query2", "Query3"],
        baseDataTree,
        baseInverseMap,
      );

      expect(loadingEntites).toStrictEqual(new Set(["Select1", "Select2"]));
    });

    // none -> Query3.data
    it("handles no dependencies", () => {
      const loadingEntites = findLoadingEntities(
        ["Query3"],
        baseDataTree,
        baseInverseMap,
      );

      expect(loadingEntites).toStrictEqual(new Set([]));
    });

    // JS_file.func1 -> Query1.run
    // Select1.options -> Query1.data
    it("handles Query.run and Query.data dependency", () => {
      const loadingEntites = findLoadingEntities(["Query1"], baseDataTree, {
        "Query1.config": ["Query1"],
        "Query1.config.body": ["Query1.config"],
        "Query1.run": ["JS_file.func1"],
        "Query1.data": ["Select1.options", "Query1"],

        "JS_file.func1": [],

        "Select1.options": [
          "Select1.selectedOptionValue",
          "Select1.selectedOptionLabel",
          "Select1",
        ],
      });

      expect(loadingEntites).toStrictEqual(new Set(["Select1"]));
    });

    // Select1.options -> JS_file.func1 -> JS_file.internalFunc -> Query1.data
    it("handles nested JS dependencies within same file", () => {
      const loadingEntites = findLoadingEntities(["Query1"], baseDataTree, {
        "Query1.config": ["Query1"],
        "Query1.config.body": ["Query1.config"],
        "Query1.data": ["JS_file.internalFunc", "Query1"],

        "JS_file.internalFunc": ["JS_file.func1"],
        "JS_file.func1": ["Select1.options"],

        "Select1.options": [
          "Select1.selectedOptionValue",
          "Select1.selectedOptionLabel",
          "Select1",
        ],
      });

      expect(loadingEntites).toStrictEqual(new Set(["Select1"]));
    });

    // Select1.options -> JS_file1.func1 -> JS_file2.internalFunc -> Query1.data
    it("handles nested JS dependencies between files", () => {
      const loadingEntites = findLoadingEntities(
        ["Query1"],
        {
          ...baseDataTree,
          JS_file1: { ...JS_object_tree, name: "JS_file1" },
          JS_file2: { ...JS_object_tree, name: "JS_file2" },
        },
        {
          "Query1.config": ["Query1"],
          "Query1.config.body": ["Query1.config"],
          "Query1.data": ["JS_file2.internalFunc", "Query1"],

          "JS_file2.internalFunc": ["JS_file1.func1"],
          "JS_file1.func1": ["Select1.options"],

          "Select1.options": [
            "Select1.selectedOptionValue",
            "Select1.selectedOptionLabel",
            "Select1",
          ],
        },
      );

      expect(loadingEntites).toStrictEqual(new Set(["Select1"]));
    });

    /* Select1.options -> JS.func1 -> Query1.data,
       Select2.options -> Query2.data,
       JS.func2 -> Query2.run

       When Query2 is called.
       Only Select2 should be listed, not Select1.
    */
    it("handles selective dependencies in same JS file", () => {
      const loadingEntites = findLoadingEntities(["Query2"], baseDataTree, {
        "Query1.config": ["Query1"],
        "Query1.config.body": ["Query1.config"],
        "Query1.data": ["JS_file.func1"],

        "Query2.config": ["Query2"],
        "Query2.config.body": ["Query2.config"],
        "Query2.data": ["JS_file.func2"],

        "JS_file.func1": ["Select1.options"],
        "JS_file.func2": ["Select2.options"],

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
      });

      expect(loadingEntites).toStrictEqual(new Set(["Select2"]));
    });

    it("includes loading properties", () => {
      const loadingEntites = findLoadingEntities(["Api1"], baseDataTree, {
        "Api1.data": ["Table1.tableData"],
      });

      expect(loadingEntites).toStrictEqual(new Set(["Table1"]));
    });

    it("ignores non-loading properties", () => {
      const loadingEntites = findLoadingEntities(["Api1"], baseDataTree, {
        "Api1.run": ["Table1.primaryColumns.action.onClick"],
      });

      expect(loadingEntites).toStrictEqual(new Set());
    });
  });

  describe("groupAndFilterDependantsMap", () => {
    it("groups entities and filters self-dependencies", () => {
      const groupedDependantsMap = groupAndFilterDependantsMap(
        {
          "Query1.config": ["Query1"],
          "Query1.config.body": ["Query1.config"],
          "Query1.data": ["JS_file.func1", "Query1"], // dependant

          "Query2.config": ["Query2"],
          "Query2.config.body": ["Query2.config"],
          "Query2.run": ["Query2", "JS_file.func2"], // dependant
          "Query2.data": ["Query2", "Select2.options"], // dependant

          "Query3.config": ["Query3"],
          "Query3.config.body": ["Query3.config"],

          "JS_file.func1": ["Select1.options"], // dependant

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
        baseDataTree,
      );

      expect(groupedDependantsMap).toStrictEqual({
        Query1: { "Query1.data": ["JS_file.func1"] },
        Query2: {
          "Query2.run": ["JS_file.func2"],
          "Query2.data": ["Select2.options"],
        },
        JS_file: {
          "JS_file.func1": ["Select1.options"],
        },
      });
    });

    it("includes JS Object's self dependencies", () => {
      const groupedDependantsMap = groupAndFilterDependantsMap(
        {
          "JS_file.func1": ["Select1.options"], // dependant
          "JS_file.internalFunc": ["JS_file.func1"], // self-dependant JsObject
        },
        baseDataTree,
      );

      expect(groupedDependantsMap).toStrictEqual({
        JS_file: {
          "JS_file.func1": ["Select1.options"],
          "JS_file.internalFunc": ["JS_file.func1"],
        },
      });
    });

    it("includes JS Object's nested self dependencies", () => {
      const groupedDependantsMap = groupAndFilterDependantsMap(
        {
          "JS_file.func1": ["Select1.options"], // dependant
          "JS_file.internalFunc2": ["JS_file.func1"], // self-dependant JsObject
          "JS_file.internalFunc1": ["JS_file.internalFunc2"], // self-dependant JsObject
        },
        baseDataTree,
      );

      expect(groupedDependantsMap).toStrictEqual({
        JS_file: {
          "JS_file.func1": ["Select1.options"],
          "JS_file.internalFunc2": ["JS_file.func1"],
          "JS_file.internalFunc1": ["JS_file.internalFunc2"],
        },
      });
    });
  });

  describe("getEntityDependantPaths", () => {
    // Select1.options -> JS_file.func1 -> Query1.data
    it("handles simple dependency", () => {
      const dependants = getEntityDependantPaths(
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

      expect(dependants).toStrictEqual(
        new Set(["JS_file.func1", "Select1.options"]),
      );
    });

    // Select1.options -> JS_file.func1 -> Query1.data
    // Select2.options -> JS_file.func2 -> Query1.data
    it("handles multiple dependencies", () => {
      const dependants = getEntityDependantPaths(
        ["Query1"],
        {
          Query1: {
            "Query1.data": ["JS_file.func1", "JS_file.func2"],
          },
          JS_file: {
            "JS_file.func1": ["Select1.options"],
            "JS_file.func2": ["Select2.options"],
          },
        },
        new Set<string>(),
      );

      expect(dependants).toStrictEqual(
        new Set([
          "JS_file.func1",
          "Select1.options",
          "JS_file.func2",
          "Select2.options",
        ]),
      );
    });

    it("handles specific entity paths", () => {
      const dependants = getEntityDependantPaths(
        ["JS_file.func2"], // specific path
        {
          Query1: {
            "Query1.data": ["JS_file.func1"],
          },
          Query2: {
            "Query2.data": ["JS_file.func2"],
          },
          JS_file: {
            "JS_file.func1": ["Select1.options"],
            "JS_file.func2": ["Select2.options"],
          },
        },
        new Set<string>(),
      );

      expect(dependants).toStrictEqual(new Set(["Select2.options"]));
    });

    // Select1.options -> JS_file.func1 -> JS_file.internalFunc -> Query1.data
    it("handles JS self-dependencies", () => {
      const dependants = getEntityDependantPaths(
        ["Query1"],
        {
          Query1: {
            "Query1.data": ["JS_file.internalFunc"],
          },
          JS_file: {
            "JS_file.internalFunc": ["JS_file.func1"],
            "JS_file.func1": ["Select1.options"],
          },
        },
        new Set<string>(),
      );

      expect(dependants).toStrictEqual(
        new Set(["JS_file.internalFunc", "JS_file.func1", "Select1.options"]),
      );
    });

    // Select1.options -> JS_file.func -> JS_file.internalFunc1 -> JS_file.internalFunc2 -> Query1.data
    it("handles nested JS self-dependencies", () => {
      const dependants = getEntityDependantPaths(
        ["Query1"],
        {
          Query1: {
            "Query1.data": ["JS_file.internalFunc2"],
          },
          JS_file: {
            "JS_file.internalFunc2": ["JS_file.internalFunc1"],
            "JS_file.internalFunc1": ["JS_file.func"],
            "JS_file.func": ["Select1.options"],
          },
        },
        new Set<string>(),
      );

      expect(dependants).toStrictEqual(
        new Set([
          "JS_file.internalFunc1",
          "JS_file.internalFunc2",
          "JS_file.func",
          "Select1.options",
        ]),
      );
    });

    /* Select1.options -> JS.func1 -> Query1.data,
       Select2.options -> Query2.data,
       JS.func2 -> Query2.run

       When Query2 is called.
       Only Select2 should be listed, not Select1.
    */
    it("handles selective dependencies in same JS file", () => {
      const dependants = getEntityDependantPaths(
        ["Query2"],
        {
          Query1: {
            "Query1.data": ["JS_file.func1"],
          },
          Query2: {
            "Query2.data": ["JS_file.func2"],
          },
          JS_file: {
            "JS_file.func1": ["Select1.options"],
            "JS_file.func2": ["Select2.options"],
          },
        },
        new Set<string>(),
      );

      expect(dependants).toStrictEqual(
        new Set(["JS_file.func2", "Select2.options"]),
      );
    });
  });
});
