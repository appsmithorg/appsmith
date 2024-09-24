import type { EntityTypeValue } from "ee/entities/DataTree/types";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";

export const createNavData = (general: {
  name: string;
  id: string;
  type: EntityTypeValue;
  isfunction?: boolean;
  children: EntityNavigationData;
  key?: string;
  url: string | undefined;
  pluginName?: string;
  pluginId?: string;
  datasourceId?: string;
  isMock?: boolean;
  actionType?: string;
  widgetType?: string;
}): NavigationData => {
  return {
    name: general.name,
    id: general.id,
    type: general.type,
    isfunction: general.isfunction,
    children: general.children,
    key: general.key,
    url: general.url,
    navigable: !!general.url,
    pluginName: general.pluginName,
    datasourceId: general.datasourceId,
    isMock: general.isMock,
    actionType: general.actionType,
    pluginId: general.pluginId,
    widgetType: general.widgetType,
  };
};
