import { ButtonVariantTypes } from "components/constants";
import { Datasource } from "entities/Datasource";
import {
  ActionButton,
  SaveButtonContainer,
} from "pages/Editor/DataSourceEditor/JSONtoForm";
import React from "react";
import styled from "styled-components";
import EditButton from "components/editorComponents/Button";
import { useDispatch, useSelector } from "react-redux";
import { getEntities } from "selectors/entitiesSelector";
import {
  testDatasource,
  deleteDatasource,
  updateDatasource,
} from "actions/datasourceActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { redirectToNewIntegrations } from "actions/apiPaneActions";
import { getQueryParams } from "utils/AppsmithUtils";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useParams } from "react-router";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";

interface Props {
  datasource: Datasource;
  getSanitizedFormData: () => Datasource;
  isInvalid: boolean;
  shouldRender: boolean;
}
const StyledButton = styled(EditButton)`
  &&&& {
    width: 87px;
    height: 32px;
  }
`;

export default function DefaultAuth({
  datasource,
  getSanitizedFormData,
  isInvalid,
  shouldRender,
}: Props): JSX.Element {
  const { id: datasourceId } = datasource;

  const applicationId = useSelector(getCurrentApplicationId);

  const dispatch = useDispatch();

  const {
    datasources: { isDeleting, isTesting, loading: isSaving },
  } = useSelector(getEntities);
  const { pageId } = useParams<ExplorerURLParams>();

  const handleDatasourceDelete = () => {
    dispatch(deleteDatasource({ id: datasourceId }));
  };

  const handleDatasourceTest = () => {
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
    });
    dispatch(testDatasource(getSanitizedFormData()));
  };

  const handleDatasourceSave = () => {
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
    });
    dispatch(
      updateDatasource(
        getSanitizedFormData(),
        redirectToNewIntegrations(applicationId, pageId, getQueryParams()),
      ),
    );
  };

  return (
    <>
      {shouldRender && (
        <SaveButtonContainer>
          <ActionButton
            buttonStyle="DANGER"
            buttonVariant={ButtonVariantTypes.PRIMARY}
            // accent="error"
            className="t--delete-datasource"
            loading={isDeleting}
            onClick={handleDatasourceDelete}
            text="Delete"
          />

          <ActionButton
            // accent="secondary"
            buttonStyle="PRIMARY"
            buttonVariant={ButtonVariantTypes.SECONDARY}
            className="t--test-datasource"
            loading={isTesting}
            onClick={handleDatasourceTest}
            text="Test"
          />
          <StyledButton
            className="t--save-datasource"
            disabled={isInvalid}
            filled
            intent="primary"
            loading={isSaving}
            onClick={handleDatasourceSave}
            size="small"
            text="Save"
          />
        </SaveButtonContainer>
      )}
      {""}
    </>
  );
}
