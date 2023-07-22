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
import type {
  DataTree,
  ConfigTree,
  WidgetEntity,
  DataTreeEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import {
  unEvalTreeWidgetSelectWidgetConfig,
  configTree,
} from "workers/common/DataTreeEvaluator/mockData/mockConfigTree";

import { listEntityPathDependencies } from "./utils";

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
      unEvalTreeWidgetSelectWidget as unknown as DataTree,
      unEvalTreeWidgetSelectWidgetConfig as unknown as ConfigTree,
    );
    dataTreeEvaluator.evalAndValidateFirstTree();
  });

  it("initial validation dependencyMap computation", () => {
    expect(
      dataTreeEvaluator.validationDependencyMap.dependencies,
    ).toStrictEqual({
      "Select2.defaultOptionValue": [
        "Select2.serverSideFiltering",
        "Select2.options",
      ],
    });
  });

  it("update validation dependencyMap computation", () => {
    const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
      dataTreeEvaluator.setupUpdateTree(
        unEvalTree as unknown as DataTree,
        configTree as unknown as ConfigTree,
      );

    dataTreeEvaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      configTree as unknown as ConfigTree,
      unEvalUpdates,
    );

    expect(
      dataTreeEvaluator.validationDependencyMap.dependencies,
    ).toStrictEqual({});
  });
});

describe("DependencyMap utils", function () {
  test("listEntityPathDependencies", () => {
    const entity = {
      ENTITY_TYPE: "WIDGET",
      isVisible: true,
      animateLoading: true,
      text: "Submit",
      buttonVariant: "PRIMARY",
      placement: "CENTER",
      widgetName: "Button1",
      isDisabled: false,
      isDefaultClickDisabled: true,
      disabledWhenInvalid: false,
      resetFormOnClick: false,
      recaptchaType: "V3",
      key: "7rt30wsb1w",
      widgetId: "hmqejzs6wz",
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
      isLoading: false,
      parentColumnSpace: 2.9375,
      parentRowSpace: 10,
      leftColumn: 20,
      rightColumn: 36,
      topRow: 21,
      bottomRow: 25,
      onClick: "",
      meta: {},
      type: "BUTTON_WIDGET",
    } as unknown as WidgetEntity;

    const entityConfig = {
      widgetId: "hmqejzs6wz",
      ENTITY_TYPE: "WIDGET",
      type: "BUTTON_WIDGET",
      defaultProps: {},
      defaultMetaProps: ["recaptchaToken"],
      dynamicBindingPathList: [
        {
          key: "buttonColor",
        },
        {
          key: "borderRadius",
        },
      ],
      logBlackList: {},
      bindingPaths: {
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      reactivePaths: {
        recaptchaToken: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      dynamicPropertyPathList: [
        {
          key: "onClick",
        },
      ],
      dynamicTriggerPathList: [
        {
          key: "onClick",
        },
      ],
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      triggerPaths: {
        onClick: true,
      },
    } as unknown as DataTreeEntityConfig;

    const actualResult = listEntityPathDependencies(
      entity,
      "Button1.onClick",
      entityConfig,
    );

    expect([]).toStrictEqual(actualResult);

    const entity2 = {
      ENTITY_TYPE: "WIDGET",
      isVisible: true,
      animateLoading: true,
      text: "Submit",
      buttonVariant: "PRIMARY",
      placement: "CENTER",
      widgetName: "Button1",
      isDisabled: false,
      isDefaultClickDisabled: true,
      disabledWhenInvalid: false,
      resetFormOnClick: false,
      recaptchaType: "V3",
      key: "oucrqjoiv0",
      widgetId: "35z8qp6hkj",
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
      isLoading: false,
      parentColumnSpace: 2.9375,
      parentRowSpace: 10,
      leftColumn: 23,
      rightColumn: 39,
      topRow: 28,
      bottomRow: 32,
      googleRecaptchaKey: "{{JSObject.myVar1}}",
      meta: {},
      type: "BUTTON_WIDGET",
    } as unknown as WidgetEntity;

    const entityConfig2 = {
      ENTITY_TYPE: "WIDGET",
      widgetId: "35z8qp6hkj",
      defaultProps: {},
      defaultMetaProps: ["recaptchaToken"],
      dynamicBindingPathList: [
        {
          key: "buttonColor",
        },
        {
          key: "borderRadius",
        },
        {
          key: "googleRecaptchaKey",
        },
      ],

      logBlackList: {},
      bindingPaths: {
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      reactivePaths: {
        recaptchaToken: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      triggerPaths: {
        onClick: true,
      },
      validationPaths: {
        text: {
          type: "TEXT",
        },
        tooltip: {
          type: "TEXT",
        },
        isVisible: {
          type: "BOOLEAN",
        },
        isDisabled: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        googleRecaptchaKey: {
          type: "TEXT",
        },
        recaptchaType: {
          type: "TEXT",
          params: {
            allowedValues: ["V3", "V2"],
            default: "V3",
          },
        },
        disabledWhenInvalid: {
          type: "BOOLEAN",
        },
        resetFormOnClick: {
          type: "BOOLEAN",
        },
        buttonVariant: {
          type: "TEXT",
          params: {
            allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
            default: "PRIMARY",
          },
        },
        iconName: {
          type: "TEXT",
        },
        placement: {
          type: "TEXT",
          params: {
            allowedValues: ["START", "BETWEEN", "CENTER"],
            default: "CENTER",
          },
        },
        buttonColor: {
          type: "TEXT",
        },
        borderRadius: {
          type: "TEXT",
        },
        boxShadow: {
          type: "TEXT",
        },
      },
      dynamicTriggerPathList: [],
      type: "BUTTON_WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
    } as unknown as DataTreeEntityConfig;
    const result = listEntityPathDependencies(
      entity2,
      "Button1.googleRecaptchaKey",
      entityConfig2,
    );
    const expected = ["JSObject.myVar1"];

    expect(expected).toStrictEqual(result);
  });
});
