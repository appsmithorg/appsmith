import React, { useMemo, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Classes, FontWeight, Text, TextType } from "@appsmith/ads-old";
import history from "utils/history";
import { TabbedViewContainer } from "./CommonEditorForm";
import get from "lodash/get";
import { getQueryParams } from "utils/URLUtils";
import ActionRightPane from "components/editorComponents/ActionRightPane";
import { sortedDatasourcesHandler } from "./helpers";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { setApiRightPaneSelectedTab } from "actions/apiPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { getApiRightPaneSelectedTab } from "selectors/apiPaneSelectors";
import isUndefined from "lodash/isUndefined";
import { Button, Tab, TabPanel, Tabs, TabsList, Tag } from "@appsmith/ads";
import type { Datasource } from "entities/Datasource";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import type { SuggestedWidget } from "api/ActionAPI";

interface ApiRightPaneProps {
  additionalSections?: React.ReactNode;
  actionName: string;
  actionRightPaneBackLink: React.ReactNode;
  applicationId?: string;
  currentActionDatasourceId: string;
  currentBasePageId?: string;
  datasourceId: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasources: any;
  hasResponse: boolean;
  onClick: (datasource: Datasource) => void;
  pluginId: string;
  showTabbedSection: boolean;
  suggestedWidgets?: SuggestedWidget[];
}

const EmptyDatasourceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 50px;
  height: 100%;
  flex-direction: column;
  .${Classes.TEXT} {
    color: var(--ads-v2-color-fg);
    width: 200px;
  }
`;

const DatasourceContainer = styled.div`
  // to account for the divider
  min-width: calc(${(props) => props.theme.actionSidePane.width}px - 2px);
  max-width: calc(${(props) => props.theme.actionSidePane.width}px - 2px);
  color: var(--ads-v2-color-fg);

  .tab-container-right-sidebar {
    padding: 0 var(--ads-v2-spaces-7);
    height: 100%;
    border-left: 1px solid var(--ads-v2-color-border);

    .ads-v2-tabs {
      display: flex;
      flex-direction: column;
      height: calc(100% - 70px);

      .ads-v2-tabs__panel {
        flex-grow: 1;
        overflow-y: scroll;
        margin-top: 0px;
        padding-top: var(--ads-v2-spaces-4);
      }
    }
  }
`;

const DataSourceListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
  padding: 0 var(--ads-v2-spaces-6);
`;

const DatasourceCard = styled.div`
  width: 100%;
  padding: var(--ads-v2-spaces-4);
  border-radius: var(--ads-v2-border-radius);

  display: flex;
  flex-direction: column;

  background: var(--ads-v2-color-bg);
  cursor: pointer;
  transition: 0.3s all ease;
  button {
    opacity: 0;
    visibility: hidden;
  }
  .ads-v2-icon {
    opacity: 0;
    transition: 0.3s all ease;
  }
  &:hover button {
    opacity: 1;
    visibility: visible;
  }
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
    .ads-v2-icon {
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
`;

const ActionRightPaneWrapper = styled.div`
  height: 100%;
  padding: 0 var(--ads-v2-spaces-4);
`;

const NoEntityFoundWrapper = styled.div`
  width: 144px;
  height: 36px;
  margin-bottom: 20px;
  box-shadow: var(--ads-v2-shadow-popovers);
  padding: 10px 9px;
  border-radius: var(--ads-v2-border-radius);
  .lines {
    height: 4px;
    border-radius: var(--ads-v2-border-radius);
    background: var(--ads-v2-color-bg-muted);
    &.first-line {
      width: 33%;
      margin-bottom: 8px;
    }
    &.second-line {
      width: 66%;
      background: var(--ads-v2-color-bg-subtle);
    }
  }
`;

const TablistWithPadding = styled.div`
  flex-shrink: 0;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDatasourceInfo = (datasource: any): string => {
  const info = [];
  const headers = get(datasource, "datasourceConfiguration.headers", []);
  const queryParameters = get(
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
    info.push(`${headers.length} Header${headers.length > 1 ? "s" : ""}`);

  if (queryParameters.length)
    info.push(
      `${queryParameters.length} query parameters${
        queryParameters.length > 1 ? "s" : ""
      }`,
    );

  if (authType.length) info.push(authType);

  return info.join(" | ");
};

const API_RIGHT_PANE_TABS = {
  CONNECTIONS: "connections",
  DATASOURCES: "datasources",
};

function ApiRightPane(props: ApiRightPaneProps) {
  const dispatch = useDispatch();
  const selectedTab = useSelector(getApiRightPaneSelectedTab);
  const currentEnvironmentId = useSelector(getCurrentEnvironmentId);

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

  if (!props.additionalSections && !props.showTabbedSection) return null;

  return (
    <DatasourceContainer>
      <TabbedViewContainer className="tab-container-right-sidebar">
        {props.additionalSections}
        {props.showTabbedSection && (
          <Tabs
            data-testid={"api-right-pane"}
            onValueChange={setSelectedTab}
            value={
              isUndefined(selectedTab)
                ? API_RIGHT_PANE_TABS.DATASOURCES
                : selectedTab
            }
          >
            <TablistWithPadding>
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
            </TablistWithPadding>
            <TabPanel value={API_RIGHT_PANE_TABS.DATASOURCES}>
              {props.datasources && props.datasources.length > 0 ? (
                <DataSourceListWrapper
                  className={
                    selectedTab === API_RIGHT_PANE_TABS.DATASOURCES
                      ? "show"
                      : ""
                  }
                >
                  {(sortedDatasources || []).map(
                    (d: Datasource, idx: number) => {
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
                            {d?.id === props.currentActionDatasourceId && (
                              <Tag isClosable={false} size="md">
                                In use
                              </Tag>
                            )}
                            <Button
                              isIconButton
                              kind="tertiary"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                history.push(
                                  datasourcesEditorIdURL({
                                    basePageId: props.currentBasePageId,
                                    datasourceId: d.id,
                                    params: getQueryParams(),
                                  }),
                                );
                              }}
                              size="sm"
                              startIcon="pencil-line"
                            />
                          </DataSourceNameContainer>
                          <DatasourceURL>
                            {d.datasourceStorages[currentEnvironmentId]
                              ?.datasourceConfiguration?.url || ""}
                          </DatasourceURL>
                          {dataSourceInfo && (
                            <Text type={TextType.P3} weight={FontWeight.NORMAL}>
                              {dataSourceInfo}
                            </Text>
                          )}
                        </DatasourceCard>
                      );
                    },
                  )}
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
              <ActionRightPaneWrapper>
                <ActionRightPane
                  actionRightPaneBackLink={props.actionRightPaneBackLink}
                />
              </ActionRightPaneWrapper>
            </TabPanel>
          </Tabs>
        )}
      </TabbedViewContainer>
    </DatasourceContainer>
  );
}

export default React.memo(ApiRightPane);
