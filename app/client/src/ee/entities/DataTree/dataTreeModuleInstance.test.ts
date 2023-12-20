import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import { generateJSModuleInstance } from "./dataTreeModuleInstance";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

describe("generateModuleInstance", () => {
  it("generate JS module instance in data tree", () => {
    const moduleInstance = {
      id: "6540bbde843ed81a8e63f9b3",
      sourceModuleId: "653f85768d54d6754761e7b4",
      type: MODULE_TYPE.JS,
      name: "JSModule1",
      contextId: "653f85768d54d6754761e7b7",
      contextType: ModuleInstanceCreatorType.PAGE,
      inputs: {
        email: "{{appsmith.user.email}}",
        userId: "testUser",
      },
      userPermissions: [],
      jsonPathKeys: [],
    };
    const moduleInstanceEntities = {
      actions: [],
      jsCollections: [
        {
          isLoading: false,
          config: {
            id: "656593725c83d116cf51885b",
            moduleInstanceId: "6540bbde843ed81a8e63f9b3",
            sourceModuleId: "653f85768d54d6754761e7b4",
            applicationId: "65607e7e5c83d116cf518729",
            workspaceId: "65607e2e5c83d116cf51870d",
            name: "JSModule1_JSObject1",
            pageId: "65607e7e5c83d116cf51872d",
            pluginId: "65605b2c463f104b2de6ca0b",
            pluginType: "JS",
            actionIds: [],
            archivedActionIds: [],
            isPublic: true,
            actions: [
              {
                id: "656593725c83d116cf518856",
                applicationId: "65607e7e5c83d116cf518729",
                workspaceId: "65607e2e5c83d116cf51870d",
                pluginType: "JS",
                pluginId: "65605b2c463f104b2de6ca0b",
                name: "myFun2",
                fullyQualifiedName: "JSModule1_JSObject1.myFun2",
                datasource: {
                  userPermissions: [],
                  name: "UNUSED_DATASOURCE",
                  pluginId: "65605b2c463f104b2de6ca0b",
                  workspaceId: "65607e2e5c83d116cf51870d",
                  datasourceStorages: {},
                  messages: [],
                  isValid: true,
                  new: true,
                },
                pageId: "65607e7e5c83d116cf51872d",
                collectionId: "656593725c83d116cf51885b",
                actionConfiguration: {
                  timeoutInMillisecond: 10000,
                  paginationType: "NONE",
                  encodeParamsToggle: true,
                  body: "async function () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}",
                  selfReferencingDataPaths: [],
                  jsArguments: [],
                },
                executeOnLoad: false,
                clientSideExecution: true,
                dynamicBindingPathList: [
                  {
                    key: "body",
                  },
                ],
                isValid: true,
                invalids: [],
                messages: [],
                jsonPathKeys: [
                  "async function () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}",
                ],
                confirmBeforeExecute: false,
                userPermissions: [
                  "read:actions",
                  "delete:actions",
                  "execute:actions",
                  "manage:actions",
                ],
                validName: "JSModule1_JSObject1.myFun2",
                entityReferenceType: "JSACTION",
                configurationPath:
                  "JSModule1_JSObject1.myFun2.actionConfiguration",
                executableConfiguration: {
                  timeoutInMillisecond: 10000,
                  paginationType: "NONE",
                  encodeParamsToggle: true,
                  body: "async function () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}",
                  selfReferencingDataPaths: [],
                  jsArguments: [],
                },
                selfReferencingDataPaths: [],
                dslExecutable: {
                  id: "656593725c83d116cf518856",
                  name: "JSModule1_JSObject1.myFun2",
                  collectionId: "656593725c83d116cf51885b",
                  clientSideExecution: true,
                  confirmBeforeExecute: false,
                  pluginType: "JS",
                  jsonPathKeys: [
                    "async function () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}",
                  ],
                  timeoutInMillisecond: 10000,
                },
              },
              {
                id: "656593725c83d116cf518857",
                applicationId: "65607e7e5c83d116cf518729",
                workspaceId: "65607e2e5c83d116cf51870d",
                pluginType: "JS",
                pluginId: "65605b2c463f104b2de6ca0b",
                name: "myFun1",
                fullyQualifiedName: "JSModule1_JSObject1.myFun1",
                datasource: {
                  userPermissions: [],
                  name: "UNUSED_DATASOURCE",
                  pluginId: "65605b2c463f104b2de6ca0b",
                  workspaceId: "65607e2e5c83d116cf51870d",
                  datasourceStorages: {},
                  messages: [],
                  isValid: true,
                  new: true,
                },
                pageId: "65607e7e5c83d116cf51872d",
                collectionId: "656593725c83d116cf51885b",
                actionConfiguration: {
                  timeoutInMillisecond: 10000,
                  paginationType: "NONE",
                  encodeParamsToggle: true,
                  body: "function (){\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t}",
                  selfReferencingDataPaths: [],
                  jsArguments: [],
                },
                executeOnLoad: false,
                clientSideExecution: true,
                dynamicBindingPathList: [
                  {
                    key: "body",
                  },
                ],
                isValid: true,
                invalids: [],
                messages: [],
                jsonPathKeys: [
                  "function (){\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t}",
                ],
                confirmBeforeExecute: false,
                userPermissions: [
                  "read:actions",
                  "delete:actions",
                  "execute:actions",
                  "manage:actions",
                ],
                validName: "JSModule1_JSObject1.myFun1",
                entityReferenceType: "JSACTION",
                configurationPath:
                  "JSModule1_JSObject1.myFun1.actionConfiguration",
                executableConfiguration: {
                  timeoutInMillisecond: 10000,
                  paginationType: "NONE",
                  encodeParamsToggle: true,
                  body: "function (){\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t}",
                  selfReferencingDataPaths: [],
                  jsArguments: [],
                },
                selfReferencingDataPaths: [],
                dslExecutable: {
                  id: "656593725c83d116cf518857",
                  name: "JSModule1_JSObject1.myFun1",
                  collectionId: "656593725c83d116cf51885b",
                  clientSideExecution: true,
                  confirmBeforeExecute: false,
                  pluginType: "JS",
                  jsonPathKeys: [
                    "function (){\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t}",
                  ],
                  timeoutInMillisecond: 10000,
                },
              },
            ],
            archivedActions: [],
            body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\treturn \"hey this is coming from js mdodule\";\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
            variables: [
              {
                name: "myVar1",
                value: [],
              },
              {
                name: "myVar2",
                value: {},
              },
            ],
            userPermissions: [
              "read:actions",
              "delete:actions",
              "execute:actions",
              "manage:actions",
            ],
          },
        } as unknown as JSCollectionData,
      ],
    };
    const expectedUnevalEntity = {
      myVar1: "{{JSModule1_JSObject1.myVar1}}",
      myVar2: "{{JSModule1_JSObject1.myVar2}}",
      myFun2: {
        data: "{{JSModule1_JSObject1.myFun2.data}}",
      },
      myFun1: {
        data: "{{JSModule1_JSObject1.myFun1.data}}",
      },
      actionId: "656593725c83d116cf51885b",
      ENTITY_TYPE: "MODULE_INSTANCE",
      type: MODULE_TYPE.JS,
      moduleId: "653f85768d54d6754761e7b4",
      moduleInstanceId: "6540bbde843ed81a8e63f9b3",
      inputs: {
        email: "{{appsmith.user.email}}",
        userId: "testUser",
      },
    };

    const expectedConfigEntity = {
      actionId: "656593725c83d116cf51885b",
      ENTITY_TYPE: "MODULE_INSTANCE",
      type: MODULE_TYPE.JS,
      moduleId: "653f85768d54d6754761e7b4",
      moduleInstanceId: "6540bbde843ed81a8e63f9b3",
      name: "JSModule1",
      bindingPaths: {
        "inputs.email": "TEMPLATE",
        "inputs.userId": "TEMPLATE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        "inputs.email": "TEMPLATE",
        "inputs.userId": "TEMPLATE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
      },
      publicEntityName: "JSModule1_JSObject1",
      variables: ["myVar1", "myVar2"],
      dynamicBindingPathList: [
        {
          key: "inputs.email",
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
      ],
      dependencyMap: {
        JSModule1: ["JSModule1_JSObject1"],
      },
      meta: {
        myFun2: {
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun1: {
          arguments: [],
          confirmBeforeExecute: false,
        },
      },
    };

    const resultData = generateJSModuleInstance(
      moduleInstance,
      moduleInstanceEntities,
    );
    expect(resultData.unEvalEntity).toStrictEqual(expectedUnevalEntity);
    expect(resultData.configEntity).toStrictEqual(expectedConfigEntity);
  });
});
