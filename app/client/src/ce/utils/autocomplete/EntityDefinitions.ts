import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import type { AppsmithEntity } from "@appsmith/entities/DataTree/types";
import _ from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import type { Def } from "tern";
import type { ActionEntity } from "@appsmith/entities/DataTree/types";

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
      };
    }
    return generatedTypeDef;
  },
  ACTION: (entity: ActionEntity, extraDefsToDefine: ExtraDef) => {
    const dataDef = generateTypeDef(entity.data, extraDefsToDefine);

    let data: Def = {
      "!doc": "The response of the action",
    };

    if (_.isString(dataDef)) {
      data["!type"] = dataDef;
    } else {
      data = { ...data, ...dataDef };
    }
    return {
      "!doc":
        "Actions allow you to connect your widgets to your backend data in a secure manner.",
      "!url":
        "https://docs.appsmith.com/reference/appsmith-framework/query-object",
      isLoading: "bool",
      data,
      responseMeta: {
        "!doc": "The response meta of the action",
        "!type": "?",
      },
      run: "fn(params: ?) -> +Promise",
      clear: "fn() -> +Promise",
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
    "!doc": "Action to navigate the user to another page or url",
    "!type":
      "fn(pageNameOrUrl: string, params: {}, target?: string) -> +Promise",
  },
  showAlert: {
    "!doc": "Show a temporary notification style message to the user",
    "!type": "fn(message: string, style: string) -> +Promise",
  },
  showModal: {
    "!doc": "Open a modal",
    "!type": "fn(modalName: string) -> +Promise",
  },
  closeModal: {
    "!doc": "Close a modal",
    "!type": "fn(modalName: string) -> +Promise",
  },
  storeValue: {
    "!doc": "Store key value data locally",
    "!type": "fn(key: string, value: any) -> +Promise",
  },
  removeValue: {
    "!doc": "Remove key value data locally",
    "!type": "fn(key: string) -> +Promise",
  },
  clearStore: {
    "!doc": "Clear all key value data locally",
    "!type": "fn() -> +Promise",
  },
  download: {
    "!doc": "Download anything as a file",
    "!type":
      "fn(data: string|+Blob, fileName: string, fileType?: string) -> +Promise",
  },
  copyToClipboard: {
    "!doc": "Copy text to clipboard",
    "!type": "fn(data: string, options: object) -> +Promise",
  },
  resetWidget: {
    "!doc": "Reset widget values",
    "!type": "fn(widgetName: string, resetChildren: bool) -> +Promise",
  },
  setInterval: {
    "!doc": "Execute triggers at a given interval",
    "!type":
      "fn(callback: fn() -> void, interval: number, id?: string) -> number",
  },
  clearInterval: {
    "!doc": "Stop executing a setInterval with id",
    "!type": "fn(id: string) -> void",
  },
  postWindowMessage: {
    "!doc":
      "Establish cross-origin communication between Window objects/page and iframes",
    "!type": "fn(message: unknown, source: string, targetOrigin: string)",
  },
};

export const getPropsForJSActionEntity = ({
  config,
  data,
}: JSCollectionData): Record<string, string> => {
  const properties: Record<string, any> = {};
  const actions = config.actions;
  if (actions && actions.length > 0)
    for (let i = 0; i < config.actions.length; i++) {
      const action = config.actions[i];
      properties[action.name + "()"] = "Function";
      if (data && action.id in data) {
        properties[action.name + ".data"] = data[action.id];
      }
    }
  const variablesProps = config.variables;
  if (variablesProps && variablesProps.length > 0) {
    for (let i = 0; i < variablesProps.length; i++) {
      const variableProp = variablesProps[i];
      properties[variableProp.name] = variableProp.value;
    }
  }
  return properties;
};

export const ternDocsInfo: Record<string, any> = {
  showAlert: {
    content: "Show a temporary notification style message to the user",
    exampleArgs: [
      "'This is a success message', 'success'",
      "'This is an error message', 'error'",
    ],
  },
  showModal: {
    content: "Open a modal",
    exampleArgs: ["'Modal1'"],
  },
  closeModal: {
    content: "Close a modal",
    exampleArgs: ["'Modal1'"],
  },
  navigateTo: {
    content: "Action to navigate the user to another page or url",
    exampleArgs: [
      "'Page1', { id: 1 }",
      "'https://appsmith.com', {}, 'NEW_WINDOW'",
    ],
  },
  copyToClipboard: {
    content: "Copy text to clipboard",
    exampleArgs: ["'Hello'"],
  },
  download: {
    content: "Download anything as a file",
    exampleArgs: [
      "'Hello World', 'hello.txt', 'text/plain'",
      "FilePicker1.files[0].data, 'data.json'",
    ],
  },
  storeValue: {
    content: "Store key value data locally",
    exampleArgs: ["'key', 'value'"],
  },
  removeValue: {
    content: "Remove key value data locally",
    exampleArgs: ["'key'"],
  },
  clearStore: {
    content: "Clear all key value data locally",
    exampleArgs: [""],
  },
  resetWidget: {
    content: "Reset widget values",
    exampleArgs: ["'Table1', false"],
  },
  setInterval: {
    content: "Calls a function at a given interval",
    exampleArgs: ["() => showAlert('Hello'), 1000, 'id'"],
  },
  clearInterval: {
    content: "Stop executing a setInterval with id",
    exampleArgs: ["'id'"],
  },
  postWindowMessage: {
    content:
      "Establish cross-origin communication between Window objects/page and iframes",
    exampleArgs: ["message, 'Iframe1', '*'"],
  },
};

export type EntityDefinitionsOptions = keyof typeof entityDefinitions;
