import React from "react";
import type { EmbeddedRestDatasource } from "entities/Datasource";
import { get, merge } from "lodash";
import styled from "styled-components";
import { connect, useSelector } from "react-redux";
import { AuthType } from "entities/Datasource/RestAPIForm";
import { formValueSelector } from "redux-form";
import type { AppState } from "ee/reducers";
import {
  EDIT_DATASOURCE_MESSAGE,
  OAUTH_2_0,
  OAUTH_ERROR,
  SAVE_DATASOURCE_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import StoreAsDatasource from "components/editorComponents/StoreAsDatasource";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { Icon, Text } from "@appsmith/ads";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasCreateDatasourcePermission,
  getHasManageDatasourcePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
interface ReduxStateProps {
  datasource: EmbeddedRestDatasource;
}

const AuthContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: var(--ads-v2-spaces-5);
  gap: var(--ads-v2-spaces-3);
`;

const OAuthContainer = styled.div`
  background: #ffffff;
  display: flex;
  flex-direction: row;
  padding: 12px 5px;
`;
interface ErrorProps {
  hasError: boolean;
}

// TODO (tanvi): this should probably be a different component?
const OAuthText = styled.span<ErrorProps>`
  color: ${(props) =>
    props.hasError
      ? "var(--ads-v2-color-fg-error)"
      : "var(--ads-v2-color-fg-success)"};
  margin-left: 5px;
`;

function OAuthLabel(props: ErrorProps) {
  return (
    <OAuthContainer>
      <Icon
        color={
          props.hasError
            ? "var(--ads-v2-color-fg-error)"
            : "var(--ads-v2-color-fg-success)"
        }
        name="shield"
        size="md"
      />
      <OAuthText hasError={props.hasError}>
        {props.hasError ? OAUTH_ERROR() : OAUTH_2_0()}
      </OAuthText>
    </OAuthContainer>
  );
}

type Props = ReduxStateProps;

function ApiAuthentication(props: Props): JSX.Element {
  const { datasource } = props;
  const authType: string = get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
    "",
  );

  const hasError = !get(datasource, "isValid", true);

  const shouldSave = datasource && !("id" in datasource);

  const datasourceId = get(datasource, "id");

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state)?.userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  const datasourcePermissions = datasource?.userPermissions || [];

  const canManageDatasource = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const isEnabled =
    (shouldSave && canCreateDatasource) || (!shouldSave && canManageDatasource);

  return (
    <AuthContainer>
      {authType === AuthType.OAuth2 && <OAuthLabel hasError={hasError} />}
      <Text kind="body-m">
        {shouldSave
          ? createMessage(SAVE_DATASOURCE_MESSAGE)
          : createMessage(EDIT_DATASOURCE_MESSAGE)}
      </Text>
      <StoreAsDatasource
        datasourceId={datasourceId}
        enable={isEnabled}
        shouldSave={shouldSave}
      />
    </AuthContainer>
  );
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, ownProps: any): ReduxStateProps => {
  const apiFormValueSelector = formValueSelector(ownProps.formName);
  const datasourceFromAction = apiFormValueSelector(state, "datasource");
  const currentEnvironment = getCurrentEnvironmentId(state);
  let datasourceMerged: EmbeddedRestDatasource = datasourceFromAction;
  if (datasourceFromAction && "id" in datasourceFromAction) {
    const datasourceFromDataSourceList = state.entities.datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
    if (datasourceFromDataSourceList) {
      const { datasourceStorages } = datasourceFromDataSourceList;
      let dsObjectToMerge = {};
      // in case the datasource is not configured for the current environment, we just merge with empty object
      if (datasourceStorages.hasOwnProperty(currentEnvironment)) {
        dsObjectToMerge = datasourceStorages[currentEnvironment];
      }
      datasourceMerged = merge({}, datasourceFromAction, dsObjectToMerge);

      // update the id in object to datasourceId, this is because the value in id post merge is the id of the datasource storage
      // and not of the datasource.
      datasourceMerged.id = datasourceFromDataSourceList.id;

      // Adding user permissions for datasource from datasourceFromDataSourceList
      datasourceMerged.userPermissions =
        datasourceFromDataSourceList.userPermissions || [];
    }
  }

  return {
    datasource: datasourceMerged,
  };
};

const ApiAuthenticationConnectedComponent =
  connect(mapStateToProps)(ApiAuthentication);

export default ApiAuthenticationConnectedComponent;
