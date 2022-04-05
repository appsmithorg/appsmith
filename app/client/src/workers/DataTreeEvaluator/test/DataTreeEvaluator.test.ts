import DataTreeEvaluator from "../DataTreeEvaluator";
import { unEvalTree } from "./mockUnEvalTree";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { DataTreeDiff } from "workers/evaluationUtils";
import { ALL_WIDGETS_AND_CONFIG } from "utils/WidgetRegistry";

const widgetConfigMap = {};
ALL_WIDGETS_AND_CONFIG.map(([, config]) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: No types available
  if (config.type && config.properties) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: No types available
    widgetConfigMap[config.type] = {
      defaultProperties: config.properties.default,
      derivedProperties: config.properties.derived,
      metaProperties: config.properties.meta,
    };
  }
});

describe("DataTreeEvaluator", () => {
  let dataTreeEvaluator: DataTreeEvaluator;
  beforeEach(() => {
    dataTreeEvaluator = new DataTreeEvaluator(widgetConfigMap);
  });
  describe("evaluateActionBindings", () => {
    it("handles this.params.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return this.params.property })()",
          "(() => { return this.params.property })()",
          'this.params.property || "default value"',
          'this.params.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles this?.params.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(() => { return this?.params.property })()",
          "(function() { return this?.params.property })()",
          'this?.params.property || "default value"',
          'this?.params.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles this?.params?.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(() => { return this?.params?.property })()",
          "(function() { return this?.params?.property })()",
          'this?.params?.property || "default value"',
          'this?.params?.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles executionParams.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return executionParams.property })()",
          "(() => { return executionParams.property })()",
          'executionParams.property || "default value"',
          'executionParams.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles executionParams?.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return executionParams?.property })()",
          "(() => { return executionParams?.property })()",
          'executionParams?.property || "default value"',
          'executionParams?.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });
  });

  describe("test updateDependencyMap", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      dataTreeEvaluator.createFirstTree(unEvalTree as DataTree);
    });

    it("initial dependencyMap computation", () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      dataTreeEvaluator.updateDataTree(unEvalTree as DataTree);
      expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
        "Table1.searchText": [
          "Table1.meta.searchText",
          "Table1.defaultSearchText",
        ],
        "Table1.selectedRowIndex": [
          "Table1.meta.selectedRowIndex",
          "Table1.defaultSelectedRow",
        ],
        "Table1.selectedRowIndices": [
          "Table1.meta.selectedRowIndices",
          "Table1.defaultSelectedRow",
        ],
        "Table1.primaryColumns.step.computedValue": [
          "Table1.sanitizedTableData",
        ],
        "Table1.primaryColumns.task.computedValue": [
          "Table1.sanitizedTableData",
        ],
        "Table1.primaryColumns.status.computedValue": [
          "Table1.sanitizedTableData",
        ],
        "Table1.primaryColumns.action.computedValue": [
          "Table1.sanitizedTableData",
        ],
        "Table1.selectedRow": [
          "Table1.filteredTableData",
          "Table1.sanitizedTableData",
        ],
        "Table1.triggeredRow": ["Table1.sanitizedTableData"],
        "Table1.selectedRows": [
          "Table1.filteredTableData",
          "Table1.sanitizedTableData",
        ],
        "Table1.pageSize": [
          "Table1.bottomRow",
          "Table1.topRow",
          "Table1.parentRowSpace",
        ],
        "Table1.triggerRowSelection": [],
        "Table1.sanitizedTableData": ["Table1.tableData"],
        "Table1.tableColumns": [
          "Table1.primaryColumns",
          "Table1.sanitizedTableData",
          "Table1.sortOrder.column",
          "Table1.sortOrder.order",
          "Table1.columnOrder",
        ],
        "Table1.filteredTableData": [
          "Table1.sanitizedTableData",
          "Table1.primaryColumns",
          "Table1.derivedColumns",
          "Table1.tableColumns",
          "Table1.sortOrder.column",
          "Table1.sortOrder.order",
          "Table1.enableClientSideSearch",
          "Table1.filters",
        ],
        "Text1.value": ["Text1.text"],
        Table1: [
          "Table1.searchText",
          "Table1.meta",
          "Table1.selectedRowIndex",
          "Table1.defaultSelectedRow",
          "Table1.selectedRowIndices",
          "Table1.primaryColumns",
          "Table1.sanitizedTableData",
          "Table1.selectedRow",
          "Table1.filteredTableData",
          "Table1.triggeredRow",
          "Table1.selectedRows",
          "Table1.pageSize",
          "Table1.bottomRow",
          "Table1.topRow",
          "Table1.parentRowSpace",
          "Table1.triggerRowSelection",
          "Table1.tableData",
          "Table1.tableColumns",
          "Table1.sortOrder",
          "Table1.columnOrder",
          "Table1.derivedColumns",
          "Table1.enableClientSideSearch",
          "Table1.filters",
        ],
        "Table1.primaryColumns.step": [
          "Table1.primaryColumns.step.computedValue",
        ],
        "Table1.primaryColumns": [
          "Table1.primaryColumns.step",
          "Table1.primaryColumns.task",
          "Table1.primaryColumns.status",
          "Table1.primaryColumns.action",
        ],
        "Table1.primaryColumns.task": [
          "Table1.primaryColumns.task.computedValue",
        ],
        "Table1.primaryColumns.status": [
          "Table1.primaryColumns.status.computedValue",
        ],
        "Table1.primaryColumns.action": [
          "Table1.primaryColumns.action.computedValue",
        ],
        "Table1.sortOrder": [
          "Table1.sortOrder.column",
          "Table1.sortOrder.order",
        ],
        Text1: ["Text1.value", "Text1.text"],
      });
    });

    // it(`When empty binding is modified from {{Button1.text}} to {{""}}`, () => {
    //   const translatedDiffs = [
    //     {
    //       payload: {
    //         propertyPath: "Text1.text",
    //         value: "{{Table1.selectedRow.task}}",
    //       },
    //       event: "EDIT",
    //     },
    //   ];
    //   dataTreeEvaluator.updateDependencyMap(
    //     translatedDiffs as Array<DataTreeDiff>,
    //     dataTreeEvaluator.oldUnEvalTree,
    //   );

    //   expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
    //     "Table1.searchText": [
    //       "Table1.meta.searchText",
    //       "Table1.defaultSearchText",
    //     ],
    //     "Table1.selectedRowIndex": [
    //       "Table1.meta.selectedRowIndex",
    //       "Table1.defaultSelectedRow",
    //     ],
    //     "Table1.selectedRowIndices": [
    //       "Table1.meta.selectedRowIndices",
    //       "Table1.defaultSelectedRow",
    //     ],
    //     "Table1.primaryColumns.step.computedValue": [
    //       "Table1.sanitizedTableData",
    //     ],
    //     "Table1.primaryColumns.task.computedValue": [
    //       "Table1.sanitizedTableData",
    //     ],
    //     "Table1.primaryColumns.status.computedValue": [
    //       "Table1.sanitizedTableData",
    //     ],
    //     "Table1.primaryColumns.action.computedValue": [
    //       "Table1.sanitizedTableData",
    //     ],
    //     "Table1.selectedRow": [
    //       "Table1.selectedRowIndices",
    //       "Table1.selectedRowIndex",
    //       "Table1.filteredTableData",
    //       "Table1.sanitizedTableData",
    //     ],
    //     "Table1.triggeredRow": [
    //       "Table1.triggeredRowIndex",
    //       "Table1.sanitizedTableData",
    //     ],
    //     "Table1.selectedRows": [
    //       "Table1.selectedRowIndices",
    //       "Table1.filteredTableData",
    //       "Table1.sanitizedTableData",
    //     ],
    //     "Table1.pageSize": [
    //       "Table1.bottomRow",
    //       "Table1.topRow",
    //       "Table1.parentRowSpace",
    //     ],
    //     "Table1.triggerRowSelection": [],
    //     "Table1.sanitizedTableData": ["Table1.tableData"],
    //     "Table1.tableColumns": [
    //       "Table1.primaryColumns",
    //       "Table1.sanitizedTableData",
    //       "Table1.sortOrder.column",
    //       "Table1.sortOrder.order",
    //       "Table1.columnOrder",
    //     ],
    //     "Table1.filteredTableData": [
    //       "Table1.sanitizedTableData",
    //       "Table1.primaryColumns",
    //       "Table1.derivedColumns",
    //       "Table1.tableColumns",
    //       "Table1.sortOrder.column",
    //       "Table1.sortOrder.order",
    //       "Table1.searchText",
    //       "Table1.enableClientSideSearch",
    //       "Table1.filters",
    //     ],
    //     "Text1.value": ["Text1.text"],
    //     Table1: [
    //       "Table1.searchText",
    //       "Table1.meta",
    //       "Table1.defaultSearchText",
    //       "Table1.selectedRowIndex",
    //       "Table1.defaultSelectedRow",
    //       "Table1.selectedRowIndices",
    //       "Table1.primaryColumns",
    //       "Table1.sanitizedTableData",
    //       "Table1.selectedRow",
    //       "Table1.filteredTableData",
    //       "Table1.triggeredRow",
    //       "Table1.triggeredRowIndex",
    //       "Table1.selectedRows",
    //       "Table1.pageSize",
    //       "Table1.bottomRow",
    //       "Table1.topRow",
    //       "Table1.parentRowSpace",
    //       "Table1.triggerRowSelection",
    //       "Table1.tableData",
    //       "Table1.tableColumns",
    //       "Table1.sortOrder",
    //       "Table1.columnOrder",
    //       "Table1.derivedColumns",
    //       "Table1.enableClientSideSearch",
    //       "Table1.filters",
    //     ],
    //     "Table1.meta": [
    //       "Table1.meta.searchText",
    //       "Table1.meta.selectedRowIndex",
    //       "Table1.meta.selectedRowIndices",
    //     ],
    //     "Table1.primaryColumns.step": [
    //       "Table1.primaryColumns.step.computedValue",
    //     ],
    //     "Table1.primaryColumns": [
    //       "Table1.primaryColumns.step",
    //       "Table1.primaryColumns.task",
    //       "Table1.primaryColumns.status",
    //       "Table1.primaryColumns.action",
    //     ],
    //     "Table1.primaryColumns.task": [
    //       "Table1.primaryColumns.task.computedValue",
    //     ],
    //     "Table1.primaryColumns.status": [
    //       "Table1.primaryColumns.status.computedValue",
    //     ],
    //     "Table1.primaryColumns.action": [
    //       "Table1.primaryColumns.action.computedValue",
    //     ],
    //     "Table1.sortOrder": [
    //       "Table1.sortOrder.column",
    //       "Table1.sortOrder.order",
    //     ],
    //     Text1: ["Text1.value", "Text1.text"],
    //     "Text1.text": ["Table1.selectedRow"],
    //   });
    // });

    // it(`When binding is removed`, () => {
    //   const translatedDiffs = [
    //     {
    //       payload: {
    //         propertyPath: "Button2.text",
    //         value: "abc",
    //       },
    //       event: "EDIT",
    //     },
    //   ];
    //   dataTreeEvaluator.updateDependencyMap(
    //     translatedDiffs as Array<DataTreeDiff>,
    //     dataTreeEvaluator.oldUnEvalTree,
    //   );

    //   expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
    //     Button2: ["Button2.text"],
    //     Button1: ["Button1.text"],
    //   });
    // });
  });
});
