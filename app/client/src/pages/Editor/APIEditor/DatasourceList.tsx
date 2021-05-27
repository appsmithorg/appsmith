import React, { useState } from "react";
import styled from "styled-components";
import { IconSize } from "components/ads/Icon";
import { StyledSeparator } from "pages/Applications/ProductUpdatesModal/ReleaseComponent";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import { TabComponent } from "components/ads/Tabs";
import Text, { FontWeight, TextType } from "components/ads/Text";
import { TabbedViewContainer } from "./Form";
import get from "lodash/get";

const EmptyDatasourceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 280px;
  padding: 50px;
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  height: 100%;
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
  width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  border-left: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  overflow: auto;
  transition: width 2s;
  &.show {
    width: 280px;
  }
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
  &:hover {
    box-shadow: 0 0 5px #c7c7c7;
  }
`;

const DatasourceURL = styled.span`
  margin: 8px 0;
  padding: 5px;
  font-size: 12px;
  border: 1px solid #69b5ff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: max-content;
  background: #e7f3ff;
`;

const PadTop = styled.div`
  padding-top: 5px;
  border: none;
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
              icon: "datasource",
              iconSize: IconSize.LARGE,
              panelComponent:
                props.datasources && props.datasources.length > 0 ? (
                  <DataSourceListWrapper
                    className={selectedIndex === 0 ? "show" : ""}
                  >
                    {(props.datasources || []).map((d: any, idx: number) => (
                      <DatasourceCard
                        key={idx}
                        onClick={() =>
                          history.push(
                            DATA_SOURCES_EDITOR_ID_URL(
                              props.applicationId,
                              props.currentPageId,
                              d.id,
                            ),
                          )
                        }
                      >
                        <Text type={TextType.H5} weight={FontWeight.BOLD}>
                          {d.name}
                        </Text>
                        <DatasourceURL>
                          {d.datasourceConfiguration.url}
                        </DatasourceURL>
                        <StyledSeparator />
                        <PadTop>
                          <Text type={TextType.P3} weight={FontWeight.NORMAL}>
                            {getDatasourceInfo(d)}
                          </Text>
                        </PadTop>
                      </DatasourceCard>
                    ))}
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
          ]}
        />
      </TabbedViewContainer>
    </DatasourceContainer>
  );
}
