import type {
  WidgetEntity,
  DataTreeEntityConfig,
} from "ee/entities/DataTree/types";
import { getEntityPathDependencies } from "./utils/getEntityDependencies";

describe("DependencyMap utils", function () {
  test("getEntityPathDependencies", () => {
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

    const actualResult = getEntityPathDependencies(
      entity,
      entityConfig,
      "Button1.onClick",
      {},
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
    const result = getEntityPathDependencies(
      entity2,
      entityConfig2,
      "Button1.googleRecaptchaKey",
      {},
    );
    const expected = ["JSObject.myVar1"];

    expect(expected).toStrictEqual(result);
  });
});
