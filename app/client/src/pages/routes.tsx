import {
  DATA_SOURCES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_LIST_PATH,
} from "constants/routes";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import DatasourceBlankState from "pages/Editor/DataSourceEditor/DatasourceBlankState";

export const DatasourceEditorRoutes = [
  {
    path: DATA_SOURCES_EDITOR_ID_PATH,
    component: DataSourceEditor,
  },
  {
    path: DATA_SOURCES_EDITOR_LIST_PATH,
    component: DatasourceBlankState,
  },
];
