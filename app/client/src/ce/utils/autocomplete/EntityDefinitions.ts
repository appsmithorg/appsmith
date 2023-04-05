import type { ExtraDef } from "utils/autocomplete/dataTreeTypeDefCreator";
import { generateTypeDef } from "utils/autocomplete/dataTreeTypeDefCreator";
import type { AppsmithEntity } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import type { Def } from "tern";
import type { ActionEntity } from "entities/DataTree/types";

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
            "The user's geo location information. Only available when requested",
          "!url":
            "https://docs.appsmith.com/v/v1.2.1/framework-reference/geolocation",
          getCurrentPosition:
            "fn(onSuccess: fn() -> void, onError: fn() -> void, options: object) -> void",
          watchPosition: "fn(options: object) -> void",
          clearWatch: "fn() -> void",
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
      "!url": "https://docs.appsmith.com/v/v1.2.1/framework-reference/run",
      isLoading: "bool",
      data,
      responseMeta: {
        "!doc": "The response meta of the action",
        "!type": "?",
      },
      run: "fn(params: ?) -> +Promise[:t=[!0.<i>.:t]]",
      clear: "fn() -> +Promise[:t=[!0.<i>.:t]]",
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
      "fn(pageNameOrUrl: string, params: {}, target?: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  showAlert: {
    "!doc": "Show a temporary notification style message to the user",
    "!type": "fn(message: string, style: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  showModal: {
    "!doc": "Open a modal",
    "!type": "fn(modalName: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  closeModal: {
    "!doc": "Close a modal",
    "!type": "fn(modalName: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  storeValue: {
    "!doc": "Store key value data locally",
    "!type": "fn(key: string, value: any) -> +Promise[:t=[!0.<i>.:t]]",
  },
  removeValue: {
    "!doc": "Remove key value data locally",
    "!type": "fn(key: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  clearStore: {
    "!doc": "Clear all key value data locally",
    "!type": "fn() -> +Promise[:t=[!0.<i>.:t]]",
  },
  download: {
    "!doc": "Download anything as a file",
    "!type":
      "fn(data: any, fileName: string, fileType?: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  copyToClipboard: {
    "!doc": "Copy text to clipboard",
    "!type": "fn(data: string, options: object) -> +Promise[:t=[!0.<i>.:t]]",
  },
  resetWidget: {
    "!doc": "Reset widget values",
    "!type":
      "fn(widgetName: string, resetChildren: boolean) -> +Promise[:t=[!0.<i>.:t]]",
  },
  setInterval: {
    "!doc": "Execute triggers at a given interval",
    "!type": "fn(callback: fn, interval: number, id?: string) -> void",
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

export type EntityDefinitionsOptions = keyof typeof entityDefinitions;
