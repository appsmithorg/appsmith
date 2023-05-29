import React, { useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  testDatasource,
  updateDatasource,
  redirectAuthorizationCode,
  getOAuthAccessToken,
  setDatasourceViewMode,
  createDatasourceFromForm,
  toggleSaveActionFlag,
} from "actions/datasourceActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useParams, useLocation } from "react-router";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import type { Datasource } from "entities/Datasource";
import { AuthType, AuthenticationStatus } from "entities/Datasource";
import {
  CANCEL,
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
  SAVE_AND_AUTHORIZE_BUTTON_TEXT,
  SAVE_BUTTON_TEXT,
  TEST_BUTTON_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, toast } from "design-system";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";

import { hasManageDatasourcePermission } from "@appsmith/utils/permissionHelpers";
import { SHOW_FILE_PICKER_KEY } from "constants/routes";
import { Colors } from "constants/Colors";
import type { PluginType } from "entities/Action";

interface Props {
  datasource: Datasource;
  formData: Datasource | ApiDatasourceForm;
  getSanitizedFormData: () => Datasource;
  deleteTempDSFromDraft: () => void;
  isInvalid: boolean;
  pageId?: string;
  viewMode?: boolean;
  shouldRender?: boolean;
  isInsideReconnectModal?: boolean;
  datasourceButtonConfiguration: string[] | undefined;
  pluginType: PluginType;
  pluginName: string;
  pluginPackageName: string;
  isSaving: boolean;
  isTesting: boolean;
  shouldDisplayAuthMessage?: boolean;
  triggerSave?: boolean;
  isFormDirty?: boolean;
  scopeValue?: string;
  showFilterComponent: boolean;
}

export type DatasourceFormButtonTypes = Record<string, string[]>;

export enum AuthorizationStatus {
  SUCCESS = "success",
  APPSMITH_ERROR = "appsmith_error",
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
  showFilterComponent: boolean;
}>`
  &&& {
    // Pulling button to the left if floatLeft is set as true
    margin-right: ${(props) => (props.floatLeft ? "auto" : "9px")};
    // If filter component is present, then we need to push the button to the right
    margin-left: ${(props) => (props.showFilterComponent ? "24px" : "0px")};
  }
`;

const SaveButtonContainer = styled.div<{
  isInsideReconnectModal?: boolean;
}>`
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding-right: 20px;
  flex: 1 1 10%;
  border-top: ${(props) =>
    props.isInsideReconnectModal ? "none" : `1px solid ${Colors.ALTO}`};
  align-items: center;
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
  datasource,
  datasourceButtonConfiguration = [
    DatasourceButtonTypeEnum.CANCEL,
    DatasourceButtonTypeEnum.SAVE,
  ],
  deleteTempDSFromDraft,
  formData,
  getSanitizedFormData,
  isInvalid,
  pageId: pageIdProp,
  pluginType,
  pluginName,
  pluginPackageName,
  isSaving,
  isTesting,
  viewMode,
  shouldDisplayAuthMessage = true,
  triggerSave,
  isFormDirty,
  scopeValue,
  isInsideReconnectModal,
  showFilterComponent,
}: Props) {
  const shouldRender = !viewMode || isInsideReconnectModal;
  const authType =
    formData && "authType" in formData
      ? formData?.authType
      : formData?.datasourceConfiguration?.authentication?.authenticationType;

  const { id: datasourceId } = datasource;
  const applicationId = useSelector(getCurrentApplicationId);

  const datasourcePermissions = datasource.userPermissions || [];

  const canManageDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  // hooks
  const dispatch = useDispatch();
  const location = useLocation();
  const { pageId: pageIdQuery } = useParams<ExplorerURLParams>();

  const pageId = (pageIdQuery || pageIdProp) as string;

  const dsName = datasource?.name;
  const orgId = datasource?.workspaceId;

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
        const oauthReason = status;
        AnalyticsUtil.logEvent("DATASOURCE_AUTHORIZE_RESULT", {
          dsName,
          oauthReason,
          orgId,
          pluginName,
        });
        if (status !== AuthorizationStatus.SUCCESS) {
          const message =
            status === AuthorizationStatus.APPSMITH_ERROR
              ? OAUTH_AUTHORIZATION_APPSMITH_ERROR
              : OAUTH_AUTHORIZATION_FAILED;
          toast.show(display_message || message, { kind: "error" });
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
    datasource?.datasourceConfiguration?.authentication
      ?.authenticationStatus === AuthenticationStatus.SUCCESS;

  // Button Operations for respective buttons.

  // Handles datasource testing
  const handleDatasourceTest = () => {
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
      datasourceId: datasourceId,
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
          pluginType
            ? redirectAuthorizationCode(pageId, datasourceId, pluginType)
            : undefined,
        ),
      );
    }
    AnalyticsUtil.logEvent("DATASOURCE_AUTHORIZE_CLICK", {
      dsName,
      orgId,
      pluginName,
      scopeValue,
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
          showFilterComponent={showFilterComponent}
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
            if (createMode) deleteTempDSFromDraft();
            else dispatch(setDatasourceViewMode(true));
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
            isInvalid || !isFormDirty || (!createMode && !canManageDatasource)
          }
          isLoading={isSaving}
          key={buttonType}
          onClick={handleDefaultAuthDatasourceSave}
          size="md"
        >
          {createMessage(SAVE_BUTTON_TEXT)}
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
