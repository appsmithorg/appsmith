import type { EntityTypeValue } from "@appsmith/entities/DataTree/types";

export interface NavigationData {
  name: string;
  id: string;
  type: EntityTypeValue;
  isfunction?: boolean;
  url: string | undefined;
  navigable: boolean;
  children: EntityNavigationData;
  key?: string;
  pluginName?: string;
  pluginId?: string;
  isMock?: boolean;
  datasourceId?: string;
  actionType?: string;
  widgetType?: string;
  value?: boolean | string;
}
export type EntityNavigationData = Record<string, NavigationData>;
