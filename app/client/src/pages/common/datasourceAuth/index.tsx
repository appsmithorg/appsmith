import React, { useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  testDatasource,
  updateDatasource,
  redirectAuthorizationCode,
  getOAuthAccessToken,
  createDatasourceFromForm,
  toggleSaveActionFlag,
  updateDatasourceAuthState,
} from "actions/datasourceActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useParams, useLocation, useHistory } from "react-router";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import type { Datasource } from "entities/Datasource";
import { AuthType, AuthenticationStatus } from "entities/Datasource";
import {
  CANCEL,
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
  SAVE_AND_AUTHORIZE_BUTTON_TEXT,
  SAVE_AND_RE_AUTHORIZE_BUTTON_TEXT,
  SAVE_BUTTON_TEXT,
  TEST_BUTTON_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, toast } from "design-system";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { INTEGRATION_TABS, SHOW_FILE_PICKER_KEY } from "constants/routes";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { getQueryParams } from "utils/URLUtils";
import type { AppsmithLocationState } from "utils/history";
import type { PluginType } from "entities/Action";
import { getCurrentEnvironmentDetails } from "@appsmith/selectors/environmentSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasManageDatasourcePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

interface Props {
  datasource: Datasource;
  formData: Datasource | ApiDatasourceForm;
  getSanitizedFormData: () => Datasource;
  currentEnvironment: string;
  isInvalid: boolean;
  pageId?: string;
  formName: string;
  viewMode?: boolean;
  shouldRender?: boolean;
  isInsideReconnectModal?: boolean;
  datasourceButtonConfiguration: string[] | undefined;
  pluginType: PluginType;
  pluginName: string;
  pluginPackageName: string;
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => void;
  isSaving: boolean;
  isTesting: boolean;
  shouldDisplayAuthMessage?: boolean;
  triggerSave?: boolean;
  isFormDirty?: boolean;
  scopeValue?: string;
  onCancel: () => void;
}

export type DatasourceFormButtonTypes = Record<string, string[]>;

export enum AuthorizationStatus {
  SUCCESS = "success",
  APPSMITH_ERROR = "appsmith_error",
  ACCESS_DENIED = "access_denied",
}

export enum DatasourceButtonTypeEnum {
  SAVE = "SAVE",
  TEST = "TEST",
  CANCEL = "CANCEL",
  SAVE_AND_AUTHORIZE = "SAVE_AND_AUTHORIZE",
}

export const DatasourceButtonType: Record<
  keyof typeof DatasourceButtonTypeEnum,
  string
> = {
  SAVE: "SAVE",
  TEST: "TEST",
  CANCEL: "CANCEL",
  SAVE_AND_AUTHORIZE: "SAVE_AND_AUTHORIZE",
};

export const ActionButton = styled(Button)<{
  floatLeft: boolean;
}>`
  &&& {
    // Pulling button to the left if floatLeft is set as true
    margin-right: ${(props) => (props.floatLeft ? "auto" : "9px")};
    margin-left: ${(props) => (props.floatLeft ? "16px" : "0px")};
  }
`;

const SaveButtonContainer = styled.div<{
  isInsideReconnectModal?: boolean;
}>`
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding-right: 20px;
  border-top: ${(props) =>
    props.isInsideReconnectModal ? "none" : "1px solid"};
  border-color: var(--ads-v2-color-border);
  align-items: center;
  height: 68px;
`;

const StyledAuthMessage = styled.div`
  color: var(--ads-v2-color-fg-error);
  margin-top: 15px;
  &:after {
    content: " *";
    color: inherit;
  }
`;

