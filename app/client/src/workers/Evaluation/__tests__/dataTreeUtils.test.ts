import {
  UnEvalTree,
  UnEvalTreeAction,
} from "entities/DataTree/dataTreeFactory";
import {
  createNewEntity,
  createUnEvalTreeForEval,
  makeEntityConfigsAsObjProperties,
} from "../dataTreeUtils";

const unevalTreeFromMainThread = {
  Api2: {
    actionId: "6380b1003a20d922b774eb75",
    run: {},
    clear: {},
    isLoading: false,
    responseMeta: {
      isExecutionSuccess: false,
    },
    config: {},
    ENTITY_TYPE: "ACTION",
    datasourceUrl: "https://www.facebook.com",
    __config__: {
      actionId: "6380b1003a20d922b774eb75",
      name: "Api2",
      pluginId: "5ca385dc81b37f0004b4db85",
      pluginType: "API",
      dynamicBindingPathList: [
        {
          key: "config.path",
        },
      ],
      ENTITY_TYPE: "ACTION",
      bindingPaths: {
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        data: "TEMPLATE",
        isLoading: "TEMPLATE",
        datasourceUrl: "TEMPLATE",
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
          "SMART_SUBSTITUTE",
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    },
  },
  JSObject1: {
    newFunction: {
      data: {},
    },
    storeTest2: {
      data: {},
    },
    body:
      "export default {\n\tstoreTest2: () => {\n\t\tlet values = [\n\t\t\t\t\tstoreValue('val1', 'number 1'),\n\t\t\t\t\tstoreValue('val2', 'number 2'),\n\t\t\t\t\tstoreValue('val3', 'number 3'),\n\t\t\t\t\tstoreValue('val4', 'number 4')\n\t\t\t\t];\n\t\treturn Promise.all(values)\n\t\t\t.then(() => {\n\t\t\tshowAlert(JSON.stringify(appsmith.store))\n\t\t})\n\t\t\t.catch((err) => {\n\t\t\treturn showAlert('Could not store values in store ' + err.toString());\n\t\t})\n\t},\n\tnewFunction: function() {\n\t\tJSObject1.storeTest()\n\t}\n}",
    ENTITY_TYPE: "JSACTION",
    __config__: {
      meta: {
        newFunction: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
        storeTest2: {
          arguments: [],
          isAsync: true,
          confirmBeforeExecute: false,
        },
      },
      name: "JSObject1",
      actionId: "637cda3b2f8e175c6f5269d5",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        newFunction: "SMART_SUBSTITUTE",
        storeTest2: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        newFunction: "SMART_SUBSTITUTE",
        storeTest2: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "newFunction",
        },
        {
          key: "storeTest2",
        },
      ],
      variables: [],
      dependencyMap: {
        body: ["newFunction", "storeTest2"],
      },
    },
  },
  MainContainer: {
    ENTITY_TYPE: "WIDGET",
    widgetName: "MainContainer",
    backgroundColor: "none",
    rightColumn: 1224,
    snapColumns: 64,
    widgetId: "0",
    topRow: 0,
    bottomRow: 1240,
    containerStyle: "none",
    snapRows: 124,
    parentRowSpace: 1,
    canExtend: true,
    minHeight: 1250,
    parentColumnSpace: 1,
    leftColumn: 0,
    meta: {},
    __config__: {
      defaultProps: {},
      defaultMetaProps: [],
      dynamicBindingPathList: [],
      logBlackList: {},
      bindingPaths: {},
      reactivePaths: {},
      triggerPaths: {},
      validationPaths: {},
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "CANVAS_WIDGET",
    },
  },
  Button2: {
    ENTITY_TYPE: "WIDGET",
    resetFormOnClick: false,
    boxShadow: "none",
    widgetName: "Button2",
    buttonColor: "{{appsmith.theme.colors.primaryColor}}",
    topRow: 3,
    bottomRow: 7,
    parentRowSpace: 10,
    animateLoading: true,
    parentColumnSpace: 34.5,
    leftColumn: 31,
    text: "test",
    isDisabled: false,
    key: "oypcoe6gx4",
    rightColumn: 47,
    isDefaultClickDisabled: true,
    widgetId: "vxpz4ta27g",
    isVisible: true,
    recaptchaType: "V3",
    isLoading: false,
    disabledWhenInvalid: false,
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    buttonVariant: "PRIMARY",
    placement: "CENTER",
    meta: {},
    __config__: {
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
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "BUTTON_WIDGET",
      dynamicTriggerPathList: [],
    },
  },
  pageList: [
    {
      pageName: "Page1",
      pageId: "63349fb5d39f215f89b8245e",
      isDefault: false,
      isHidden: false,
      slug: "page1",
    },
    {
      pageName: "Page2",
      pageId: "637cc6b4a3664a7fe679b7b0",
      isDefault: true,
      isHidden: false,
      slug: "page2",
    },
  ],
  appsmith: {
    user: {
      email: "someuser@appsmith.com",
      username: "someuser@appsmith.com",
      name: "Some name",
      enableTelemetry: true,
      emptyInstance: false,
      accountNonExpired: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      isAnonymous: false,
      isEnabled: true,
      isSuperUser: false,
      isConfigurable: true,
    },
    URL: {
      fullPath: "",
      host: "dev.appsmith.com",
      hostname: "dev.appsmith.com",
      queryParams: {},
      protocol: "https:",
      pathname: "",
      port: "",
      hash: "",
    },
    store: {
      val1: "number 1",
      val2: "number 2",
    },
    geolocation: {
      canBeRequested: true,
      currentPosition: {},
    },
    mode: "EDIT",
    theme: {
      colors: {
        primaryColor: "#553DE9",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: "0.375rem",
      },
      boxShadow: {
        appBoxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
      fontFamily: {
        appFont: "Nunito Sans",
      },
    },
    ENTITY_TYPE: "APPSMITH",
  },
};

