import type { ENTITY_TYPE } from "entities/DataTree/types";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";

export const createNavData = (general: {
  name: string;
  id: string;
  type: ENTITY_TYPE;
  children: EntityNavigationData;
  key?: string;
  url: string | undefined;
  pluginName?: string;
  datasourceId?: string;
  isMock?: boolean;
  actionType?: string;
}): NavigationData => {
  return {
    name: general.name,
    id: general.id,
    type: general.type,
    children: general.children,
    key: general.key,
    url: general.url,
    navigable: !!general.url,
    pluginName: general.pluginName,
    datasourceId: general.datasourceId,
    isMock: general.isMock,
    actionType: general.actionType,
  };
};
