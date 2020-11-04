import React from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import history from "utils/history";
import { useParams } from "react-router";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import { useSelector } from "react-redux";
import { getAPIDatasources } from "selectors/entitiesSelector";
import DatasourceCard from "./DatasourceCard";

const Wrapper = styled.div`
  padding-top: 15px;
  display: flex;
  flex-direction: column;

  .sectionHeader {
    font-weight: ${props => props.theme.fontWeights[2]};
    font-size: ${props => props.theme.fontSizes[4]}px;
  }
`;

const AddDatasource = styled(Button)`
  padding: 15px;
  border: 2px solid #d6d6d6;
  justify-content: flex-start;
  font-size: 16px;
  font-weight: 500;
  margin-top: 16px;
`;

const DatasourceList = () => {
  const params = useParams<{ applicationId: string; pageId: string }>();
  const apiDatasources = useSelector(getAPIDatasources);

  return (
    <Wrapper>
      <p className="sectionHeader">
        Select a datasource to create an api or create a new one
      </p>
      <AddDatasource
        className="t--add-datasource"
        onClick={() => {
          history.push(
            DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
          );
        }}
        fill
        minimal
        text="New Datasource"
        icon={"plus"}
      />
      {apiDatasources.map(datasource => {
        return <DatasourceCard key={datasource.id} datasource={datasource} />;
      })}
    </Wrapper>
  );
};

export default DatasourceList;
