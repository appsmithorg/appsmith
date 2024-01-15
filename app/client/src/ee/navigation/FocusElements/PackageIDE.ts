import { FocusEntity } from "navigation/FocusEntity";
import type { FocusElementConfig } from "navigation/FocusElements";
import { FocusElement, FocusElementConfigType } from "navigation/FocusElements";
import { getSelectedDatasourceId } from "@appsmith/navigation/FocusSelectors";
import { setSelectedDatasource } from "@appsmith/navigation/FocusSetters";
import { getFirstDatasourceId } from "selectors/datasourceSelectors";

export default {
  [FocusEntity.NONE]: [],
  [FocusEntity.APP_STATE]: [],
  [FocusEntity.CANVAS]: [],
  [FocusEntity.QUERY_ADD]: [],
  [FocusEntity.API]: [],
  [FocusEntity.LIBRARY]: [],
  [FocusEntity.SETTINGS]: [],
  [FocusEntity.DATASOURCE_CREATE]: [],
  [FocusEntity.DATASOURCE_LIST]: [
    {
      type: FocusElementConfigType.URL,
      name: FocusElement.SelectedDatasource,
      selector: getSelectedDatasourceId,
      setter: setSelectedDatasource,
      defaultValue: getFirstDatasourceId,
    },
  ],
  [FocusEntity.DATASOURCE]: [],
  [FocusEntity.JS_OBJECT]: [],
  [FocusEntity.QUERY]: [],
  [FocusEntity.PROPERTY_PANE]: [],
  [FocusEntity.DEBUGGER]: [],
  [FocusEntity.QUERY_LIST]: [],
  [FocusEntity.JS_OBJECT_LIST]: [],
  [FocusEntity.WIDGET_LIST]: [],
  [FocusEntity.EDITOR]: [],
} as Record<FocusEntity, FocusElementConfig[]>;
