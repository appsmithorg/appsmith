import {
  type WidgetEntityConfig,
  type JSActionEntityConfig,
  type WidgetEntity,
  type ActionEntity,
  type AppsmithEntity,
  type JSActionEntity,
  ENTITY_TYPE,
} from "ee/entities/DataTree/types";
import type {
  ConfigTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import { isFunction } from "lodash";
import { entityDefinitions } from "ee/utils/autocomplete/EntityDefinitions";
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
  [ENTITY_TYPE.ACTION]: (props) => {
    const { def, entity, entityMap, entityName, extraDefsToDefine } = props;

    def[entityName] = entityDefinitions.ACTION(
      entity as ActionEntity,
      extraDefsToDefine,
    );
    flattenDef(def, entityName);
    entityMap.set(entityName, {
      type: ENTITY_TYPE.ACTION,
      subType: "ACTION",
    });
  },
  [ENTITY_TYPE.APPSMITH]: (props) => {
    const { def, entity, entityMap, extraDefsToDefine } = props;

    def.appsmith = entityDefinitions.APPSMITH(
      entity as AppsmithEntity,
      extraDefsToDefine,
    );
    flattenDef(def, "appsmith");
    entityMap.set("appsmith", {
      type: ENTITY_TYPE.APPSMITH,
      subType: ENTITY_TYPE.APPSMITH,
    });
  },
  [ENTITY_TYPE.JSACTION]: (props) => {
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

    if (entityConfig.variables) {
      for (let i = 0; i < entityConfig?.variables?.length; i++) {
        const varKey = entityConfig?.variables[i];
        const varValue = (entity as JSActionEntity)[varKey];

        jsPropertiesDef[varKey] = generateTypeDef(varValue, extraDefsToDefine);
      }
    }

    def[entityName] = jsPropertiesDef;
    entityMap.set(entityName, {
      type: ENTITY_TYPE.JSACTION,
      subType: "JSACTION",
    });
  },
  [ENTITY_TYPE.WIDGET]: (props) => {
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
        type: ENTITY_TYPE.WIDGET,
        subType: widgetType,
      });
    }
  },
};
