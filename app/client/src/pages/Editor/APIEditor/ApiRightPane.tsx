import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { StyledSeparator } from "pages/Applications/ProductUpdatesModal/ReleaseComponent";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import { TabComponent } from "components/ads/Tabs";
import Text, { FontWeight, TextType } from "components/ads/Text";
import { TabbedViewContainer } from "./Form";
import get from "lodash/get";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import ActionRightPane, {
  useEntityDependencies,
} from "components/editorComponents/ActionRightPane";
import { useSelector } from "react-redux";
import { Classes } from "components/ads/common";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { Colors } from "constants/Colors";
import { sortedDatasourcesHandler } from "./helpers";

const EmptyDatasourceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  height: 100%;
  flex-direction: column;
  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.text};
  }
`;

const DatasourceContainer = styled.div`
  .react-tabs__tab-list {
    padding: 0 16px !important;
    border-bottom: none;
    border-left: 2px solid #e8e8e8;
    .cs-icon {
      margin-right: 0;
    }
  }
  width: ${(props) => props.theme.actionSidePane.width}px;
  color: ${(props) => props.theme.colors.apiPane.text};
`;

const DataSourceListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
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
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
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

function ApiRightPane(props: any) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { entityDependencies, hasDependencies } = useEntityDependencies(
    props.actionName,
  );
  useEffect(() => {
    if (!!props.hasResponse) setSelectedIndex(1);
  }, [props.hasResponse]);

  const applicationId = useSelector(getCurrentApplicationId);

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
    <DatasourceContainer>
      <TabbedViewContainer>
        <TabComponent
          onSelect={setSelectedIndex}
          selectedIndex={selectedIndex}
          tabs={[
            {
              key: "datasources",
              title: "Datasources",
              panelComponent:
                props.datasources && props.datasources.length > 0 ? (
                  <DataSourceListWrapper
                    className={selectedIndex === 0 ? "show" : ""}
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
                            <IconContainer>
                              {d?.id === props.currentActionDatasourceId && (
                                <SelectedDatasourceInfoContainer>
                                  <p>In use</p>
                                </SelectedDatasourceInfoContainer>
                              )}
                              <Icon
                                name="edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  history.push(
                                    DATA_SOURCES_EDITOR_ID_URL(
                                      applicationId,
                                      props.currentPageId,
                                      d.id,
                                      getQueryParams(),
                                    ),
                                  );
                                }}
                                size={IconSize.LARGE}
                              />
                            </IconContainer>
                          </DataSourceNameContainer>
                          <DatasourceURL>
                            {d.datasourceConfiguration.url}
                          </DatasourceURL>
                          {dataSourceInfo && (
                            <>
                              <StyledSeparator />
                              <PadTop>
                                <Text
                                  type={TextType.P3}
                                  weight={FontWeight.NORMAL}
                                >
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
          ]}
        />
      </TabbedViewContainer>
    </DatasourceContainer>
  );
}

export default React.memo(ApiRightPane);