describe("7. Test util methods", () => {
  it("1. createUnEvalTree method", () => {
    const unEvalTreeForEval = createUnEvalTreeForEval(
      (unevalTreeFromMainThread as unknown) as UnEvalTree,
    );
    // Action config
    expect(unEvalTreeForEval).toHaveProperty(
      "Api2.dynamicBindingPathList",
      unevalTreeFromMainThread.Api2.__config__.dynamicBindingPathList,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Api2.bindingPaths",
      unevalTreeFromMainThread.Api2.__config__.bindingPaths,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Api2.reactivePaths",
      unevalTreeFromMainThread.Api2.__config__.reactivePaths,
    );

    // widget config
    expect(unEvalTreeForEval).toHaveProperty(
      "Button2.dynamicBindingPathList",
      unevalTreeFromMainThread.Button2.__config__.dynamicBindingPathList,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Button2.bindingPaths",
      unevalTreeFromMainThread.Button2.__config__.bindingPaths,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Button2.reactivePaths",
      unevalTreeFromMainThread.Button2.__config__.reactivePaths,
    );

    // appsmith object config
    expect(unEvalTreeForEval).toHaveProperty(
      "appsmith",
      unevalTreeFromMainThread.appsmith,
    );

    // JSObject config
    expect(unEvalTreeForEval).toHaveProperty(
      "JSObject1.dynamicBindingPathList",
      unevalTreeFromMainThread.JSObject1.__config__.dynamicBindingPathList,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "JSObject1.bindingPaths",
      unevalTreeFromMainThread.JSObject1.__config__.bindingPaths,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "JSObject1.reactivePaths",
      unevalTreeFromMainThread.JSObject1.__config__.reactivePaths,
    );
  });

  it("2. createNewEntity method", () => {
    const actionForEval = createNewEntity(
      (unevalTreeFromMainThread.Api2 as unknown) as UnEvalTreeAction,
    );
    // Action config
    expect(actionForEval).toHaveProperty(
      "dynamicBindingPathList",
      unevalTreeFromMainThread.Api2.__config__.dynamicBindingPathList,
    );
    expect(actionForEval).not.toHaveProperty("__config__");

    const widgetForEval = createNewEntity(
      (unevalTreeFromMainThread.Button2 as unknown) as UnEvalTreeAction,
    );
    // widget config
    expect(widgetForEval).toHaveProperty(
      "dynamicBindingPathList",
      unevalTreeFromMainThread.Button2.__config__.dynamicBindingPathList,
    );
    expect(widgetForEval).not.toHaveProperty("__config__");
  });

  it("3. makeDataTreeEntityConfigAsProperty method", () => {
    const unEvalTreeForEval = createUnEvalTreeForEval(
      (unevalTreeFromMainThread as unknown) as UnEvalTree,
    );
    const dataTree = makeEntityConfigsAsObjProperties(unEvalTreeForEval);

    expect(dataTree.Api2).not.toHaveProperty("__config__");

    expect(dataTree.Api2).toHaveProperty(
      "dynamicBindingPathList",
      unevalTreeFromMainThread.Api2.__config__.dynamicBindingPathList,
    );
  });
});
