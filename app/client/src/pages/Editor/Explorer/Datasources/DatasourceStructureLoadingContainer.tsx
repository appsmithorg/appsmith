import React from "react";
import { createMessage, LOADING_SCHEMA } from "@appsmith/constants/messages";
import { Spinner, Text } from "design-system";
import styled from "styled-components";

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  & > p {
    margin-left: 0.5rem;
  }
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DatasourceStructureLoadingContainer = () => {
  return (
    <LoadingContainer>
      <SpinnerWrapper>
        <Spinner size={"sm"} />
      </SpinnerWrapper>
      <Text kind="body-m" renderAs="p">
        {createMessage(LOADING_SCHEMA)}
      </Text>
    </LoadingContainer>
  );
};

export default DatasourceStructureLoadingContainer;
