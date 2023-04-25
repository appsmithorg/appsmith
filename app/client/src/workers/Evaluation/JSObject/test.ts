import { APP_MODE } from "entities/App";
import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import { getUpdatedLocalUnEvalTreeAfterJSUpdates } from ".";
import {
  AsyncJsFunctionInDataField,
  isFunctionInvoked,
} from "./asyncJSFunctionBoundToDataField";

const mockDataTree = {
  unevalTree: {
    Api1: {
      actionId: "6425db8b3c6952132524e6ea",
      run: {},
      clear: {},
      isLoading: false,
      responseMeta: {
        isExecutionSuccess: false,
      },
      config: {
        timeoutInMillisecond: 10000,
        paginationType: "NONE",
        headers: [
          {
            key: "",
            value: "",
          },
          {
            key: "",
            value: "",
          },
        ],
        encodeParamsToggle: true,
        queryParameters: [
          {
            key: "",
            value: "",
          },
          {
            key: "",
            value: "",
          },
        ],
        body: "",
        bodyFormData: [],
        httpMethod: "GET",
        selfReferencingDataPaths: [],
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
        formData: {
          apiContentType: "none",
        },
      },
      ENTITY_TYPE: "ACTION",
      datasourceUrl: "",
    },
    JSObject1: {
      myVar1: "[]",
      myVar2: "{}",
      myFun2: {
        data: {},
      },
      myFun1: {
        data: {},
      },
      myFun3: {
        data: {},
      },
      body: 'export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\treturn "value"\n\t},\n\tmyFun2: async () => {\n\treturn "value"\n\t},\n\tmyFun3: ()=>{\n\t\tApi1.run()\n\t}\n}',
      ENTITY_TYPE: "JSACTION",
      actionId: "6425db2ef02d0b4638f2a1b3",
    },
    MainContainer: {
      ENTITY_TYPE: "WIDGET",
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 4896,
      snapColumns: 64,
      widgetId: "0",
      topRow: 0,
      bottomRow: 380,
      containerStyle: "none",
      snapRows: 124,
      parentRowSpace: 1,
      canExtend: true,
      minHeight: 1292,
      parentColumnSpace: 1,
      leftColumn: 0,
      meta: {},
      type: "CANVAS_WIDGET",
    },
    Button1: {
      ENTITY_TYPE: "WIDGET",
      isVisible: true,
      animateLoading: true,
      text: "{{JSObject1.myFun2()}} ",
      buttonVariant: "PRIMARY",
      placement: "CENTER",
      widgetName: "Button1",
      isDisabled: false,
      isDefaultClickDisabled: true,
      disabledWhenInvalid: false,
      resetFormOnClick: false,
      recaptchaType: "V3",
      responsiveBehavior: "hug",
      minWidth: 120,
      key: "lj612scwwe",
      widgetId: "5c14ze6dtv",
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
      isLoading: false,
      parentColumnSpace: 7.5625,
      parentRowSpace: 10,
      leftColumn: 20,
      rightColumn: 36,
      topRow: 15,
      bottomRow: 19,
      meta: {},
      type: "BUTTON_WIDGET",
    },
    pageList: [
      {
        pageName: "Page1",
        pageId: "6425db193c6952132524e6e2",
        isDefault: true,
        isHidden: false,
        slug: "page1",
        userPermissions: [
          "read:pages",
          "manage:pages",
          "create:pageActions",
          "delete:pages",
        ],
      },
    ],
    appsmith: {
      user: {
        email: "favour@appsmith.com",
        workspaceIds: [
          "5f7add8687af934ed846dd6a",
          "60fa970664d41f773aab20b8",
          "60a7dccf98f6c43a4b854dcb",
          "61bc28259229e87746b78969",
          "618bdd29da7cd651ee273494",
          "60c1a5273535574772b6377b",
          "6225f57945ea27345b497529",
          "61e7be9feb0501052b9fed2a",
          "622666f2b49d5451b1cd070a",
          "61431979a67ce2289d3c7c6d",
          "627a49410b47255c281326a6",
          "62e7948c4003a7259a3027c8",
        ],
        username: "favour@appsmith.com",
        name: "Favour Ohanekwu",
        photoId: "62a963ac84b91337251a632f",
        enableTelemetry: true,
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        emptyInstance: false,
        isAnonymous: false,
        isEnabled: true,
        isSuperUser: false,
        isConfigurable: true,
        adminSettingsVisible: false,
      },
      URL: {
        fullPath:
          "https://dev.appsmith.com/app/untitled-application-39/page1-6425db193c6952132524e6e2/edit",
        host: "dev.appsmith.com",
        hostname: "dev.appsmith.com",
        queryParams: {},
        protocol: "https:",
        pathname:
          "/app/untitled-application-39/page1-6425db193c6952132524e6e2/edit",
        port: "",
        hash: "",
      },
      store: {},
      geolocation: {
        canBeRequested: true,
        currentPosition: {},
      },
      mode: "EDIT",
      theme: {
        colors: {
          primaryColor: "#553DE9",
          backgroundColor: "#F8FAFC",
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
  },
  configTree: {
    Api1: {
      actionId: "6425db8b3c6952132524e6ea",
      name: "Api1",
      pluginId: "5ca385dc81b37f0004b4db85",
      pluginType: "API",
      dynamicBindingPathList: [],
      ENTITY_TYPE: "ACTION",
      bindingPaths: {
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.queryParameters[0].key": "TEMPLATE",
        "config.queryParameters[0].value": "TEMPLATE",
        "config.queryParameters[1].key": "TEMPLATE",
        "config.queryParameters[1].value": "TEMPLATE",
        "config.headers[0].key": "TEMPLATE",
        "config.headers[0].value": "TEMPLATE",
        "config.headers[1].key": "TEMPLATE",
        "config.headers[1].value": "TEMPLATE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.limitBased.offset.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.limit.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.cursor.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.next.limit.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.next.cursor.value":
          "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        data: "TEMPLATE",
        isLoading: "TEMPLATE",
        datasourceUrl: "TEMPLATE",
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.queryParameters[0].key": "TEMPLATE",
        "config.queryParameters[0].value": "TEMPLATE",
        "config.queryParameters[1].key": "TEMPLATE",
        "config.queryParameters[1].value": "TEMPLATE",
        "config.headers[0].key": "TEMPLATE",
        "config.headers[0].value": "TEMPLATE",
        "config.headers[1].key": "TEMPLATE",
        "config.headers[1].value": "TEMPLATE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.limitBased.offset.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.limit.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.cursor.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.next.limit.value":
          "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.cursorBased.next.cursor.value":
          "SMART_SUBSTITUTE",
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    },
    JSObject1: {
      actionId: "6425db2ef02d0b4638f2a1b3",
      meta: {
        myFun2: {
          arguments: [],
          isAsync: true,
          confirmBeforeExecute: false,
        },
        myFun1: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
        myFun3: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
      },
      name: "JSObject1",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
        myFun3: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
        myFun3: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "myVar1",
        },
        {
          key: "myVar2",
        },
        {
          key: "myFun2",
        },
        {
          key: "myFun1",
        },
        {
          key: "myFun3",
        },
      ],
      variables: ["myVar1", "myVar2"],
      dependencyMap: {
        body: ["myFun2", "myFun1", "myFun3"],
      },
    },
    MainContainer: {
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
      dynamicTriggerPathList: [],
      isMetaPropDirty: false,
      widgetId: "0",
    },
    Button1: {
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
          key: "text",
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
      isMetaPropDirty: false,
      widgetId: "5c14ze6dtv",
    },
  },
} as unknown as {
  unevalTree: UnEvalTree;
  configTree: ConfigTree;
};

describe("updateJSCollectionInUnEvalTree", function () {
  it("updates async value of jsAction", () => {
    const jsUpdates = {
      JSObject1: {
        parsedBody: {
          body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n}",
          actions: [
            {
              name: "myFun1",
              body: "() => {}",
              arguments: [],
              isAsync: false,
            },
            {
              name: "myFun2",
              body: "() => {\n  yeso;\n}",
              arguments: [],
              isAsync: true,
            },
          ],
          variables: [
            {
              name: "myVar1",
              value: "[]",
            },
            {
              name: "myVar2",
              value: "{}",
            },
          ],
        },
        id: "64013546b956c26882acc587",
      },
    };
    const JSObject1Config = {
      JSObject1: {
        actionId: "64013546b956c26882acc587",
        meta: {
          myFun1: {
            arguments: [],
            isAsync: false,
            confirmBeforeExecute: false,
          },
          myFun2: {
            arguments: [],
            isAsync: false,
            confirmBeforeExecute: false,
          },
        },
        name: "JSObject1",
        pluginType: "JS",
        ENTITY_TYPE: "JSACTION",
        bindingPaths: {
          body: "SMART_SUBSTITUTE",
          myVar1: "SMART_SUBSTITUTE",
          myVar2: "SMART_SUBSTITUTE",
          myFun1: "SMART_SUBSTITUTE",
          myFun2: "SMART_SUBSTITUTE",
        },
        reactivePaths: {
          body: "SMART_SUBSTITUTE",
          myVar1: "SMART_SUBSTITUTE",
          myVar2: "SMART_SUBSTITUTE",
          myFun1: "SMART_SUBSTITUTE",
          myFun2: "SMART_SUBSTITUTE",
        },
        dynamicBindingPathList: [
          {
            key: "body",
          },
          {
            key: "myVar1",
          },
          {
            key: "myVar2",
          },
          {
            key: "myFun1",
          },
          {
            key: "myFun2",
          },
        ],
        variables: ["myVar1", "myVar2"],
        dependencyMap: {
          body: ["myFun1", "myFun2"],
        },
      },
    };
    const JSObject1 = {
      myVar1: "[]",
      myVar2: "{}",
      myFun1: new String("() => {}"),
      myFun2: new String("async () => {\n  yeso;\n}"),
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
    };
    (JSObject1["myFun1"] as any).data = {};
    (JSObject1["myFun2"] as any).data = {};

    const localUnEvalTree = {
      JSObject1,
    } as unknown as UnEvalTree;

    const actualResult = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
      JSObject1Config as unknown as ConfigTree,
    );

    const expectedJSObject = {
      myVar1: "[]",
      myVar2: "{}",
      myFun1: new String("() => {}"),
      myFun2: new String("() => {\n  yeso;\n}"),
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
    };
    (expectedJSObject["myFun1"] as any).data = {};
    (expectedJSObject["myFun2"] as any).data = {};

    const expectedResult = {
      JSObject1: expectedJSObject,
    };

    expect(expectedResult).toStrictEqual(actualResult);
  });
});

