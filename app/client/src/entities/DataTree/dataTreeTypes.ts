import type {
  DataTreeEntityConfig,
  DataTreeEntityObject,
  UnEvalTreeEntityObject,
  AppsmithEntity,
  EntityTypeValue,
} from "ee/entities/DataTree/types";

export interface unEvalAndConfigTree {
  unEvalTree: UnEvalTree;
  configTree: ConfigTree;
}

export interface ConfigTree {
  [entityName: string]: DataTreeEntityConfig;
}
export type DataTreeEntity = DataTreeEntityObject;

export interface DataTree {
  [entityName: string]: DataTreeEntity;
}
export type UnEvalTreeEntity = UnEvalTreeEntityObject | AppsmithEntity;

export interface UnEvalTree {
  [entityName: string]: UnEvalTreeEntity;
}

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
