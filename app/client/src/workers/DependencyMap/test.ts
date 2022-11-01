import DataTreeEvaluator from "workers/DataTreeEvaluator";
import {
  unEvalTree,
  unEvalTreeWidgetSelectWidget,
} from "workers/DataTreeEvaluator/mockData/mockUnEvalTree";
import { DataTreeDiff } from "workers/evaluationUtils";
import { updateDependencyMap } from ".";
import ButtonWidget, {
  CONFIG as BUTTON_WIDGET_CONFIG,
} from "widgets/ButtonWidget";
import SelectWidget, {
  CONFIG as SELECT_WIDGET_CONFIG,
} from "widgets/SelectWidget";
import { DataTree } from "entities/DataTree/dataTreeFactory";

const widgetConfigMap = {};

[
  [ButtonWidget, BUTTON_WIDGET_CONFIG],
  [SelectWidget, SELECT_WIDGET_CONFIG],
].map(([, config]) => {
  // @ts-expect-error: Types are not available
  if (config.type && config.properties) {
    // @ts-expect-error: Types are not available
    widgetConfigMap[config.type] = {
      // @ts-expect-error: properties does not exists
      defaultProperties: config.properties.default,
      // @ts-expect-error: properties does not exists
      derivedProperties: config.properties.derived,
      // @ts-expect-error: properties does not exists
      metaProperties: config.properties.meta,
    };
  }
});

const dataTreeEvaluator = new DataTreeEvaluator(widgetConfigMap);

describe("test updateDependencyMap", () => {
  beforeEach(() => {
    // @ts-expect-error: Types are not available
    dataTreeEvaluator.createFirstTree(unEvalTree as DataTree);
  });

  it("initial dependencyMap computation", () => {
    // @ts-expect-error: Types are not available
    dataTreeEvaluator.updateDataTree(unEvalTree as DataTree);

    expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
      "Button2.text": ["Button1.text"],
      Button2: ["Button2.text"],
      Button1: ["Button1.text"],
    });
  });

  it(`When empty binding is modified from {{Button1.text}} to {{""}}`, () => {
    const translatedDiffs = [
      {
        payload: {
          propertyPath: "Button2.text",
          value: '{{""}}',
        },
        event: "EDIT",
      },
    ];
    updateDependencyMap({
      dataTreeEvalRef: dataTreeEvaluator,
      translatedDiffs: translatedDiffs as Array<DataTreeDiff>,
      unEvalDataTree: dataTreeEvaluator.oldUnEvalTree,
    });

    expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
      "Button2.text": [],
      Button2: ["Button2.text"],
      Button1: ["Button1.text"],
    });
  });

  it(`When binding is removed`, () => {
    const translatedDiffs = [
      {
        payload: {
          propertyPath: "Button2.text",
          value: "abc",
        },
        event: "EDIT",
      },
    ];
    updateDependencyMap({
      dataTreeEvalRef: dataTreeEvaluator,
      translatedDiffs: translatedDiffs as Array<DataTreeDiff>,
      unEvalDataTree: dataTreeEvaluator.oldUnEvalTree,
    });

    expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
      Button2: ["Button2.text"],
      Button1: ["Button1.text"],
    });
  });
});

describe("test validationDependencyMap", () => {
  beforeAll(() => {
    // @ts-expect-error: Types are not available
    dataTreeEvaluator.createFirstTree(unEvalTreeWidgetSelectWidget as DataTree);
  });

  it("initial validation dependencyMap computation", () => {
    expect(dataTreeEvaluator.validationDependencyMap).toStrictEqual({
      "Select2.defaultOptionValue": [
        "Select2.serverSideFiltering",
        "Select2.options",
      ],
    });
  });

  it("update validation dependencyMap computation", () => {
    // @ts-expect-error: Types are not available
    dataTreeEvaluator.updateDataTree(unEvalTree as DataTree);

    expect(dataTreeEvaluator.validationDependencyMap).toStrictEqual({});
  });
});
