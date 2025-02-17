import { filterInternalProperties } from "..";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "ee/entities/DataTree/types";
import type {
  DataTreeEntityConfig,
  DataTreeEntityObject,
  WidgetEntityConfig,
} from "ee/entities/DataTree/types";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import InputWidget from "widgets/InputWidgetV2";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";

describe("filterInternalProperties tests", () => {
  beforeAll(() => {
    registerWidgets([InputWidget]);
  });

  it("filter widget properties", () => {
    const dataTreeEntity: DataTreeEntityObject = {
      widgetId: "yolo",
      widgetName: "Input1",
      parentId: "123",
      renderMode: "CANVAS",
      text: "yo",
      type: "INPUT_WIDGET_V2",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      parentColumnSpace: 1,
      parentRowSpace: 2,
      leftColumn: 2,
      rightColumn: 3,
      topRow: 1,
      bottomRow: 2,
      isLoading: false,
      version: 1,
      meta: {},
      isVisible: false,
      isDisabled: false,
      isValid: true,
    };
    const dataTreeEntityConfig: WidgetEntityConfig = {
      bindingPaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        onTextChange: true,
      },
      validationPaths: {},
      logBlackList: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      privateWidgets: {},
      defaultMetaProps: [],
      widgetId: "yolo",
      widgetName: "Input1",
      type: "INPUT_WIDGET_V2",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    };
    const dataTree = {
      Input1: dataTreeEntity,
    };

    const configTree = {
      Input1: dataTreeEntityConfig,
    };
    const peekData = filterInternalProperties(
      "Input1",
      dataTree["Input1"],
      [],
      dataTree,
      configTree,
    );

    expect(peekData).toStrictEqual({
      isDisabled: false,
      isValid: true,
      isVisible: false,
      text: "yo",
    });
  });

  it("filter jsObject properties", () => {
    const jsActions = [
      {
        isLoading: false,
        config: {
          id: "655b392ca357d11c50eedc7f",
          applicationId: "654b35d925f7f47198610ffb",
          workspaceId: "64a561f4a272dc36bd584a6f",
          name: "jsObject1",
          pageId: "654b35da25f7f47198610fff",
          pluginId: "644b84dd80127e0eff78a744",
          pluginType: "JS",
          actionIds: [],
          archivedActionIds: [],
          actions: [],
          archivedActions: [],
          body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\tinputs.email11\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
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
          userPermissions: [
            "read:actions",
            "delete:actions",
            "execute:actions",
            "manage:actions",
          ],
        },
      },
    ] as unknown as JSCollectionData[];

    const jsObject1 = {
      myVar1: [],
      myVar2: {},
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\tinputs.email11\n\t\t//\twrite code here\n\t\t//\tJSObject1.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
      actionId: "655b392ca357d11c50eedc7f",
      __evaluation__: {
        errors: {
          myVar2: [],
          myVar1: [],
          myFun2: [],
          myFun1: [],
          body: [],
        },
        evaluatedValues: {
          myVar2: {},
          myVar1: [],
        },
      },
    } as unknown as DataTreeEntityObject;

    const jsObject1Config = {
      actionId: "655b392ca357d11c50eedc7f",
      name: "JSObject1",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
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
      ],
      variables: ["myVar1", "myVar2"],
      dependencyMap: {
        body: [],
      },
    } as unknown as DataTreeEntityConfig;

    const dataTree = {
      jsObject1: jsObject1,
    };

    const configTree = {
      jsObject1: jsObject1Config,
    };

    const peekData = filterInternalProperties(
      "jsObject1",
      dataTree["jsObject1"],
      jsActions,
      dataTree,
      configTree,
    );

    expect(peekData).toStrictEqual({
      myVar1: [],
      myVar2: {},
    });
  });
});
