import React from "react";
import styled from "styled-components";
import { Text, Button, Icon } from "design-system";
import type { APIResponseError } from "api/ApiResponses";
import {
  EDIT_DATASOURCE,
  STRUCTURE_NOT_FETCHED,
  TEST_DATASOURCE_AND_FIX_ERRORS,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DatasourceEditEntryPoints } from "constants/Datasource";

export type Props = {
  error: APIResponseError | undefined;
  setDatasourceViewMode: (viewMode: boolean) => void;
  datasourceId: string;
  pluginName: string;
};

const NotFoundContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const NotFoundInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const NotFoundText = styled(Text)<{ isApiErrorMsg?: boolean }>`
  margin-bottom: 0.5rem;
  text-align: center;
  ${(props) => props?.isApiErrorMsg && "width: 70%"}
`;

const ButtonWrapper = styled.div`
  width: fit-content;
`;

const IconWrapper = styled.div`
  width: fit-content;
  margin-bottom: 1rem;
`;

const DatasourceStructureNotFound = (props: Props) => {
  const { datasourceId, error, pluginName, setDatasourceViewMode } = props;

  const editDatasource = () => {
    setDatasourceViewMode(false);
    AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
      datasourceId: datasourceId,
      pluginName: pluginName,
      entryPoint:
        DatasourceEditEntryPoints.DATASOURCE_STRUCTURE_VIEW_MODE_EDIT_DATASOURCE,
    });
  };

  return (
    <NotFoundContainer>
      <NotFoundInfoWrapper>
        <IconWrapper>
          <Icon name="account-box-line" size={"lg"} />
        </IconWrapper>
        <NotFoundText kind="heading-xs" renderAs="p">
          {createMessage(STRUCTURE_NOT_FETCHED)}
        </NotFoundText>
        {error?.message && (
          <NotFoundText isApiErrorMsg kind="body-m" renderAs="p">
            {error.message}
          </NotFoundText>
        )}
        <NotFoundText kind="body-m" renderAs="p">
          {createMessage(TEST_DATASOURCE_AND_FIX_ERRORS)}
        </NotFoundText>
        <ButtonWrapper>
          <Button kind="secondary" onClick={editDatasource} size={"md"}>
            {createMessage(EDIT_DATASOURCE)}
          </Button>
        </ButtonWrapper>
      </NotFoundInfoWrapper>
    </NotFoundContainer>
  );
};

export default DatasourceStructureNotFound;