function DatasourceAuth({
  currentEnvironment,
  datasource,
  datasourceButtonConfiguration = [
    DatasourceButtonTypeEnum.CANCEL,
    DatasourceButtonTypeEnum.SAVE,
  ],
  formData,
  getSanitizedFormData,
  isFormDirty,
  isInsideReconnectModal,
  isInvalid,
  isSaving,
  isTesting,
  onCancel,
  pageId: pageIdProp = "",
  pluginName,
  pluginPackageName,
  pluginType,
  scopeValue,
  shouldDisplayAuthMessage = true,
  triggerSave,
  viewMode,
}: Props) {
  const shouldRender = !viewMode || isInsideReconnectModal;
  const authType =
    formData && "authType" in formData
      ? formData?.authType
      : formData?.datasourceStorages &&
        formData?.datasourceStorages[currentEnvironment]
          ?.datasourceConfiguration?.authentication?.authenticationType;

  const { id: datasourceId } = datasource;
  const applicationId = useSelector(getCurrentApplicationId);

  const datasourcePermissions = datasource.userPermissions || [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canManageDatasource = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const currentEnvDetails = useSelector(getCurrentEnvironmentDetails);

  // hooks
  const dispatch = useDispatch();
  const location = useLocation();
  const { pageId: pageIdQuery } = useParams<ExplorerURLParams>();
  const history = useHistory<AppsmithLocationState>();

  const pageId = isInsideReconnectModal
    ? pageIdProp
    : ((pageIdQuery || pageIdProp) as string);

  useEffect(() => {
    if (authType === AuthType.OAUTH2) {
      // When the authorization server redirects a user to the datasource form page, the url contains the "response_status" query parameter .
      // Get the access token if response_status is successful else show a toast error

      const search = new URLSearchParams(location.search);
      const status = search.get("response_status");
      const queryIsImport = search.get("importForGit");
      const queryDatasourceId = search.get("datasourceId");
      const showFilePicker = search.get(SHOW_FILE_PICKER_KEY);
      const shouldNotify =
        !queryIsImport ||
        (queryIsImport &&
          queryDatasourceId === datasourceId &&
          !showFilePicker);
      if (status && shouldNotify) {
        const display_message = search.get("display_message");
        if (status !== AuthorizationStatus.SUCCESS) {
          const message =
            status === AuthorizationStatus.APPSMITH_ERROR
              ? OAUTH_AUTHORIZATION_APPSMITH_ERROR
              : OAUTH_AUTHORIZATION_FAILED;
          toast.show(display_message || message, { kind: "error" });
          AnalyticsUtil.logEvent("DATASOURCE_AUTH_COMPLETE", {
            applicationId: applicationId,
            datasourceId: datasourceId,
            pageId: pageId,
            oAuthPassOrFailVerdict: status,
            workspaceId: datasource?.workspaceId,
            datasourceName: datasource?.name,
            pluginName: pluginName,
          });

          if (status === AuthorizationStatus.ACCESS_DENIED) {
            dispatch(
              updateDatasourceAuthState(
                datasource,
                AuthenticationStatus.FAILURE_ACCESS_DENIED,
              ),
            );
          }
        } else {
          dispatch(getOAuthAccessToken(datasourceId));
        }
      }
    }
  }, [authType]);

  useEffect(() => {
    if (triggerSave) {
      if (pluginType === "SAAS") {
        handleOauthDatasourceSave();
      } else {
        handleDefaultAuthDatasourceSave();
      }
    }
  }, [triggerSave]);
  const isAuthorized =
    datasource?.datasourceStorages && authType === AuthType.OAUTH2
      ? datasource?.datasourceStorages[currentEnvDetails.editingId]
          ?.datasourceConfiguration?.authentication?.isAuthorized
      : datasource?.datasourceStorages[currentEnvironment]
          ?.datasourceConfiguration?.authentication?.authenticationStatus ===
        AuthenticationStatus.SUCCESS;

  // Button Operations for respective buttons.

  // Handles datasource testing
  const handleDatasourceTest = () => {
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
      datasourceId: datasourceId,
      environmentId: currentEnvironment,
      environmentName: currentEnvDetails.name,
      pluginName: pluginName,
    });
    dispatch(testDatasource(getSanitizedFormData()));
  };

  // Handles default auth datasource saving
  const handleDefaultAuthDatasourceSave = () => {
    dispatch(toggleSaveActionFlag(true));
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
      environmentId: currentEnvironment,
      environmentName: currentEnvDetails.name,
      pluginName: pluginName || "",
      pluginPackageName: pluginPackageName || "",
    });
    // After saving datasource, only redirect to the 'new integrations' page
    // if datasource is not used to generate a page
    if (datasource.id === TEMP_DATASOURCE_ID) {
      dispatch(createDatasourceFromForm(getSanitizedFormData()));
    } else {
      dispatch(
        updateDatasource(
          getSanitizedFormData(),
          currentEnvironment,
          undefined,
          undefined,
          isInsideReconnectModal,
        ),
      );
    }
  };

  // Handles Oauth datasource saving
  const handleOauthDatasourceSave = () => {
    dispatch(toggleSaveActionFlag(true));
    if (datasource.id === TEMP_DATASOURCE_ID) {
      dispatch(
        createDatasourceFromForm(
          getSanitizedFormData(),
          pluginType
            ? redirectAuthorizationCode(pageId, datasourceId, pluginType)
            : undefined,
        ),
      );
    } else {
      dispatch(
        updateDatasource(
          getSanitizedFormData(),
          currentEnvironment,
          pluginType
            ? redirectAuthorizationCode(pageId, datasourceId, pluginType)
            : undefined,
        ),
      );
    }
    AnalyticsUtil.logEvent("DATASOURCE_AUTHORIZE_CLICK", {
      dsName: datasource?.name,
      orgId: datasource?.workspaceId,
      pluginName: pluginName,
      scopeValue: scopeValue,
    });
  };

  const createMode = datasourceId === TEMP_DATASOURCE_ID;
  const datasourceButtonsComponentMap = (buttonType: string): JSX.Element => {
    return {
      [DatasourceButtonType.TEST]: (
        <ActionButton
          className="t--test-datasource"
          floatLeft={!isInsideReconnectModal}
          isLoading={isTesting}
          key={buttonType}
          kind="secondary"
          onClick={handleDatasourceTest}
          size="md"
        >
          {createMessage(TEST_BUTTON_TEXT)}
        </ActionButton>
      ),
      [DatasourceButtonType.CANCEL]: (
        <Button
          className="t--cancel-edit-datasource"
          key={buttonType}
          kind="tertiary"
          onClick={() => {
            if (createMode) {
              const URL = integrationEditorURL({
                pageId,
                selectedTab: INTEGRATION_TABS.NEW,
                params: getQueryParams(),
              });
              history.push(URL);
            } else {
              !!onCancel && onCancel();
            }
          }}
          size="md"
        >
          {createMessage(CANCEL)}
        </Button>
      ),
      [DatasourceButtonType.SAVE]: (
        <Button
          className="t--save-datasource"
          isDisabled={
            isInvalid ||
            (!createMode && !isFormDirty) ||
            (!createMode && !canManageDatasource)
          }
          isLoading={isSaving}
          key={buttonType}
          onClick={
            authType === AuthType.OAUTH2
              ? handleOauthDatasourceSave
              : handleDefaultAuthDatasourceSave
          }
          size="md"
        >
          {authType === AuthType.OAUTH2
            ? isAuthorized
              ? createMessage(SAVE_AND_RE_AUTHORIZE_BUTTON_TEXT)
              : createMessage(SAVE_AND_AUTHORIZE_BUTTON_TEXT)
            : createMessage(SAVE_BUTTON_TEXT)}
        </Button>
      ),
      [DatasourceButtonType.SAVE_AND_AUTHORIZE]: (
        <Button
          className="t--save-datasource"
          isDisabled={isInvalid || (!createMode && !canManageDatasource)}
          isLoading={isSaving}
          key={buttonType}
          onClick={handleOauthDatasourceSave}
          size="md"
        >
          {createMessage(SAVE_AND_AUTHORIZE_BUTTON_TEXT)}
        </Button>
      ),
    }[buttonType];
  };

  return (
    <>
      {authType === AuthType.OAUTH2 &&
        !isAuthorized &&
        shouldDisplayAuthMessage && (
          <StyledAuthMessage>Datasource not authorized</StyledAuthMessage>
        )}
      {shouldRender && (
        <SaveButtonContainer isInsideReconnectModal={isInsideReconnectModal}>
          {datasourceButtonConfiguration?.map((btnConfig) =>
            datasourceButtonsComponentMap(btnConfig),
          )}
        </SaveButtonContainer>
      )}
    </>
  );
}

export default DatasourceAuth;
