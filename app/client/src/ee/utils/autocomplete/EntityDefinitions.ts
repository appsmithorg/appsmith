export * from "ce/utils/autocomplete/EntityDefinitions";
import { getAppsmithConfigs } from "@appsmith/configs";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import {
  type DataTreeEntityConfig,
  ENTITY_TYPE,
  type JSModuleInstanceEntity,
  type JSModuleInstanceEntityConfig,
} from "@appsmith/entities/DataTree/types";
import {
  GLOBAL_FUNCTIONS as CE_GLOBAL_FUNCTIONS,
  getEachEntityInformation as CE_getEachEntityInformation,
} from "ce/utils/autocomplete/EntityDefinitions";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { isString } from "lodash";
import type { Def } from "tern";
import {
  generateJSFunctionTypeDef,
  generateTypeDef,
} from "utils/autocomplete/defCreatorUtils";

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
    const data = !!entity && entity.data;
    const dataDef = generateTypeDef(data);
    let dataCustomDef: Def = {
      "!doc":
        "A read-only property that contains the response body from the last successful execution of this query.",
      "!url":
        "https://docs.appsmith.com/reference/appsmith-framework/query-object#data-array",
    };
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
  [MODULE_TYPE.JS]: (props: Record<string, any>) => {
    const { configTree, entity, entityName, extraDefsToDefine, jsData } = props;
    const entityConfig = configTree[entityName] as JSModuleInstanceEntityConfig;
    const metaObj = entityConfig.meta;
    const jsPropertiesDef: Def = {};

    for (const funcName in metaObj) {
      const funcTypeDef = generateJSFunctionTypeDef(
        jsData,
        `${entityName}.${funcName}`,
        extraDefsToDefine,
      );
      jsPropertiesDef[funcName] = funcTypeDef;
      // To also show funcName.data in autocompletion hint, we explictly add it here
      jsPropertiesDef[`${funcName}.data`] = funcTypeDef.data;
    }

    for (let i = 0; i < entityConfig?.variables?.length; i++) {
      const varKey = entityConfig?.variables[i];
      const varValue = (entity as JSModuleInstanceEntity)[varKey];
      jsPropertiesDef[varKey] = generateTypeDef(varValue, extraDefsToDefine);
    }

    return jsPropertiesDef;
  },
};

export const getEachEntityInformation = {
  ...CE_getEachEntityInformation,
  [ENTITY_TYPE.MODULE_INPUT]: (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entity: DataTreeEntityConfig,
    entityInformation: FieldEntityInformation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    propertyPath: string,
  ): FieldEntityInformation => {
    entityInformation.isTriggerPath = false;
    return entityInformation;
  },
  [ENTITY_TYPE.MODULE_INSTANCE]: (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entity: DataTreeEntityConfig,
    entityInformation: FieldEntityInformation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    propertyPath: string,
  ): FieldEntityInformation => {
    entityInformation.isTriggerPath = false;
    return entityInformation;
  },
};
