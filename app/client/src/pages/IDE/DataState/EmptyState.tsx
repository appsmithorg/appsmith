import React from "react";
import styled from "styled-components";
import BlankState from "../components/BlankState";
import { useDispatch } from "react-redux";
import { importSvg } from "design-system-old";
import { showAddDatasourceModal } from "../ideActions";
import { useIDEDatasources } from "../hooks";

const DataIcon = importSvg(
  () => import("pages/IDE/assets/icons/no-datasources.svg"),
);

const Container = styled.div`
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  p {
    font-size: 30px;
    color: #4c5664;
  }
`;

const DataMainEmptyState = () => {
  const dispatch = useDispatch();
  const datasources = useIDEDatasources();
  const showBlankState = !datasources.length;

  if (showBlankState) {
    return (
      <div className="flex items-center h-full justify-center">
        <BlankState
          buttonText="New Datasource"
          description={
            "Experience the power of Appsmith by connecting to your data"
          }
          image={DataIcon}
          onClick={() => {
            dispatch(showAddDatasourceModal(true));
          }}
        />
      </div>
    );
  }
  return (
    <Container>
      <p>Select a datasource</p>
    </Container>
  );
};

export default DataMainEmptyState;
