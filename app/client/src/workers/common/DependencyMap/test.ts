import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import {
  unEvalTree,
  unEvalTreeWidgetSelectWidget,
} from "workers/common/DataTreeEvaluator/mockData/mockUnEvalTree";
import ButtonWidget, {
  CONFIG as BUTTON_WIDGET_CONFIG,
} from "widgets/ButtonWidget";
import SelectWidget, {
  CONFIG as SELECT_WIDGET_CONFIG,
} from "widgets/SelectWidget";
import { DataTree, ConfigTree } from "entities/DataTree/dataTreeFactory";
import {
  unEvalTreeWidgetSelectWidgetConfig,
  configTree,
} from "workers/common/DataTreeEvaluator/mockData/mockConfigTree";

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

describe("test validationDependencyMap", () => {
  beforeAll(() => {
    dataTreeEvaluator.setupFirstTree(
      (unEvalTreeWidgetSelectWidget as unknown) as DataTree,
      (unEvalTreeWidgetSelectWidgetConfig as unknown) as ConfigTree,
    );
    dataTreeEvaluator.evalAndValidateFirstTree();
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
    const {
      evalOrder,
      nonDynamicFieldValidationOrder,
      unEvalUpdates,
    } = dataTreeEvaluator.setupUpdateTree(
      (unEvalTree as unknown) as DataTree,
      (configTree as unknown) as ConfigTree,
    );
    dataTreeEvaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      (configTree as unknown) as ConfigTree,
      unEvalUpdates,
    );

    expect(dataTreeEvaluator.validationDependencyMap).toStrictEqual({});
  });
});
