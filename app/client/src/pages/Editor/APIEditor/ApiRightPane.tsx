import React, { useMemo, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Classes, FontWeight, Text, TextType } from "design-system-old";
import history from "utils/history";
import { TabbedViewContainer } from "./CommonEditorForm";
import get from "lodash/get";
import { getQueryParams } from "utils/URLUtils";
import ActionRightPane, {
  useEntityDependencies,
} from "components/editorComponents/ActionRightPane";
import { sortedDatasourcesHandler } from "./helpers";
import { datasourcesEditorIdURL } from "RouteBuilder";
import { setApiRightPaneSelectedTab } from "actions/apiPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { getApiRightPaneSelectedTab } from "selectors/apiPaneSelectors";
import isUndefined from "lodash/isUndefined";
import { Button, Divider, Tab, TabPanel, Tabs, TabsList } from "design-system";

const EmptyDatasourceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  height: 100%;
  flex-direction: column;
  .${Classes.TEXT} {
    color: var(--ads-v2-color-fg);
  }
`;

const DatasourceContainer = styled.div`
  // to account for the divider
  min-width: calc(${(props) => props.theme.actionSidePane.width}px - 2px);
  color: var(--ads-v2-color-fg);
`;

const DataSourceListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  overflow: auto;
`;

const DatasourceCard = styled.div`
  margin-bottom: 10px;
  width: 100%;
  padding: 10px;
  border-radius: var(--ads-v2-border-radius);

  display: flex;
  flex-direction: column;

  background: var(--ads-v2-color-bg);
  cursor: pointer;
  transition: 0.3s all ease;
  .cs-icon {
    opacity: 0;
    transition: 0.3s all ease;
  }
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
    .cs-icon {
      opacity: 1;
    }
  }
`;

const DatasourceURL = styled.span`
  margin: 5px 0px 0px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ads-v2-color-fg);
  width: fit-content;
  max-width: 100%;
  font-weight: 500;
`;

const DataSourceNameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  .cs-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--ads-v2-color-fg);
  }
  .cs-text {
    color: var(--ads-v2-color-fg);
  }
  .cs-icon {
    flex-shrink: 0;
    svg {
      path {
        fill: #4b4848;
      }
    }
    &:hover {
      background-color: ${(props) => props.theme.colors.apiPane.iconHoverBg};
    }
  }
`;

const TagContainer = styled.div`
  border-radius: var(--ads-v2-border-radius);
  display: inherit;
`;

const SelectedDatasourceInfoContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 2px 8px;
  background-color: var(--ads-v2-color-bg-success);
  border-radius: var(--ads-v2-border-radius);
  margin-right: 2px;
  margin-left: 3px;
  text-transform: uppercase;
  & p {
    font-style: normal;
    font-weight: 600;
    font-size: 8px;
    line-height: 10px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--ads-v2-color-fg-success);
    white-space: nowrap;
  }
`;

const SomeWrapper = styled.div`
  height: 100%;
`;

const NoEntityFoundWrapper = styled.div`
  width: 144px;
  height: 36px;
  margin-bottom: 20px;
  box-shadow: 0px 4px 15px 0px rgb(0 0 0 / 10%);
  padding: 10px 9px;
  .lines {
    height: 4px;
    border-radius: 2px;
    background: #bbbbbb;
    &.first-line {
      width: 33%;
      margin-bottom: 8px;
    }
    &.second-line {
      width: 66%;
      background: #eeeeee;
    }
  }
`;

export const getDatasourceInfo = (datasource: any): string => {
  const info = [];
  const headers = get(datasource, "datasourceConfiguration.headers", []);
  const queryParamters = get(
    datasource,
    "datasourceConfiguration.queryParameters",
    [],
  );
  const authType = get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
    "",
  ).toUpperCase();
  if (headers.length)
    info.push(`${headers.length} HEADER${headers.length > 1 ? "S" : ""}`);
  if (queryParamters.length)
    info.push(
      `${queryParamters.length} QUERY PARAMETER${
        queryParamters.length > 1 ? "S" : ""
      }`,
    );
  if (authType.length) info.push(authType);
  return info.join(" | ");
};

