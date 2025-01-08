import type {
  Datasource,
  DatasourceStorage,
  DatasourceStructure,
  MockDatasource,
} from "entities/Datasource";
import type { DropdownOption } from "@appsmith/ads-old";

export interface DatasourceDataState {
  list: Datasource[];
  loading: boolean;
  loadingTokenForDatasourceId: string | null;
  isTesting: boolean;
  isListing: boolean; // fetching unconfigured datasource list
  fetchingDatasourceStructure: Record<string, boolean>;
  structure: Record<string, DatasourceStructure>;
  isFetchingMockDataSource: false;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockDatasourceList: any[];
  executingDatasourceQuery: boolean;
  isReconnectingModalOpen: boolean; // reconnect datasource modal for import application
  unconfiguredList: Datasource[];
  isDatasourceBeingSaved: boolean;
  isDatasourceBeingSavedFromPopup: boolean;
  gsheetToken: string;
  gsheetProjectID: string;
  gsheetStructure: {
    spreadsheets: Record<string, { value?: DropdownOption[]; error?: string }>;
    sheets: Record<string, { value?: DropdownOption[]; error?: string }>;
    columns: Record<string, { value?: DropdownOption[]; error?: string }>;
    isFetchingSpreadsheets: boolean;
    isFetchingSheets: boolean;
    isFetchingColumns: boolean;
  };
  recentDatasources: string[];
}
