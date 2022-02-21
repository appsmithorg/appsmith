import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { Datasource } from "entities/Datasource";
import DatasourceCard from "./DatasourceCard";
import Text, { TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import { thinScrollbar } from "constants/DefaultTheme";
import { keyBy } from "lodash";
import {
  createMessage,
  EMPTY_ACTIVE_DATA_SOURCES,
  GENERATE_APPLICATION_TITLE,
  GENERATE_APPLICATION_DESCRIPTION,
} from "@appsmith/constants/messages";

const QueryHomePage = styled.div`
  ${thinScrollbar};
  padding: 5px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1;

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

const CreateButton = styled(Button)`
  display: inline;
  padding: 4px 8px;
`;

const EmptyActiveDatasource = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GenerateInfoBanner = styled.div`
  width: 518px;
`;

const GenerateInfoHeader = styled.h5`
  margin: 32px 0px 8px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.textOnGreyBG};
`;

const GenerateInfoBody = styled.p`
  font-size: 12px;
  color: ${(props) => props.theme.colors.searchInput.placeholder};
`;

type ActiveDataSourcesProps = {
  dataSources: Datasource[];
  pageId: string;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  onCreateNew: () => void;
};

function ActiveDataSources(props: ActiveDataSourcesProps) {
  const { dataSources } = props;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  if (dataSources.length === 0) {
    return (
      <EmptyActiveDatasource>
        <Text cypressSelector="t--empty-datasource-list" type={TextType.H3}>
          {createMessage(EMPTY_ACTIVE_DATA_SOURCES)}&nbsp;
          <CreateButton
            category={Category.primary}
            onClick={props.onCreateNew}
            size={Size.medium}
            tag="button"
            text="Create New"
          />
        </Text>
      </EmptyActiveDatasource>
    );
  }

  return (
    <QueryHomePage className="t--active-datasource-list">
      {dataSources.map((datasource, idx) => {
        return (
          <DatasourceCard
            datasource={datasource}
            key={`${datasource.id}_${idx}`}
            plugin={pluginGroups[datasource.pluginId]}
          />
        );
      })}
      <GenerateInfoBanner>
        <GenerateInfoHeader>
          {createMessage(GENERATE_APPLICATION_TITLE)}
        </GenerateInfoHeader>
        <GenerateInfoBody>
          {createMessage(GENERATE_APPLICATION_DESCRIPTION)}
        </GenerateInfoBody>
      </GenerateInfoBanner>
    </QueryHomePage>
  );
}

export default ActiveDataSources;
