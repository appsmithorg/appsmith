import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import styled from "styled-components";
import { Icon, IconSize, TabComponent } from "design-system";
import { StyledSeparator } from "pages/Applications/ProductUpdatesModal/ReleaseComponent";
import history from "utils/history";
import classNames from "classnames";
import { Text, FontWeight, TextType } from "design-system";
import get from "lodash/get";
import { getQueryParams } from "utils/URLUtils";
import ActionRightPane, {
  useEntityDependencies,
} from "components/editorComponents/ActionRightPane";
import { Classes } from "components/ads/common";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import { datasourcesEditorIdURL } from "RouteBuilder";
import { isGraphqlPlugin } from "entities/Action";
import { getPlugin } from "selectors/entitiesSelector";
import { AppState } from "@appsmith/reducers";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import FormRow from "components/editorComponents/FormRow";
import { sortedDatasourcesHandler } from "./helpers";
import GraphqlDocExplorer from "./GraphQL/GraphqlDocExplorer";
import { SuggestedWidget } from "api/ActionAPI";
import { Datasource } from "entities/Datasource";
import { tailwindLayers } from "constants/Layers";
import { clamp } from "lodash";

export const TabbedViewContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  height: 100%;
  border-top: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;
    & > * {
      margin-right: 0px;
    }
  }

  &&& {
    ul.react-tabs__tab-list {
      overflow: hidden;
      margin: 0px ${(props) => props.theme.spaces[11]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
      li.react-tabs__tab--selected {
        > div {
          color: ${(props) => props.theme.colors.apiPane.closeIcon};
        }
      }
    }
    .react-tabs__tab-panel {
      height: calc(100% - 36px);
      background-color: ${(props) => props.theme.colors.apiPane.tabBg};
      .eye-on-off {
        svg {
          fill: ${(props) =>
            props.theme.colors.apiPane.requestTree.header.icon};
          &:hover {
            fill: ${(props) =>
              props.theme.colors.apiPane.requestTree.header.icon};
          }
          path {
            fill: unset;
          }
        }
      }
    }
  }
`;

const EmptyDatasourceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  border-left: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  height: 100%;
  flex-direction: column;
  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.text};
  }
`;

const ApiRightPaneContainer = styled.div`
  &&&&&&&&&&& .react-tabs__tab-list {
    padding: 0 16px 1px 16px !important;
    border-bottom: none;
    border-left: 1px solid #e8e8e8;
    margin-left: 0px;
    margin-right: 0px;
    .cs-icon {
      margin-right: 0;
    }
  }
  width: 100%;
  color: ${(props) => props.theme.colors.apiPane.text};

  &&&& {
    .react-tabs__tab-panel {
      height: calc(100% - 32px);
    }
  }
`;

const DataSourceListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  border-left: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  overflow: auto;
`;

const DatasourceCard = styled.div`
  margin-bottom: 10px;
  width: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  cursor: pointer;
  transition: 0.3s all ease;
  .cs-icon {
    opacity: 0;
    transition: 0.3s all ease;
  }
  &:hover {
    box-shadow: 0 0 5px #c7c7c7;
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
  color: #6a86ce;
  width: fit-content;
  max-width: 100%;
  font-weight: 500;
`;

const PadTop = styled.div`
  padding-top: 5px;
  border: none;
`;

const DataSourceNameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  .cs-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: ${(props) => props.theme.colors.apiPane.text};
  }
  .cs-text {
    color: ${(props) => props.theme.colors.apiPane.text};
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

const IconContainer = styled.div`
  display: inherit;
`;

const SelectedDatasourceInfoContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 2px 8px;
  background-color: ${Colors.LIGHT_GREEN_CYAN};
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
    color: ${Colors.GREEN};
    white-space: nowrap;
  }
`;

const SomeWrapper = styled.div`
  border-left: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
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

const ResizeableDiv = styled.div`
  display: flex;
  height: 100%;
  flex-shrink: 0;
`;

const ResizerHandler = styled.div<{ resizing: boolean }>`
  width: 6px;
  height: 100%;
  margin-left: 2px;
  border-right: 1px solid ${Colors.GREY_200};
  background: ${(props) => (props.resizing ? Colors.GREY_4 : "transparent")};
  &:hover {
    background: ${Colors.GREY_4};
    border-color: transparent;
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

type ApiRightPaneType = {
  actionName: string;
  actionId: string;
  applicationId?: string;
  currentActionDatasourceId: string;
  currentPageId: string;
  datasources?: any;
  hasResponse: boolean;
  onClick: (datasource: Datasource) => void;
  pluginId: string;
  suggestedWidgets?: SuggestedWidget[];
};

const API_PANE_WIDTH_CONSTANTS = {
  max: 400,
  min: 150,
  default: 265,
};

function ApiRightPane(props: ApiRightPaneType) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sizeableRef = useRef<HTMLDivElement>(null);
  const [variableEditorWidth, setVariableEditorWidth] = React.useState(
    API_PANE_WIDTH_CONSTANTS.default,
  );
  const { entityDependencies, hasDependencies } = useEntityDependencies(
    props.actionName,
  );
  const currentPlugin = useSelector((state: AppState) =>
    getPlugin(state, props?.pluginId ?? ""),
  );

  const onApiRightPaneWidthChange = useCallback((newWidth) => {
    setVariableEditorWidth(
      clamp(
        newWidth,
        API_PANE_WIDTH_CONSTANTS.min,
        API_PANE_WIDTH_CONSTANTS.max,
      ),
    );
  }, []);

  const {
    onMouseDown,
    onMouseUp,
    onTouchStart,
    resizing,
  } = useHorizontalResize(
    sizeableRef,
    onApiRightPaneWidthChange,
    undefined,
    true,
  );

  useEffect(() => {
    if (!!props.hasResponse) setSelectedIndex(1);
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

  const isGraphqlDatasource = isGraphqlPlugin(currentPlugin);

  const tabArray = [
    {
      key: "datasources",
      title: "Datasources",
      panelComponent:
        props.datasources && props.datasources.length > 0 ? (
          <DataSourceListWrapper className={selectedIndex === 0 ? "show" : ""}>
            {(sortedDatasources || []).map((d: any, idx: number) => {
              const dataSourceInfo: string = getDatasourceInfo(d);
              return (
                <DatasourceCard key={idx} onClick={() => props.onClick(d)}>
                  <DataSourceNameContainer>
                    <Text type={TextType.H5} weight={FontWeight.BOLD}>
                      {d.name}
                    </Text>
                    <IconContainer>
                      {d?.id === props.currentActionDatasourceId && (
                        <SelectedDatasourceInfoContainer>
                          <p>In use</p>
                        </SelectedDatasourceInfoContainer>
                      )}
                      <Icon
                        name="edit"
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
                        size={IconSize.LARGE}
                      />
                    </IconContainer>
                  </DataSourceNameContainer>
                  <DatasourceURL>
                    {d.datasourceConfiguration?.url}
                  </DatasourceURL>
                  {dataSourceInfo && (
                    <>
                      <StyledSeparator />
                      <PadTop>
                        <Text type={TextType.P3} weight={FontWeight.NORMAL}>
                          {dataSourceInfo}
                        </Text>
                      </PadTop>
                    </>
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
        ),
    },
    {
      key: "Connections",
      title: "Connections",
      panelComponent: (
        <SomeWrapper>
          <ActionRightPane
            actionName={props.actionName}
            entityDependencies={entityDependencies}
            hasConnections={hasDependencies}
            hasResponse={props.hasResponse}
            suggestedWidgets={props.suggestedWidgets}
          />
        </SomeWrapper>
      ),
    },
  ];

  if (isGraphqlDatasource) {
    tabArray.unshift({
      key: "Graphql",
      title: "Explorer",
      panelComponent: (
        <GraphqlDocExplorer
          actionId={props.actionId}
          datasourceId={props.currentActionDatasourceId}
        />
      ),
    });
  }

  return (
    <>
      <div
        className={`w-2 h-full -ml-2 group z-6 cursor-ew-resize ${tailwindLayers.resizer}`}
        onMouseDown={onMouseDown}
        onTouchEnd={onMouseUp}
        onTouchStart={onTouchStart}
      >
        <ResizerHandler
          className={classNames({
            "transform transition": true,
          })}
          resizing={resizing}
        />
      </div>
      <ResizeableDiv
        ref={sizeableRef}
        style={{
          width: `${variableEditorWidth}px`,
        }}
      >
        <ApiRightPaneContainer>
          <TabbedViewContainer>
            <TabComponent
              cypressSelector={"api-right-pane"}
              onSelect={setSelectedIndex}
              selectedIndex={selectedIndex}
              tabs={tabArray}
            />
          </TabbedViewContainer>
        </ApiRightPaneContainer>
      </ResizeableDiv>
    </>
  );
}

export default React.memo(ApiRightPane);
