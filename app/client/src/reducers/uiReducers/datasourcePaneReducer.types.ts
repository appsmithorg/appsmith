import type { Datasource } from "@appsmith/entities/Datasource";

export interface DatasourcePaneReduxState {
  drafts: Record<string, Datasource>;
  expandDatasourceId: string;
  actionRouteInfo: Partial<{
    baseApiId: string;
    datasourceId: string;
    baseParentEntityId: string;
    baseApplicationId: string;
  }>;
  newDatasource: string;
  viewMode: boolean;
  collapsibleState: Record<string, boolean>;
  defaultKeyValueArrayConfig: Array<string>;
  responseTabHeight: number;
  selectedTableName: string;
}
