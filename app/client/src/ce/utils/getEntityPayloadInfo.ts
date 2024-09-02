import type {
  ActionEntityConfig,
  EntityConfig,
  JSActionEntityConfig,
} from "ee/entities/DataTree/types";
import {
  type WidgetEntityConfig,
  ENTITY_TYPE,
} from "ee/entities/DataTree/types";
import type { PluginType } from "entities/Action";

export const getEntityPayloadInfo: Record<
  string,
  (entityConfig: EntityConfig) => {
    iconId: string;
    id: string;
    pluginType?: PluginType | string;
    entityName?: string;
  }
> = {
  [ENTITY_TYPE.WIDGET]: (entityConfig) => {
    const config = entityConfig as WidgetEntityConfig;
    return {
      iconId: config.widgetId,
      id: config.widgetId,
      pluginType: config.type,
    };
  },
  [ENTITY_TYPE.JSACTION]: (entityConfig) => {
    const config = entityConfig as JSActionEntityConfig;
    return {
      iconId: config.actionId,
      id: config.actionId,
      pluginType: config.pluginType,
    };
  },
  [ENTITY_TYPE.ACTION]: (entityConfig) => {
    const config = entityConfig as ActionEntityConfig;
    return {
      iconId: config.pluginId,
      id: config.actionId,
      pluginType: config.pluginType,
    };
  },
};
