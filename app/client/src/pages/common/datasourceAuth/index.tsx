import React, { useEffect } from "react";
import styled from "styled-components";
import {
  ActionButton,
  SaveButtonContainer,
} from "pages/Editor/DataSourceEditor/JSONtoForm";
import EditButton from "components/editorComponents/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  getEntities,
  getPluginTypeFromDatasourceId,
} from "selectors/entitiesSelector";
import {
  testDatasource,
  deleteDatasource,
  updateDatasource,
  redirectAuthorizationCode,
  getOAuthAccessToken,
} from "actions/datasourceActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { redirectToNewIntegrations } from "actions/apiPaneActions";
import { getQueryParams } from "utils/AppsmithUtils";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useParams, useLocation } from "react-router";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { ButtonVariantTypes } from "components/constants";
import { AppState } from "reducers";
import {
  AuthType,
  Datasource,
  AuthenticationStatus,
} from "entities/Datasource";
import {
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
} from "@appsmith/constants/messages";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

interface Props {
  datasource: Datasource;
  formData: Datasource;
  getSanitizedFormData: () => Datasource;
  isInvalid: boolean;
  shouldRender: boolean;
  datasourceButtonConfiguration: string[] | undefined;
}

export type DatasourceFormButtonTypes = Record<string, string[]>;

enum AuthorizationStatus {
  SUCCESS = "success",
  APPSMITH_ERROR = "appsmith_error",
}

export enum DatasourceButtonTypeEnum {
  DELETE = "DELETE",
  SAVE = "SAVE",
  TEST = "TEST",
  SAVE_AND_AUTHORIZE = "SAVE_AND_AUTHORIZE",
}

export const DatasourceButtonType: Record<
  keyof typeof DatasourceButtonTypeEnum, // using the key of ApiContentType enum as the key property of this Record type.
  string
> = {
  DELETE: "DELETE",
  SAVE: "SAVE",
  TEST: "TEST",
  SAVE_AND_AUTHORIZE: "SAVE_AND_AUTHORIZE",
};

const StyledButton = styled(EditButton)<{ fluidWidth?: boolean }>`
  &&&& {
    height: 32px;
    width: ${(props) => (props.fluidWidth ? "" : "87px")};
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

function DatasourceAuth({
  datasource,
  datasourceButtonConfiguration = ["DELETE", "SAVE"],
  formData,
  getSanitizedFormData,
  isInvalid,
  shouldRender,
}: Props) {
  const authType =
    formData &&
    formData.datasourceConfiguration?.authentication?.authenticationType;

  const { id: datasourceId } = datasource;
  const applicationId = useSelector(getCurrentApplicationId);

  // hooks
  const dispatch = useDispatch();
  const location = useLocation();
  const { pageId } = useParams<ExplorerURLParams>();

  useEffect(() => {
    if (authType === AuthType.OAUTH2) {
      // When the authorization server redirects a user to the datasource form page, the url contains the "response_status" query parameter .
      // Get the access token if response_status is successful else show a toast error

      const search = new URLSearchParams(location.search);
      const status = search.get("response_status");
      if (status) {
        const display_message = search.get("display_message");
        const variant = Variant.danger;

        if (status !== AuthorizationStatus.SUCCESS) {
          const message =
            status === AuthorizationStatus.APPSMITH_ERROR
              ? OAUTH_AUTHORIZATION_APPSMITH_ERROR
              : OAUTH_AUTHORIZATION_FAILED;
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
    }
  }, []);

  // selectors
  const {
    datasources: { isDeleting, isTesting, loading: isSaving },
  } = useSelector(getEntities);

  const pluginType = useSelector((state: AppState) =>
    getPluginTypeFromDatasourceId(state, datasourceId),
  );

  const isAuthorized =
    datasource.datasourceConfiguration.authentication?.authenticationStatus ===
    AuthenticationStatus.SUCCESS;

  // Button Operations for respective buttons.
  // Handles datasource deletion
  const handleDatasourceDelete = () => {
    dispatch(deleteDatasource({ id: datasourceId }));
  };

  // Handles datasource testing
  const handleDatasourceTest = () => {
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
    });
    dispatch(testDatasource(getSanitizedFormData()));
  };

  // Handles datasource saving
  const handleDefaultAuthDatasourceSave = () => {
    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
    });
    // After saving datasource, only redirect to the 'new integrations' page
    // if datasource is not used to generate a page
    dispatch(
      updateDatasource(
        getSanitizedFormData(),
        !isGeneratePageInitiator
          ? dispatch(
              redirectToNewIntegrations(
                applicationId,
                pageId,
                getQueryParams(),
              ),
            )
          : undefined,
      ),
    );
  };

  // Handles Oauth datasource saving
  const handleOauthDatasourceSave = () => {
    dispatch(
      updateDatasource(
        getSanitizedFormData(),
        pluginType
          ? redirectAuthorizationCode(pageId, datasourceId, pluginType)
          : undefined,
      ),
    );
  };

  const datasourceButtonsComponentMap = (buttonType: string): JSX.Element => {
    return {
      [DatasourceButtonType.DELETE]: (
        <ActionButton
          buttonStyle="DANGER"
          buttonVariant={ButtonVariantTypes.PRIMARY}
          // accent="error"
          className="t--delete-datasource"
          loading={isDeleting}
          onClick={handleDatasourceDelete}
          text="Delete"
        />
      ),
      [DatasourceButtonType.TEST]: (
        <ActionButton
          // accent="secondary"
          buttonStyle="PRIMARY"
          buttonVariant={ButtonVariantTypes.SECONDARY}
          className="t--test-datasource"
          loading={isTesting}
          onClick={handleDatasourceTest}
          text="Test"
        />
      ),
      [DatasourceButtonType.SAVE]: (
        <StyledButton
          className="t--save-datasource"
          disabled={isInvalid}
          filled
          intent="primary"
          loading={isSaving}
          onClick={handleDefaultAuthDatasourceSave}
          size="small"
          text="Save"
        />
      ),
      [DatasourceButtonType.SAVE_AND_AUTHORIZE]: (
        <StyledButton
          className="t--save-datasource"
          disabled={isInvalid}
          filled
          fluidWidth
          intent="primary"
          loading={isSaving}
          onClick={handleOauthDatasourceSave}
          size="small"
          text={isAuthorized ? "Save and Re-authorize" : "Save and Authorize"}
        />
      ),
    }[buttonType];
  };

  return (
    <>
      {authType === AuthType.OAUTH2 && !isAuthorized && (
        <StyledAuthMessage>Datasource not authorized</StyledAuthMessage>
      )}
      {shouldRender && (
        <SaveButtonContainer>
          {datasourceButtonConfiguration?.map((btnConfig) =>
            datasourceButtonsComponentMap(btnConfig),
          )}
        </SaveButtonContainer>
      )}
      {""}
    </>
  );
}

export default DatasourceAuth;
