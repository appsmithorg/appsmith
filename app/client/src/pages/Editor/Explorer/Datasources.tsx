import React from "react";
import { useAppWideAndOtherDatasource } from "./hooks";
import { Datasource } from "entities/Datasource";
import ExplorerDatasourceEntity from "./Datasources/DatasourceEntity";
import { useSelector } from "store";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPageList,
} from "selectors/editorSelectors";
import { getPlugins } from "selectors/entitiesSelector";
import { keyBy } from "lodash";
import Entity from "./Entity";
import history from "utils/history";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import EntityPlaceholder from "./Entity/Placeholder";

const emptyNode = (
  <EntityPlaceholder step={0}>
    Please click the <strong>+</strong> icon above to create a new datasource
  </EntityPlaceholder>
);

export function Datasources() {
  const { appWideDS } = useAppWideAndOtherDatasource();
  const applicationId = useSelector(getCurrentApplicationId);
  const pages = useSelector(getPageList);
  const pageId = useSelector(getCurrentPageId) || pages[0].pageId;

  const plugins = useSelector(getPlugins);
  const pluginGroups = React.useMemo(() => keyBy(plugins, "id"), [plugins]);

  const addDatasource = () => {
    history.push(
      INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
    );
  };

  const datasourceElements = appWideDS.map((datasource: Datasource) => {
    return (
      <ExplorerDatasourceEntity
        datasource={datasource}
        key={datasource.id}
        pageId={pageId}
        plugin={pluginGroups[datasource.pluginId]}
        searchKeyword={""}
        step={1}
      />
    );
  });

  return (
    <Entity
      addButtonHelptext={""}
      className={"datasources"}
      disabled={!appWideDS.length}
      entityId={pageId + "_datasources"}
      icon={null}
      isDefaultExpanded={false}
      key={pageId + "_datasources"}
      name="Datasources"
      onCreate={addDatasource}
      searchKeyword={""}
      step={-3}
    >
      {!appWideDS?.length ? emptyNode : datasourceElements}
    </Entity>
  );
}
