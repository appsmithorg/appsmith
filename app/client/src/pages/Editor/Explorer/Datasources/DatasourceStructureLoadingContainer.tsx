import React from "react";
import { createMessage, LOADING_SCHEMA } from "@appsmith/constants/messages";
import { Spinner, Text } from "design-system";
import styled from "styled-components";

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & > p {
    margin-top: 0.5rem;
  }
`;

const DatasourceStructureLoadingContainer = () => {
  return (
    <LoadingContainer>
      <Spinner size={"sm"} />
      <Text kind="body-s" renderAs="p">
        {createMessage(LOADING_SCHEMA)}
      </Text>
    </LoadingContainer>
  );
};

export default DatasourceStructureLoadingContainer;
