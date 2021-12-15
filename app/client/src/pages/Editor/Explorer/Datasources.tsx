import React, { useCallback } from "react";
import { useAppWideAndOtherDatasource } from "./hooks";
import { Datasource } from "entities/Datasource";
import ExplorerDatasourceEntity from "./Datasources/DatasourceEntity";
import { useSelector } from "store";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getPlugins } from "selectors/entitiesSelector";
import { keyBy } from "lodash";
import Entity from "./Entity";
import history from "utils/history";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import EntityPlaceholder from "./Entity/Placeholder";
import { createMessage, CREATE_DATASOURCE_TOOLTIP } from "constants/messages";
import styled from "styled-components";
import ArrowRightLineIcon from "remixicon-react/ArrowRightLineIcon";
import { Colors } from "constants/Colors";

const emptyNode = (
  <EntityPlaceholder step={0}>
    Click the <strong>+</strong> icon above to create a new datasource
  </EntityPlaceholder>
);

const ShowAll = styled.div`
  padding: 0.25rem 1.5rem;
  font-weight: 500;
  font-size: 12px;
  color: ${Colors.DOVE_GRAY2};
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
  }
`;

export function Datasources() {
  const { appWideDS, otherDS } = useAppWideAndOtherDatasource();
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId) || "";
  const plugins = useSelector(getPlugins);
  const pluginGroups = React.useMemo(() => keyBy(plugins, "id"), [plugins]);
  const addDatasource = useCallback(() => {
    history.push(
      INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
    );
  }, [applicationId, pageId]);

  const listDatasource = useCallback(() => {
    history.push(
      INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.ACTIVE),
    );
  }, [applicationId, pageId]);

  const datasourceElements = React.useMemo(
    () =>
      appWideDS.map((datasource: Datasource) => {
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
      }),
    [appWideDS, pageId],
  );

  return (
    <Entity
      addButtonHelptext={createMessage(CREATE_DATASOURCE_TOOLTIP)}
      className={"datasources"}
      entityId={pageId + "_datasources"}
      icon={null}
      isDefaultExpanded={false}
      key={pageId + "_datasources"}
      name="DATASOURCES"
      onCreate={addDatasource}
      searchKeyword={""}
      step={0}
    >
      {appWideDS.length ? datasourceElements : emptyNode}
      {otherDS.length ? (
        <ShowAll onClick={listDatasource}>
          Show all datasources
          <ArrowRightLineIcon color={Colors.DOVE_GRAY2} size={"14px"} />
        </ShowAll>
      ) : null}
    </Entity>
  );
}
