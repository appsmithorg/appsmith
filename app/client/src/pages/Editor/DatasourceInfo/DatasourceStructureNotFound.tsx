import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Text, Button } from "@appsmith/ads";
import type { APIResponseError } from "api/ApiResponses";
import { EDIT_DATASOURCE, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { DatasourceEditEntryPoints } from "constants/Datasource";
import history from "utils/history";
import { getQueryParams } from "utils/URLUtils";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { omit } from "lodash";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { DatasourceStructureContext } from "entities/Datasource";

export interface Props {
  error: APIResponseError | { message: string } | undefined;
  datasourceId: string;
  pluginName?: string;
  customEditDatasourceFn?: () => void;
  context: DatasourceStructureContext;
}

const NotFoundContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
`;

const NotFoundText = styled(Text)`
  margin-bottom: 1rem;
  margin-top: 0.3rem;
`;

const ButtonWrapper = styled.div`
  width: fit-content;
`;

const DatasourceStructureNotFound = (props: Props) => {
  const { datasourceId, error, pluginName } = props;

  const basePageId = useSelector(getCurrentBasePageId);

  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
  const editDatasource = () => {
    let entryPoint = DatasourceEditEntryPoints.QUERY_EDITOR_DATASOURCE_SCHEMA;

    if (props.context === DatasourceStructureContext.DATASOURCE_VIEW_MODE) {
      entryPoint = DatasourceEditEntryPoints.DATASOURCE_VIEW_MODE_EDIT;
    }

    AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
      datasourceId: datasourceId,
      pluginName: pluginName,
      entryPoint: entryPoint,
    });

    if (props.context === DatasourceStructureContext.DATASOURCE_VIEW_MODE) {
      props?.customEditDatasourceFn && props?.customEditDatasourceFn();

      return;
    }

    const url = datasourcesEditorIdURL({
      basePageId,
      datasourceId: datasourceId,
      params: { ...omit(getQueryParams(), "viewMode"), viewMode: false },
      generateEditorPath: true,
    });

    history.push(url);
  };

  return (
    <NotFoundContainer>
      {error?.message && (
        <NotFoundText kind="body-s" renderAs="p">
          {error.message}
        </NotFoundText>
      )}
      <ButtonWrapper>
        <Button kind="secondary" onClick={editDatasource} size={"md"}>
          {createMessage(EDIT_DATASOURCE)}
        </Button>
      </ButtonWrapper>
    </NotFoundContainer>
  );
};

export default DatasourceStructureNotFound;