const API_RIGHT_PANE_TABS = {
  CONNECTIONS: "connections",
  DATASOURCES: "datasources",
};
function ApiRightPane(props: any) {
  const dispatch = useDispatch();
  const { entityDependencies, hasDependencies } = useEntityDependencies(
    props.actionName,
  );
  const selectedTab = useSelector(getApiRightPaneSelectedTab);

  const setSelectedTab = useCallback((selectedIndex: string) => {
    dispatch(setApiRightPaneSelectedTab(selectedIndex));
  }, []);

  useEffect(() => {
    // Switch to connections tab only initially after successfully run get stored value
    // otherwise
    if (!!props.hasResponse && isUndefined(selectedTab))
      setSelectedTab(API_RIGHT_PANE_TABS.CONNECTIONS);
  }, [props.hasResponse]);

  // array of datasources with the current action's datasource first, followed by the rest.
  const sortedDatasources = useMemo(
    () =>
      sortedDatasourcesHandler(
        props.datasources,
        props.currentActionDatasourceId,
      ),
    [props.datasources, props.currentActionDatasourceId],
  );

  return (
    <>
      <Divider orientation="vertical" />
      <DatasourceContainer>
        <TabbedViewContainer>
          <Tabs
            data-testid={"api-right-pane"}
            onValueChange={setSelectedTab}
            value={
              isUndefined(selectedTab)
                ? API_RIGHT_PANE_TABS.DATASOURCES
                : selectedTab
            }
          >
            <TabsList>
              <Tab
                key={API_RIGHT_PANE_TABS.DATASOURCES}
                value={API_RIGHT_PANE_TABS.DATASOURCES}
              >
                Datasources
              </Tab>
              <Tab
                key={API_RIGHT_PANE_TABS.CONNECTIONS}
                value={API_RIGHT_PANE_TABS.CONNECTIONS}
              >
                Connections
              </Tab>
            </TabsList>
            <TabPanel value={API_RIGHT_PANE_TABS.DATASOURCES}>
              {props.datasources && props.datasources.length > 0 ? (
                <DataSourceListWrapper
                  className={
                    selectedTab === API_RIGHT_PANE_TABS.DATASOURCES
                      ? "show"
                      : ""
                  }
                >
                  {(sortedDatasources || []).map((d: any, idx: number) => {
                    const dataSourceInfo: string = getDatasourceInfo(d);
                    return (
                      <DatasourceCard
                        key={idx}
                        onClick={() => props.onClick(d)}
                      >
                        <DataSourceNameContainer>
                          <Text type={TextType.H5} weight={FontWeight.BOLD}>
                            {d.name}
                          </Text>
                          <TagContainer>
                            {d?.id === props.currentActionDatasourceId && (
                              <SelectedDatasourceInfoContainer>
                                <p>In use</p>
                              </SelectedDatasourceInfoContainer>
                            )}
                            <Button
                              isIconButton
                              kind="tertiary"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                history.push(
                                  datasourcesEditorIdURL({
                                    pageId: props.currentPageId,
                                    datasourceId: d.id,
                                    params: getQueryParams(),
                                  }),
                                );
                              }}
                              size="sm"
                              startIcon="edit"
                            />
                          </TagContainer>
                        </DataSourceNameContainer>
                        <DatasourceURL>
                          {d.datasourceConfiguration?.url}
                        </DatasourceURL>
                        {dataSourceInfo && (
                          <Text type={TextType.P3} weight={FontWeight.NORMAL}>
                            {dataSourceInfo}
                          </Text>
                        )}
                      </DatasourceCard>
                    );
                  })}
                </DataSourceListWrapper>
              ) : (
                <EmptyDatasourceContainer>
                  <NoEntityFoundWrapper>
                    <div className="lines first-line" />
                    <div className="lines second-line" />
                  </NoEntityFoundWrapper>
                  <Text
                    textAlign="center"
                    type={TextType.H5}
                    weight={FontWeight.NORMAL}
                  >
                    When you save a datasource, it will show up here.
                  </Text>
                </EmptyDatasourceContainer>
              )}
            </TabPanel>
            <TabPanel value={API_RIGHT_PANE_TABS.CONNECTIONS}>
              <SomeWrapper>
                <ActionRightPane
                  actionName={props.actionName}
                  entityDependencies={entityDependencies}
                  hasConnections={hasDependencies}
                  hasResponse={props.hasResponse}
                  suggestedWidgets={props.suggestedWidgets}
                />
              </SomeWrapper>
            </TabPanel>
          </Tabs>
        </TabbedViewContainer>
      </DatasourceContainer>
    </>
  );
}

export default React.memo(ApiRightPane);
