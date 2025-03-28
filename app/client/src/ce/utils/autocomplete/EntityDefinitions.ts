import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import { ENTITY_TYPE, type AppsmithEntity } from "ee/entities/DataTree/types";
import _ from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import type { Def } from "tern";
import type {
  ActionEntity,
  ActionEntityConfig,
  DataTreeEntityConfig,
  WidgetEntityConfig,
} from "ee/entities/DataTree/types";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { eeAppsmithAutocompleteDefs } from "ee/utils/autocomplete/helpers";

export const entityDefinitions = {
  APPSMITH: (entity: AppsmithEntity, extraDefsToDefine: ExtraDef) => {
    const generatedTypeDef = generateTypeDef(
      _.omit(entity, "ENTITY_TYPE", EVALUATION_PATH),
      extraDefsToDefine,
    );

    if (
      typeof generatedTypeDef === "object" &&
      typeof generatedTypeDef.geolocation === "object"
    ) {
      return {
        ...generatedTypeDef,
        "!doc":
          "A global object that provides access to information and functionalities within an application",
        "!url": "https://docs.appsmith.com/reference/appsmith-framework",
        store: {
          ...(generatedTypeDef.store as Def),
          "!doc":
            "Object to access any app-level data or temporary state that is stored on the user's browser",
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/context-object#store-object",
        },
        user: {
          ...(generatedTypeDef.user as Def),
          "!doc":
            "Object that contains the data of the currently authenticated user.",
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/context-object#user-object",
        },
        URL: {
          ...(generatedTypeDef.URL as Def),
          "!doc": "Object containing all the attributes of the current URL",
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/context-object#url-object",
        },
        theme: {
          ...(generatedTypeDef.theme as Def),
          "!doc":
            "Object containing the details of the theme properties applied to the application",
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/context-object#theme-object",
        },
        mode: {
          "!type": generatedTypeDef.mode as Def,
          "!doc":
            "An enum that contains whether the app runs in view or edit mode. It takes the values VIEW or EDIT",
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/context-object#mode-enum",
        },
        geolocation: {
          ...generatedTypeDef.geolocation,
          "!doc":
            "Object containing functions that allow you to retrieve the current user's location and the coordinates received from the user's device using the Geolocation API.",
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/context-object#geolocation-object",
          getCurrentPosition: {
            "!type":
              "fn(onSuccess: fn() -> void, onError: fn() -> void, options: object) -> +Promise|void",
            "!url":
              "https://docs.appsmith.com/reference/appsmith-framework/context-object#geolocationgetcurrentposition",
          },
          watchPosition: {
            "!type": "fn(options: object) -> void",
            "!url":
              "https://docs.appsmith.com/reference/appsmith-framework/context-object#geolocationwatchposition",
          },
          clearWatch: {
            "!type": "fn() -> +Promise|void",
            "!url":
              "https://docs.appsmith.com/reference/appsmith-framework/context-object#geolocationclearwatch",
          },
        },
        ...eeAppsmithAutocompleteDefs(generatedTypeDef),
      };
    }

    return generatedTypeDef;
  },
  ACTION: (entity: ActionEntity, extraDefsToDefine: ExtraDef) => {
    const dataDef = generateTypeDef(entity.data, extraDefsToDefine);
    let responseMetaDef = generateTypeDef(
      entity.responseMeta,
      extraDefsToDefine,
    );

    if (_.isString(responseMetaDef)) {
      responseMetaDef = {
        "!type": responseMetaDef,
      };
    }

    let dataCustomDef: Def = {
      "!doc":
        "A read-only property that contains the response body from the last successful execution of this query.",
      "!url":
        "https://docs.appsmith.com/reference/appsmith-framework/query-object#data-array",
    };

    if (_.isString(dataDef)) {
      dataCustomDef["!type"] = dataDef;
    } else {
      dataCustomDef = { ...dataCustomDef, ...dataDef };
    }

    return {
      "!doc":
        "Object that contains the properties required to run queries and access the query data.",
      "!url":
        "https://docs.appsmith.com/reference/appsmith-framework/query-object",
      isLoading: {
        "!type": "bool",
        "!doc":
          "Boolean that indicates whether the query is currently being executed.",
      },
      data: dataCustomDef,
      responseMeta: {
        "!doc":
          "Object that contains details about the response, such as the status code, headers, and other relevant information related to the query's execution and the server's response.",
        "!url":
          "https://docs.appsmith.com/reference/appsmith-framework/query-object#responsemeta-object",
        ...responseMetaDef,
      },
      run: {
        "!type": "fn(params?: {}) -> +Promise",
        "!url":
          "https://docs.appsmith.com/reference/appsmith-framework/query-object#queryrun",
        "!doc": "Executes the query with the given parameters.",
      },
      clear: {
        "!type": "fn() -> +Promise",
        "!url":
          "https://docs.appsmith.com/reference/appsmith-framework/query-object#queryclear",
        "!doc": "Clears the query data.",
      },
    };
  },
};

/*
  $__name__$ is just to reduce occurrences of global def showing up in auto completion for user as `$` is less commonly used as entityName/

  GLOBAL_DEFS are maintained to support definition for array of objects which currently aren't supported by our generateTypeDef.
*/
export const GLOBAL_DEFS = {
  $__dropdownOption__$: {
    label: "string",
    value: "string",
  },
  $__dropdrowOptionWithChildren__$: {
    label: "string",
    value: "string",
    children: "[$__dropdrowOptionWithChildren__$]",
  },
  $__chartDataPoint__$: {
    x: "string",
    y: "string",
  },
  $__file__$: {
    data: "string",
    dataFormat: "string",
    name: "text",
    type: "file",
  },
  $__mapMarker__$: {
    lat: "number",
    long: "number",
    title: "string",
    description: "string",
  },
};

