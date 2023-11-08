import type {
  ActionEntityConfig,
  JSActionEntityConfig,
} from "@appsmith/entities/DataTree/types";
import {
  ENTITY_TYPE_VALUE,
  type WidgetEntity,
  type WidgetEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type { PluginType } from "entities/Action";

export const getEntityPayloadInfo: Record<
  string,
  (
    entity: any,
    entityConfig: any,
  ) => {
    iconId: string;
    id: string;
    pluginType?: PluginType;
  }
> = {
  [ENTITY_TYPE_VALUE.WIDGET]: (
    entity: WidgetEntity,
    entityConfig: WidgetEntityConfig,
  ) => ({
    iconId: entityConfig.widgetId,
    id: entityConfig.widgetId,
  }),
  [ENTITY_TYPE_VALUE.JSACTION]: (
    entity,
    entityConfig: JSActionEntityConfig,
  ) => ({
    iconId: entityConfig.actionId,
    id: entityConfig.actionId,
    pluginType: entityConfig.pluginType,
  }),
  [ENTITY_TYPE_VALUE.ACTION]: (entity, entityConfig: ActionEntityConfig) => ({
    iconId: entityConfig.pluginId,
    id: entityConfig.actionId,
    pluginType: entityConfig.pluginType,
  }),
};
