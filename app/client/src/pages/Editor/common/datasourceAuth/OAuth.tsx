import { ButtonVariantTypes } from "components/constants";
import { AuthenticationStatus, Datasource } from "entities/Datasource";
import {
  ActionButton,
  SaveButtonContainer,
} from "pages/Editor/DataSourceEditor/JSONtoForm";
import React, { useEffect } from "react";
import styled from "styled-components";
import EditButton from "components/editorComponents/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  getEntities,
  getPluginTypeFromDatasourceId,
} from "selectors/entitiesSelector";
import {
  deleteDatasource,
  getOAuthAccessToken,
  redirectAuthorizationCode,
  updateDatasource,
} from "actions/datasourceActions";
import { AppState } from "reducers";
import {
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
} from "constants/messages";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useLocation, useParams } from "react-router";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";

interface Props {
  datasource: Datasource;
  getSanitizedFormData: () => Datasource;
  isInvalid: boolean;
  shouldRender: boolean;
}

enum AuthorizationStatus {
  SUCCESS = "success",
  APPSMITH_ERROR = "appsmith_error",
}

const StyledButton = styled(EditButton)`
  &&&& {
    height: 32px;
  }
`;

const StyledAuthMessage = styled.div`
  color: ${(props) => props.theme.colors.error};
  margin-top: 15px;
  &:after {
    content: " *";
    color: inherit;
  }
`;

function OAuth({
  datasource,
  getSanitizedFormData,
  isInvalid,
  shouldRender,
}: Props): JSX.Element {
  const { id: datasourceId } = datasource;
  const {
    datasources: { isDeleting, loading: isSaving },
  } = useSelector(getEntities);
  const isAuthorized =
    datasource.datasourceConfiguration.authentication?.authenticationStatus ===
    AuthenticationStatus.SUCCESS;

  const pluginType = useSelector((state: AppState) =>
    getPluginTypeFromDatasourceId(state, datasourceId),
  );

  const applicationId = useSelector(getCurrentApplicationId);

  const dispatch = useDispatch();
  const location = useLocation();
  const { pageId } = useParams<ExplorerURLParams>();

  const handleDatasourceSave = () => {
    dispatch(
      updateDatasource(
        getSanitizedFormData(),
        pluginType
          ? redirectAuthorizationCode(pageId, datasourceId, pluginType)
          : undefined,
      ),
    );
  };

  const handleDatasourceDelete = () => {
    dispatch(deleteDatasource({ id: datasourceId }));
  };

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const status = search.get("response_status");

    if (status) {
      const display_message = search.get("display_message");
      // Set default error message
      let message = OAUTH_AUTHORIZATION_FAILED;
      const variant = Variant.danger;
      if (status !== AuthorizationStatus.SUCCESS) {
        if (status === AuthorizationStatus.APPSMITH_ERROR) {
          message = OAUTH_AUTHORIZATION_APPSMITH_ERROR;
        }
        Toaster.show({ text: display_message || message, variant });
      } else {
        dispatch(getOAuthAccessToken(datasourceId));
      }
      AnalyticsUtil.logEvent("DATASOURCE_AUTH_COMPLETE", {
        applicationId,
        datasourceId,
        pageId,
      });
    }
  }, []);

  return (
    <>
      {!isAuthorized && (
        <StyledAuthMessage>Datasource not authorized</StyledAuthMessage>
      )}
      {shouldRender ? (
        <SaveButtonContainer>
          <ActionButton
            // accent="error"
            buttonStyle="DANGER"
            buttonVariant={ButtonVariantTypes.PRIMARY}
            className="t--delete-datasource"
            loading={isDeleting}
            onClick={handleDatasourceDelete}
            text="Delete"
          />

          <StyledButton
            className="t--save-datasource"
            disabled={isInvalid}
            filled
            intent="primary"
            loading={isSaving}
            onClick={handleDatasourceSave}
            size="small"
            text={isAuthorized ? "Save and Re-authorize" : "Save and Authorize"}
          />
        </SaveButtonContainer>
      ) : null}{" "}
    </>
  );
}

export default OAuth;