export const GLOBAL_FUNCTIONS = {
  "!name": "DATA_TREE.APPSMITH.FUNCTIONS",
  navigateTo: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/navigate-to",
    "!doc":
      "Enables navigation between the internal pages of the App or to an external URL.",
    "!type":
      "fn(pageNameOrUrl: string, params: {}, target?: string) -> +Promise",
  },
  showAlert: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/show-alert",
    "!doc":
      "Displays a temporary toast-style alert message to the user for precisely 5 seconds. The duration of the alert message can't be modified.",
    "!type": "fn(message: string, style: string) -> +Promise",
  },
  showModal: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/show-modal",
    "!doc":
      "Opens an existing Modal widget and bring it into focus on the page",
    "!type": "fn(modalName: string) -> +Promise",
  },
  closeModal: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/close-modal",
    "!doc": "Close a modal",
    "!type": "fn(modalName: string) -> +Promise",
  },
  storeValue: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/store-value",
    "!doc":
      "Stores the data in the browser's local storage as key-value pairs that represent storage objects and can be later accessed anywhere in the application via <code>appsmith.store</code>.",
    "!type": "fn(key: string, value: any, persist?: bool) -> +Promise",
  },
  removeValue: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/remove-value",
    "!doc": "Remove key value data locally",
    "!type": "fn(key: string) -> +Promise",
  },
  clearStore: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/clear-store",
    "!doc": "Clear all key value data locally",
    "!type": "fn() -> +Promise",
  },
  download: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/download",
    "!doc":
      "Download any data as a file, leveraging the capabilities of the downloadjs library.",
    "!type":
      "fn(data: string|+Blob, fileName: string, fileType?: string) -> +Promise",
  },
  copyToClipboard: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/copy-to-clipboard",
    "!doc": "Copies the given text to clipboard",
    "!type": "fn(data: string, options: object) -> +Promise",
  },
  resetWidget: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/reset-widget",
    "!doc":
      "Resets a widget to its default state. All user input changes are reverted and its properties' default values are applied.",
    "!type": "fn(widgetName: string, resetChildren: bool) -> +Promise",
  },
  setInterval: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/intervals-time-events",
    "!doc": "Executes a function at a given interval",
    "!type":
      "fn(callback: fn() -> void, interval: number, id?: string) -> number",
  },
  clearInterval: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/clear-interval",
    "!doc": "Stop executing a setInterval with id",
    "!type": "fn(id: string) -> void",
  },
  postWindowMessage: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/post-message",
    "!doc":
      "Establish cross-origin communication between Window objects/page and iframes",
    "!type": "fn(message: unknown, source: string, targetOrigin: string)",
  },
  logoutUser: {
    "!url":
      "https://docs.appsmith.com/reference/appsmith-framework/widget-actions/logout-user",
    "!doc": "Logout user",
    "!type": "fn(redirectURL: string) -> void",
  },
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ternDocsInfo: Record<string, any> = {
  showAlert: {
    exampleArgs: [
      "'This is a success message', 'success'",
      "'This is an error message', 'error'",
    ],
  },
  showModal: {
    exampleArgs: ["Modal1.name"],
  },
  closeModal: {
    exampleArgs: ["Modal1.name"],
  },
  navigateTo: {
    exampleArgs: [
      "'Page1', { id: 1 }",
      "'https://appsmith.com', {}, 'NEW_WINDOW'",
    ],
  },
  copyToClipboard: {
    exampleArgs: ["'Hello'"],
  },
  download: {
    exampleArgs: [
      "'Hello World', 'hello.txt', 'text/plain'",
      "FilePicker1.files[0].data, 'data.json'",
    ],
  },
  storeValue: {
    exampleArgs: ["'key', 'value'"],
  },
  removeValue: {
    exampleArgs: ["'key'"],
  },
  clearStore: {
    exampleArgs: [""],
  },
  resetWidget: {
    exampleArgs: ["'Table1', false"],
  },
  setInterval: {
    exampleArgs: ["() => showAlert('Hello'), 1000, 'id'"],
  },
  clearInterval: {
    exampleArgs: ["'id'"],
  },
  postWindowMessage: {
    exampleArgs: ["message, 'Iframe1', '*'"],
  },
  logoutUser: {
    exampleArgs: ["url"],
  },
};

export type EntityDefinitionsOptions = keyof typeof entityDefinitions;

export const getEachEntityInformation = {
  [ENTITY_TYPE.ACTION]: (
    entity: DataTreeEntityConfig,
    entityInformation: FieldEntityInformation,
  ): FieldEntityInformation => {
    const actionEntity = entity as ActionEntityConfig;

    entityInformation.entityId = actionEntity.actionId;

    return entityInformation;
  },
  [ENTITY_TYPE.WIDGET]: (
    entity: DataTreeEntityConfig,
    entityInformation: FieldEntityInformation,
    propertyPath: string,
  ): FieldEntityInformation => {
    const widgetEntity = entity as WidgetEntityConfig;
    const isTriggerPath = widgetEntity.triggerPaths[propertyPath];

    entityInformation.entityId = widgetEntity.widgetId;

    if (isTriggerPath)
      entityInformation.expectedType = AutocompleteDataType.FUNCTION;

    entityInformation.isTriggerPath = isTriggerPath;
    entityInformation.widgetType = widgetEntity.type;

    return entityInformation;
  },
  [ENTITY_TYPE.JSACTION]: (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entity: DataTreeEntityConfig,
    entityInformation: FieldEntityInformation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    propertyPath: string,
  ): FieldEntityInformation => {
    entityInformation.isTriggerPath = true;

    return entityInformation;
  },
};
