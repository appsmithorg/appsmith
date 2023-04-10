import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ActionButton } from "pages/Editor/DataSourceEditor/JSONtoForm";
import { useDispatch, useSelector } from "react-redux";
import {
  getEntities,
  getPluginNameFromId,
  getPluginTypeFromDatasourceId,
  getPluginPackageFromDatasourceId,
} from "selectors/entitiesSelector";
import {
  testDatasource,
  deleteDatasource,
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
import type { AppState } from "@appsmith/reducers";
import type { Datasource } from "entities/Datasource";
import { AuthType, AuthenticationStatus } from "entities/Datasource";
import {
  CONFIRM_CONTEXT_DELETING,
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
} from "@appsmith/constants/messages";
import { Category, Toaster, Variant } from "design-system-old";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "@appsmith/constants/messages";
import { debounce } from "lodash";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";

import {
  hasDeleteDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";

interface Props {
  datasource: Datasource;
  formData: Datasource | ApiDatasourceForm;
  getSanitizedFormData: () => Datasource;
  isInvalid: boolean;
  pageId?: string;
  shouldRender?: boolean;
  datasourceButtonConfiguration: string[] | undefined;
  shouldDisplayAuthMessage?: boolean;
  triggerSave?: boolean;
  isFormDirty?: boolean;
  datasourceDeleteTrigger: () => void;
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
  keyof typeof DatasourceButtonTypeEnum,
  string
> = {
  DELETE: "DELETE",
  SAVE: "SAVE",
  TEST: "TEST",
  SAVE_AND_AUTHORIZE: "SAVE_AND_AUTHORIZE",
};

const StyledButton = styled(ActionButton)<{ fluidWidth?: boolean }>`
  &&&& {
    height: 32px;
    width: ${(props) => (props.fluidWidth ? "" : "87px")};
  }
`;

const SaveButtonContainer = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding-right: 20px;
`;

const StyledAuthMessage = styled.div`
  color: ${(props) => props.theme.colors.error};
  margin-top: 15px;
  padding-left: 20px;
  &:after {
    content: " *";
    color: inherit;
  }
`;

function DatasourceAuth({
  datasource,
  datasourceButtonConfiguration = ["DELETE", "SAVE"],
  datasourceDeleteTrigger,
  formData,
  getSanitizedFormData,
  isInvalid,
  pageId: pageIdProp,
  shouldRender,
  shouldDisplayAuthMessage = true,
  triggerSave,
  isFormDirty,
}: Props) {
  const authType =
    formData && "authType" in formData
      ? formData?.authType
      : formData?.datasourceConfiguration?.authentication?.authenticationType;

  const { id: datasourceId, isDeleting, pluginId } = datasource;
  const applicationId = useSelector(getCurrentApplicationId);
  const pluginName = useSelector((state: AppState) =>
    getPluginNameFromId(state, pluginId),
  );
  const pluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, datasource?.id || ""),
  );

  const datasourcePermissions = datasource.userPermissions || [];

  const canManageDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  const canDeleteDatasource = hasDeleteDatasourcePermission(
    datasourcePermissions,
  );

  // hooks
  const dispatch = useDispatch();
  const location = useLocation();
  const { pageId: pageIdQuery } = useParams<ExplorerURLParams>();

  const pageId = (pageIdQuery || pageIdProp) as string;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dsName = datasource?.name;
  const orgId = datasource?.workspaceId;

  useEffect(() => {
    if (confirmDelete) {
      delayConfirmDeleteToFalse();
    }
  }, [confirmDelete]);

  useEffect(() => {
    if (authType === AuthType.OAUTH2) {
      // When the authorization server redirects a user to the datasource form page, the url contains the "response_status" query parameter .
      // Get the access token if response_status is successful else show a toast error

      const search = new URLSearchParams(location.search);
      const status = search.get("response_status");
      const queryIsImport = search.get("importForGit");
      const queryDatasourceId = search.get("datasourceId");
      const shouldNotify =
        !queryIsImport || (queryIsImport && queryDatasourceId === datasourceId);
      if (status && shouldNotify) {
        const display_message = search.get("display_message");
        const variant = Variant.danger;

        if (status !== AuthorizationStatus.SUCCESS) {
          const message =
            status === AuthorizationStatus.APPSMITH_ERROR
              ? OAUTH_AUTHORIZATION_APPSMITH_ERROR
              : OAUTH_AUTHORIZATION_FAILED;
          Toaster.show({ text: display_message || message, variant });
          const oAuthStatus = status;
          AnalyticsUtil.logEvent("UPDATE_DATASOURCE", {
            dsName,
            oAuthStatus,
            orgId,
            pluginName,
          });
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

  // selectors
  const {
    datasources: { isTesting, loading: isSaving },
  } = useSelector(getEntities);

  const delayConfirmDeleteToFalse = debounce(
    () => setConfirmDelete(false),
    2200,
  );

  const pluginType = useSelector((state: AppState) =>
    getPluginTypeFromDatasourceId(state, datasourceId),
  );

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

  // Handles datasource deletion
  const handleDatasourceDelete = () => {
    dispatch(deleteDatasource({ id: datasourceId }));
    datasourceDeleteTrigger();
  };

  // Handles datasource testing
  const handleDatasourceTest = () => {
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: pageId,
      appId: applicationId,
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
      dispatch(setDatasourceViewMode(true));
      // we dont need to redirect it to active ds list instead ds would be shown in view only mode
      dispatch(updateDatasource(getSanitizedFormData()));
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
      dispatch(setDatasourceViewMode(true));
      dispatch(
        updateDatasource(
          getSanitizedFormData(),
          pluginType
            ? redirectAuthorizationCode(pageId, datasourceId, pluginType)
            : undefined,
        ),
      );
    }
  };

  const createMode = datasourceId === TEMP_DATASOURCE_ID;

  const datasourceButtonsComponentMap = (buttonType: string): JSX.Element => {
    return {
      [DatasourceButtonType.DELETE]: (
        <ActionButton
          category={Category.primary}
          className="t--delete-datasource"
          disabled={createMode || !canDeleteDatasource}
          isLoading={isDeleting}
          key={buttonType}
          onClick={() => {
            if (!isDeleting) {
              confirmDelete ? handleDatasourceDelete() : setConfirmDelete(true);
            }
          }}
          size="medium"
          tag="button"
          text={
            isDeleting
              ? createMessage(CONFIRM_CONTEXT_DELETING)
              : confirmDelete
              ? createMessage(CONFIRM_CONTEXT_DELETE)
              : createMessage(CONTEXT_DELETE)
          }
          variant={Variant.danger}
        />
      ),
      [DatasourceButtonType.TEST]: (
        <ActionButton
          category={Category.secondary}
          className="t--test-datasource"
          isLoading={isTesting}
          key={buttonType}
          onClick={handleDatasourceTest}
          size="medium"
          tag="button"
          text="Test"
          variant={Variant.success}
        />
      ),
      [DatasourceButtonType.SAVE]: (
        <ActionButton
          category={Category.primary}
          className="t--save-datasource"
          disabled={
            isInvalid || !isFormDirty || (!createMode && !canManageDatasource)
          }
          filled
          isLoading={isSaving}
          key={buttonType}
          onClick={handleDefaultAuthDatasourceSave}
          size="medium"
          tag="button"
          text="Save"
          variant={Variant.success}
        />
      ),
      [DatasourceButtonType.SAVE_AND_AUTHORIZE]: (
        <StyledButton
          category={Category.primary}
          className="t--save-datasource"
          disabled={isInvalid || (!createMode && !canManageDatasource)}
          filled
          fluidWidth
          isLoading={isSaving}
          key={buttonType}
          onClick={handleOauthDatasourceSave}
          size="medium"
          tag="button"
          text="Save and Authorize"
          variant={Variant.success}
        />
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
        <SaveButtonContainer>
          {datasourceButtonConfiguration?.map((btnConfig) =>
            datasourceButtonsComponentMap(btnConfig),
          )}
        </SaveButtonContainer>
      )}
    </>
  );
}

export default DatasourceAuth;
