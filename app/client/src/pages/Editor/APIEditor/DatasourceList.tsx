import React, { useState } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { StyledSeparator } from "pages/Applications/ProductUpdatesModal/ReleaseComponent";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import { TabComponent } from "components/ads/Tabs";
import Text, { FontWeight, TextType } from "components/ads/Text";
import { TabbedViewContainer } from "./Form";
import get from "lodash/get";
import ActionRightPane from "components/editorComponents/ActionRightPane";

const EmptyDatasourceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  height: 100%;
  width: 265px;
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
`;

const DataSourceListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  overflow: auto;
  width: 265px;
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
  margin: 8px 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #457ae6;
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

const SomeWrapper = styled.div`
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  height: 100%;
`;

export const getDatasourceInfo = (datasource: any): string => {
  const info = [];
  const headers = get(datasource, "datasourceConfiguration.headers", []);
  const authType = get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
    "",
  ).toUpperCase();
  if (headers.length)
    info.push(`${headers.length} HEADER${headers.length > 1 ? "S" : ""}`);
  if (authType.length) info.push(authType);
  return info.join(" | ");
};

export default function DataSourceList(props: any) {
  const [selectedIndex, setSelectedIndex] = useState(0);
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
                    {(props.datasources || []).map((d: any, idx: number) => {
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
                            <Icon
                              name="edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                history.push(
                                  DATA_SOURCES_EDITOR_ID_URL(
                                    props.applicationId,
                                    props.currentPageId,
                                    d.id,
                                  ),
                                );
                              }}
                              size={IconSize.LARGE}
                            />
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
                    <Text
                      textAlign="center"
                      type={TextType.P3}
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
                    hasResponse={props.hasResponse}
                    suggestedWidget={props.suggestedWidget}
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
