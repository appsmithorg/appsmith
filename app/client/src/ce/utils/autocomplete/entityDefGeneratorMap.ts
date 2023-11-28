import {
  type WidgetEntityConfig,
  type JSActionEntityConfig,
  type WidgetEntity,
  type ActionEntity,
  type AppsmithEntity,
  type JSActionEntity,
  ENTITY_TYPE_VALUE,
} from "@appsmith/entities/DataTree/types";
import type {
  ConfigTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import { isFunction } from "lodash";
import { entityDefinitions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type { Def } from "tern";
import type { DataTreeDefEntityInformation } from "utils/autocomplete/CodemirrorTernService";
import WidgetFactory from "WidgetProvider/factory";
import {
  addSettersToDefinitions,
  generateJSFunctionTypeDef,
  generateTypeDef,
  flattenDef,
} from "utils/autocomplete/defCreatorUtils";

export type EntityMap = Map<string, DataTreeDefEntityInformation>;

interface DefGeneratorProps {
  entity: DataTreeEntity;
  configTree: ConfigTree;
  entityName: string;
  extraDefsToDefine: Def;
  entityMap: EntityMap;
  def: Def;
  jsData: Record<string, unknown>;
}

export type EntityDefGeneratorMap = Record<
  string,
  (props: DefGeneratorProps) => void
>;

export const entityDefGeneratorMap: EntityDefGeneratorMap = {
  [ENTITY_TYPE_VALUE.ACTION]: (props) => {
    const { def, entity, entityMap, entityName, extraDefsToDefine } = props;
    def[entityName] = entityDefinitions.ACTION(
      entity as ActionEntity,
      extraDefsToDefine,
    );
    flattenDef(def, entityName);
    entityMap.set(entityName, {
      type: ENTITY_TYPE_VALUE.ACTION,
      subType: "ACTION",
    });
  },
  [ENTITY_TYPE_VALUE.APPSMITH]: (props) => {
    const { def, entity, entityMap, extraDefsToDefine } = props;
    def.appsmith = entityDefinitions.APPSMITH(
      entity as AppsmithEntity,
      extraDefsToDefine,
    );
    entityMap.set("appsmith", {
      type: ENTITY_TYPE_VALUE.APPSMITH,
      subType: ENTITY_TYPE_VALUE.APPSMITH,
    });
  },
  [ENTITY_TYPE_VALUE.JSACTION]: (props) => {
    const {
      configTree,
      def,
      entity,
      entityMap,
      entityName,
      extraDefsToDefine,
      jsData,
    } = props;
    const entityConfig = configTree[entityName] as JSActionEntityConfig;
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
      const varValue = (entity as JSActionEntity)[varKey];
      jsPropertiesDef[varKey] = generateTypeDef(varValue, extraDefsToDefine);
    }

    def[entityName] = jsPropertiesDef;
    entityMap.set(entityName, {
      type: ENTITY_TYPE_VALUE.JSACTION,
      subType: "JSACTION",
    });
  },
  [ENTITY_TYPE_VALUE.WIDGET]: (props) => {
    const {
      configTree,
      def,
      entity,
      entityMap,
      entityName,
      extraDefsToDefine,
    } = props;
    const widgetType = (entity as WidgetEntity).type;
    const autocompleteDefinitions =
      WidgetFactory.getAutocompleteDefinitions(widgetType);

    if (autocompleteDefinitions) {
      const entityConfig = configTree[entityName] as WidgetEntityConfig;

      if (isFunction(autocompleteDefinitions)) {
        def[entityName] = autocompleteDefinitions(
          entity as WidgetEntity,
          extraDefsToDefine,
          entityConfig,
        );
      } else {
        def[entityName] = autocompleteDefinitions;
      }

      addSettersToDefinitions(def[entityName] as Def, entity, entityConfig);

      flattenDef(def, entityName);

      entityMap.set(entityName, {
        type: ENTITY_TYPE_VALUE.WIDGET,
        subType: widgetType,
      });
    }
  },
};