describe("asyncJSFunctionInDataField", function () {
  const asyncJSFunctionInDataField = new AsyncJsFunctionInDataField();
  it("Does not update when in view mode", function () {
    asyncJSFunctionInDataField.initialize(APP_MODE.PUBLISHED);
    const updatedAsyncJSFunctionsInMap = asyncJSFunctionInDataField.update(
      "Button1.text",
      ["JSObject1.myFun2"],
      mockDataTree.unevalTree,
      mockDataTree.configTree,
    );
    // Expect no update
    expect(updatedAsyncJSFunctionsInMap).toStrictEqual([]);
    // Expect empty object
    expect(asyncJSFunctionInDataField.getMap()).toStrictEqual({});
  });

  it("updates map correctly in EDIT mode", function () {
    asyncJSFunctionInDataField.initialize(APP_MODE.EDIT);
    let updatedAsyncJSFunctionsInMap = asyncJSFunctionInDataField.update(
      "Button1.text",
      ["JSObject1.myFun2"],
      mockDataTree.unevalTree,
      mockDataTree.configTree,
    );
    // It updates JSObject1.myFun2
    expect(updatedAsyncJSFunctionsInMap).toStrictEqual(["JSObject1.myFun2"]);
    expect(asyncJSFunctionInDataField.getMap()).toStrictEqual({
      "JSObject1.myFun2": ["Button1.text"],
    });

    // Delete {{JSObject1.myFun2()}} from Button1.text field
    let newDataTree = {
      unevalTree: {
        Api1: {
          actionId: "6425db8b3c6952132524e6ea",
          run: {},
          clear: {},
          isLoading: false,
          responseMeta: {
            isExecutionSuccess: false,
          },
          config: {
            timeoutInMillisecond: 10000,
            paginationType: "NONE",
            headers: [
              {
                key: "",
                value: "",
              },
              {
                key: "",
                value: "",
              },
            ],
            encodeParamsToggle: true,
            queryParameters: [
              {
                key: "",
                value: "",
              },
              {
                key: "",
                value: "",
              },
            ],
            body: "",
            bodyFormData: [],
            httpMethod: "GET",
            selfReferencingDataPaths: [],
            pluginSpecifiedTemplates: [
              {
                value: true,
              },
            ],
            formData: {
              apiContentType: "none",
            },
          },
          ENTITY_TYPE: "ACTION",
          datasourceUrl: "",
        },
        JSObject1: {
          myVar1: "[]",
          myVar2: "{}",
          myFun1: {
            data: {},
          },
          myFun2: {
            data: {},
          },
          myFun3: {
            data: {},
          },
          body: 'export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\treturn "value"\n\t},\n\tmyFun2: async () => {\n\treturn "value"\n\t},\n\tmyFun3: ()=>{\n\t\tApi1.run()\n\t}\n}',
          ENTITY_TYPE: "JSACTION",
          actionId: "6425db2ef02d0b4638f2a1b3",
        },
        MainContainer: {
          ENTITY_TYPE: "WIDGET",
          widgetName: "MainContainer",
          backgroundColor: "none",
          rightColumn: 4896,
          snapColumns: 64,
          widgetId: "0",
          topRow: 0,
          bottomRow: 380,
          containerStyle: "none",
          snapRows: 124,
          parentRowSpace: 1,
          canExtend: true,
          minHeight: 1292,
          parentColumnSpace: 1,
          leftColumn: 0,
          meta: {},
          type: "CANVAS_WIDGET",
        },
        Button1: {
          ENTITY_TYPE: "WIDGET",
          resetFormOnClick: false,
          boxShadow: "none",
          widgetName: "Button1",
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
          topRow: 15,
          bottomRow: 19,
          parentRowSpace: 10,
          animateLoading: true,
          parentColumnSpace: 7.5625,
          leftColumn: 20,
          text: "{{}} ",
          isDisabled: false,
          key: "lj612scwwe",
          rightColumn: 36,
          isDefaultClickDisabled: true,
          widgetId: "5c14ze6dtv",
          minWidth: 120,
          isVisible: true,
          recaptchaType: "V3",
          isLoading: false,
          responsiveBehavior: "hug",
          disabledWhenInvalid: false,
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          buttonVariant: "PRIMARY",
          placement: "CENTER",
          meta: {},
          type: "BUTTON_WIDGET",
        },
        pageList: [
          {
            pageName: "Page1",
            pageId: "6425db193c6952132524e6e2",
            isDefault: true,
            isHidden: false,
            slug: "page1",
            userPermissions: [
              "read:pages",
              "manage:pages",
              "create:pageActions",
              "delete:pages",
            ],
          },
        ],
        appsmith: {
          user: {
            email: "favour@appsmith.com",
            workspaceIds: [
              "5f7add8687af934ed846dd6a",
              "60fa970664d41f773aab20b8",
              "60a7dccf98f6c43a4b854dcb",
              "61bc28259229e87746b78969",
              "618bdd29da7cd651ee273494",
              "60c1a5273535574772b6377b",
              "6225f57945ea27345b497529",
              "61e7be9feb0501052b9fed2a",
              "622666f2b49d5451b1cd070a",
              "61431979a67ce2289d3c7c6d",
              "627a49410b47255c281326a6",
              "62e7948c4003a7259a3027c8",
            ],
            username: "favour@appsmith.com",
            name: "Favour Ohanekwu",
            photoId: "62a963ac84b91337251a632f",
            enableTelemetry: true,
            emptyInstance: false,
            accountNonExpired: true,
            accountNonLocked: true,
            credentialsNonExpired: true,
            isAnonymous: false,
            isEnabled: true,
            isSuperUser: false,
            isConfigurable: true,
            adminSettingsVisible: false,
          },
          URL: {
            fullPath:
              "https://dev.appsmith.com/app/untitled-application-39/page1-6425db193c6952132524e6e2/edit/widgets/5c14ze6dtv",
            host: "dev.appsmith.com",
            hostname: "dev.appsmith.com",
            queryParams: {},
            protocol: "https:",
            pathname:
              "/app/untitled-application-39/page1-6425db193c6952132524e6e2/edit/widgets/5c14ze6dtv",
            port: "",
            hash: "",
          },
          store: {},
          geolocation: {
            canBeRequested: true,
            currentPosition: {},
          },
          mode: "EDIT",
          theme: {
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
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
      },
      configTree: {
        Api1: {
          actionId: "6425db8b3c6952132524e6ea",
          name: "Api1",
          pluginId: "5ca385dc81b37f0004b4db85",
          pluginType: "API",
          dynamicBindingPathList: [],
          ENTITY_TYPE: "ACTION",
          bindingPaths: {
            "config.path": "TEMPLATE",
            "config.body": "SMART_SUBSTITUTE",
            "config.queryParameters[0].key": "TEMPLATE",
            "config.queryParameters[0].value": "TEMPLATE",
            "config.queryParameters[1].key": "TEMPLATE",
            "config.queryParameters[1].value": "TEMPLATE",
            "config.headers[0].key": "TEMPLATE",
            "config.headers[0].value": "TEMPLATE",
            "config.headers[1].key": "TEMPLATE",
            "config.headers[1].value": "TEMPLATE",
            "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.offset.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.cursor.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.cursor.value":
              "SMART_SUBSTITUTE",
          },
          reactivePaths: {
            data: "TEMPLATE",
            isLoading: "TEMPLATE",
            datasourceUrl: "TEMPLATE",
            "config.path": "TEMPLATE",
            "config.body": "SMART_SUBSTITUTE",
            "config.queryParameters[0].key": "TEMPLATE",
            "config.queryParameters[0].value": "TEMPLATE",
            "config.queryParameters[1].key": "TEMPLATE",
            "config.queryParameters[1].value": "TEMPLATE",
            "config.headers[0].key": "TEMPLATE",
            "config.headers[0].value": "TEMPLATE",
            "config.headers[1].key": "TEMPLATE",
            "config.headers[1].value": "TEMPLATE",
            "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.offset.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.cursor.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.cursor.value":
              "SMART_SUBSTITUTE",
          },
          dependencyMap: {
            "config.body": ["config.pluginSpecifiedTemplates[0].value"],
          },
          logBlackList: {},
        },
        JSObject1: {
          actionId: "6425db2ef02d0b4638f2a1b3",
          meta: {
            myFun1: {
              arguments: [],
              isAsync: false,
              confirmBeforeExecute: false,
            },
            myFun2: {
              arguments: [],
              isAsync: true,
              confirmBeforeExecute: false,
            },
            myFun3: {
              arguments: [],
              isAsync: true,
              confirmBeforeExecute: false,
            },
          },
          name: "JSObject1",
          pluginType: "JS",
          ENTITY_TYPE: "JSACTION",
          bindingPaths: {
            body: "SMART_SUBSTITUTE",
            myVar1: "SMART_SUBSTITUTE",
            myVar2: "SMART_SUBSTITUTE",
            myFun1: "SMART_SUBSTITUTE",
            myFun2: "SMART_SUBSTITUTE",
            myFun3: "SMART_SUBSTITUTE",
          },
          reactivePaths: {
            body: "SMART_SUBSTITUTE",
            myVar1: "SMART_SUBSTITUTE",
            myVar2: "SMART_SUBSTITUTE",
            myFun1: "SMART_SUBSTITUTE",
            myFun2: "SMART_SUBSTITUTE",
            myFun3: "SMART_SUBSTITUTE",
          },
          dynamicBindingPathList: [
            {
              key: "body",
            },
            {
              key: "myVar1",
            },
            {
              key: "myVar2",
            },
            {
              key: "myFun1",
            },
            {
              key: "myFun2",
            },
            {
              key: "myFun3",
            },
          ],
          variables: ["myVar1", "myVar2"],
          dependencyMap: {
            body: ["myFun1", "myFun2", "myFun3"],
          },
        },
        MainContainer: {
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
          dynamicTriggerPathList: [],
          isMetaPropDirty: false,
          widgetId: "0",
        },
        Button1: {
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
              key: "text",
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
          isMetaPropDirty: false,
          widgetId: "5c14ze6dtv",
        },
      },
    } as unknown as {
      unevalTree: UnEvalTree;
      configTree: ConfigTree;
    };
    // This should cause an Edit of Button1.text
    updatedAsyncJSFunctionsInMap = asyncJSFunctionInDataField.handlePathEdit(
      "Button1.text",
      [],
      newDataTree.unevalTree,
      {
        "appsmith.theme.borderRadius.appBorderRadius": [
          "appsmith.theme.borderRadius",
          "Button1.borderRadius",
        ],
        "appsmith.theme.colors.primaryColor": [
          "appsmith.theme.colors",
          "Button1.buttonColor",
        ],
        "appsmith.theme.colors": ["appsmith.theme"],
        "appsmith.theme.borderRadius": ["appsmith.theme"],
        "appsmith.theme": ["appsmith"],
        "JSObject1.myFun2": ["Button1.text", "JSObject1.body", "JSObject1"],
        "Button1.buttonColor": ["Button1"],
        "Button1.borderRadius": ["Button1"],
        "Button1.text": ["Button1"],
        "Api1.run": ["Api1", "JSObject1.myFun3"],
        "JSObject1.myFun1": ["JSObject1.body", "JSObject1"],
        "JSObject1.myFun3": ["JSObject1.body", "JSObject1"],
        "JSObject1.body": ["JSObject1"],
        "JSObject1.myVar1": ["JSObject1"],
        "JSObject1.myVar2": ["JSObject1"],
      } as DependencyMap,
      newDataTree.configTree,
    );
    expect(updatedAsyncJSFunctionsInMap).toStrictEqual(["JSObject1.myFun2"]);

    // Add {{JSObject1.myFun2()}} to Button1.text
    // This should cause an Edit of Button1.text
    updatedAsyncJSFunctionsInMap = asyncJSFunctionInDataField.handlePathEdit(
      "Button1.text",
      ["JSObject1.myFun2"],
      mockDataTree.unevalTree,
      {
        "appsmith.theme.borderRadius.appBorderRadius": [
          "appsmith.theme.borderRadius",
          "Button1.borderRadius",
        ],
        "appsmith.theme.colors.primaryColor": [
          "appsmith.theme.colors",
          "Button1.buttonColor",
        ],
        "appsmith.theme.colors": ["appsmith.theme"],
        "appsmith.theme.borderRadius": ["appsmith.theme"],
        "appsmith.theme": ["appsmith"],
        "Button1.buttonColor": ["Button1"],
        "Button1.borderRadius": ["Button1"],
        "Button1.text": ["Button1"],
        "Api1.run": ["Api1", "JSObject1.myFun3"],
        "JSObject1.myFun1": ["JSObject1.body", "JSObject1"],
        "JSObject1.myFun2": ["JSObject1.body", "JSObject1"],
        "JSObject1.myFun3": ["JSObject1.body", "JSObject1"],
        "JSObject1.body": ["JSObject1"],
        "JSObject1.myVar1": ["JSObject1"],
        "JSObject1.myVar2": ["JSObject1"],
      } as DependencyMap,
      mockDataTree.configTree,
    );
    expect(updatedAsyncJSFunctionsInMap).toStrictEqual(["JSObject1.myFun2"]);

    // Delete JSObject
    newDataTree = {
      unevalTree: {
        Api1: {
          actionId: "6425db8b3c6952132524e6ea",
          run: {},
          clear: {},
          isLoading: false,
          responseMeta: {
            isExecutionSuccess: false,
          },
          config: {
            timeoutInMillisecond: 10000,
            paginationType: "NONE",
            headers: [
              {
                key: "",
                value: "",
              },
              {
                key: "",
                value: "",
              },
            ],
            encodeParamsToggle: true,
            queryParameters: [
              {
                key: "",
                value: "",
              },
              {
                key: "",
                value: "",
              },
            ],
            body: "",
            bodyFormData: [],
            httpMethod: "GET",
            selfReferencingDataPaths: [],
            pluginSpecifiedTemplates: [
              {
                value: true,
              },
            ],
            formData: {
              apiContentType: "none",
            },
          },
          ENTITY_TYPE: "ACTION",
          datasourceUrl: "",
        },
        MainContainer: {
          ENTITY_TYPE: "WIDGET",
          widgetName: "MainContainer",
          backgroundColor: "none",
          rightColumn: 4896,
          snapColumns: 64,
          widgetId: "0",
          topRow: 0,
          bottomRow: 380,
          containerStyle: "none",
          snapRows: 124,
          parentRowSpace: 1,
          canExtend: true,
          minHeight: 1292,
          parentColumnSpace: 1,
          leftColumn: 0,
          meta: {},
          type: "CANVAS_WIDGET",
        },
        Button1: {
          ENTITY_TYPE: "WIDGET",
          resetFormOnClick: false,
          boxShadow: "none",
          widgetName: "Button1",
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
          topRow: 15,
          bottomRow: 19,
          parentRowSpace: 10,
          animateLoading: true,
          parentColumnSpace: 7.5625,
          leftColumn: 20,
          text: "{{JSObject1.myFun2()}} ",
          isDisabled: false,
          key: "lj612scwwe",
          rightColumn: 36,
          isDefaultClickDisabled: true,
          widgetId: "5c14ze6dtv",
          minWidth: 120,
          isVisible: true,
          recaptchaType: "V3",
          isLoading: false,
          responsiveBehavior: "hug",
          disabledWhenInvalid: false,
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          buttonVariant: "PRIMARY",
          placement: "CENTER",
          meta: {},
          type: "BUTTON_WIDGET",
        },
        pageList: [
          {
            pageName: "Page1",
            pageId: "6425db193c6952132524e6e2",
            isDefault: true,
            isHidden: false,
            slug: "page1",
            userPermissions: [
              "read:pages",
              "manage:pages",
              "create:pageActions",
              "delete:pages",
            ],
          },
        ],
        appsmith: {
          user: {
            email: "favour@appsmith.com",
            workspaceIds: [
              "5f7add8687af934ed846dd6a",
              "60fa970664d41f773aab20b8",
              "60a7dccf98f6c43a4b854dcb",
              "61bc28259229e87746b78969",
              "618bdd29da7cd651ee273494",
              "60c1a5273535574772b6377b",
              "6225f57945ea27345b497529",
              "61e7be9feb0501052b9fed2a",
              "622666f2b49d5451b1cd070a",
              "61431979a67ce2289d3c7c6d",
              "627a49410b47255c281326a6",
              "62e7948c4003a7259a3027c8",
            ],
            username: "favour@appsmith.com",
            name: "Favour Ohanekwu",
            photoId: "62a963ac84b91337251a632f",
            enableTelemetry: true,
            emptyInstance: false,
            accountNonExpired: true,
            accountNonLocked: true,
            credentialsNonExpired: true,
            isAnonymous: false,
            isEnabled: true,
            isSuperUser: false,
            isConfigurable: true,
            adminSettingsVisible: false,
          },
          URL: {
            fullPath:
              "https://dev.appsmith.com/app/untitled-application-39/page1-6425db193c6952132524e6e2/edit/widgets/5c14ze6dtv",
            host: "dev.appsmith.com",
            hostname: "dev.appsmith.com",
            queryParams: {},
            protocol: "https:",
            pathname:
              "/app/untitled-application-39/page1-6425db193c6952132524e6e2/edit/widgets/5c14ze6dtv",
            port: "",
            hash: "",
          },
          store: {},
          geolocation: {
            canBeRequested: true,
            currentPosition: {},
          },
          mode: "EDIT",
          theme: {
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
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
      },
      configTree: {
        Api1: {
          actionId: "6425db8b3c6952132524e6ea",
          name: "Api1",
          pluginId: "5ca385dc81b37f0004b4db85",
          pluginType: "API",
          dynamicBindingPathList: [],
          ENTITY_TYPE: "ACTION",
          bindingPaths: {
            "config.path": "TEMPLATE",
            "config.body": "SMART_SUBSTITUTE",
            "config.queryParameters[0].key": "TEMPLATE",
            "config.queryParameters[0].value": "TEMPLATE",
            "config.queryParameters[1].key": "TEMPLATE",
            "config.queryParameters[1].value": "TEMPLATE",
            "config.headers[0].key": "TEMPLATE",
            "config.headers[0].value": "TEMPLATE",
            "config.headers[1].key": "TEMPLATE",
            "config.headers[1].value": "TEMPLATE",
            "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.offset.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.cursor.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.cursor.value":
              "SMART_SUBSTITUTE",
          },
          reactivePaths: {
            data: "TEMPLATE",
            isLoading: "TEMPLATE",
            datasourceUrl: "TEMPLATE",
            "config.path": "TEMPLATE",
            "config.body": "SMART_SUBSTITUTE",
            "config.queryParameters[0].key": "TEMPLATE",
            "config.queryParameters[0].value": "TEMPLATE",
            "config.queryParameters[1].key": "TEMPLATE",
            "config.queryParameters[1].value": "TEMPLATE",
            "config.headers[0].key": "TEMPLATE",
            "config.headers[0].value": "TEMPLATE",
            "config.headers[1].key": "TEMPLATE",
            "config.headers[1].value": "TEMPLATE",
            "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.limitBased.offset.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.previous.cursor.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.limit.value":
              "SMART_SUBSTITUTE",
            "config.pluginSpecifiedTemplates[2].value.cursorBased.next.cursor.value":
              "SMART_SUBSTITUTE",
          },
          dependencyMap: {
            "config.body": ["config.pluginSpecifiedTemplates[0].value"],
          },
          logBlackList: {},
        },
        MainContainer: {
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
          dynamicTriggerPathList: [],
          isMetaPropDirty: false,
          widgetId: "0",
        },
        Button1: {
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
              key: "text",
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
          isMetaPropDirty: false,
          widgetId: "5c14ze6dtv",
        },
      },
    } as unknown as {
      unevalTree: UnEvalTree;
      configTree: ConfigTree;
    };

    updatedAsyncJSFunctionsInMap =
      asyncJSFunctionInDataField.handlePathDeletion(
        "JSObject1",
        newDataTree.unevalTree,
        newDataTree.configTree,
      );
    expect(updatedAsyncJSFunctionsInMap).toStrictEqual([]);
    expect(asyncJSFunctionInDataField.getMap()).toStrictEqual({});
  });
});

describe("isFunctionInvoked", () => {
  it("Works correctly", () => {
    const data = [
      {
        textContent: "{{JSObject1.myFun2()}}",
        expectedResult: true,
      },
      {
        textContent: "{{JSObject1.myFun2.call()}}",
        expectedResult: true,
      },
      {
        textContent: "{{JSObject1.myFun2.apply()}}",
        expectedResult: true,
      },
      {
        textContent: "{{JSObject1.myFun2.bind()}}",
        expectedResult: false,
      },
      {
        textContent: "{{JSObject1.myFun2}}",
        expectedResult: false,
      },
      {
        textContent: "JSObject1.myFun2.apply(){{JSObject1.myFun2}}",
        expectedResult: false,
      },
      {
        textContent: {},
        expectedResult: false,
      },
    ];

    for (const datum of data) {
      const actualResult = isFunctionInvoked(
        "JSObject1.myFun2",
        datum.textContent,
      );
      expect(actualResult).toStrictEqual(datum.expectedResult);
    }
  });
});
