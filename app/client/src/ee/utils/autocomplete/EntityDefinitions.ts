export * from "ce/utils/autocomplete/EntityDefinitions";

import { getAppsmithConfigs } from "@appsmith/configs";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { GLOBAL_FUNCTIONS as CE_GLOBAL_FUNCTIONS } from "ce/utils/autocomplete/EntityDefinitions";
import { isString } from "lodash";
import type { Def } from "tern";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";

const { cloudHosting } = getAppsmithConfigs();

export const GLOBAL_FUNCTIONS = {
  ...CE_GLOBAL_FUNCTIONS,
  ...(!cloudHosting && {
    windowMessageListener: {
      "!doc": "Subscribe to messages from parent window",
      "!type": "fn(origin: string, callback: fn) -> void",
    },
    unlistenWindowMessage: {
      "!doc": "Unsubscribe to messages from parent window",
      "!type": "fn(origin: string) -> void",
    },
  }),
};

export const ModuleInstanceDefMap = {
  [MODULE_TYPE.QUERY]: (props: Record<string, any>) => {
    const { entity } = props;
    const dataDef = generateTypeDef(entity.data);
    let dataCustomDef: Def = {
      "!doc":
        "A read-only property that contains the response body from the last successful execution of this query.",
      "!url":
        "https://docs.appsmith.com/reference/appsmith-framework/query-object#data-array",
    };
    let inputsDef = generateTypeDef(entity.inputs);

    if (isString(inputsDef)) {
      inputsDef = {
        "!type": inputsDef,
      };
    }
    if (isString(dataDef)) {
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
      inputs: inputsDef,
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
  [MODULE_TYPE.JS]: () => {},
};
