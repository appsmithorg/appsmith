import { FocusEntity } from "navigation/FocusEntity";
import type { FocusElementsConfigList } from "sagas/FocusRetentionSaga";
import { FocusElement, FocusElementConfigType } from "navigation/FocusElements";
import { getSelectedDatasourceId } from "@appsmith/navigation/FocusSelectors";
import { setSelectedDatasource } from "@appsmith/navigation/FocusSetters";
import { getFirstDatasourceId } from "selectors/datasourceSelectors";

export default {
  [FocusEntity.DATASOURCE_LIST]: [
    {
      type: FocusElementConfigType.URL,
      name: FocusElement.SelectedDatasource,
      selector: getSelectedDatasourceId,
      setter: setSelectedDatasource,
      defaultValue: getFirstDatasourceId,
    },
  ],
} as FocusElementsConfigList;
