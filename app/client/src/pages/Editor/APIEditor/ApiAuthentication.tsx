import React from "react";
import type { EmbeddedRestDatasource } from "entities/Datasource";
import { get, merge } from "lodash";
import styled from "styled-components";
import { connect, useSelector } from "react-redux";
import { AuthType } from "entities/Datasource/RestAPIForm";
import { formValueSelector } from "redux-form";
import type { AppState } from "@appsmith/reducers";
import {
  EDIT_DATASOURCE_MESSAGE,
  OAUTH_2_0,
  OAUTH_ERROR,
  SAVE_DATASOURCE_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import StoreAsDatasource from "components/editorComponents/StoreAsDatasource";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import {
  hasCreateDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";
import { Icon, Text } from "design-system";
import { getCurrentEnvironment } from "@appsmith/utils/Environments";
interface ReduxStateProps {
  datasource: EmbeddedRestDatasource;
}

const AuthContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

const DescriptionText = styled(Text)`
  margin: 12px auto;
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

  const canCreateDatasource = hasCreateDatasourcePermission(
    userWorkspacePermissions,
  );

  const datasourcePermissions = datasource?.userPermissions || [];

  const canManageDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  const isEnabled =
    (shouldSave && canCreateDatasource) || (!shouldSave && canManageDatasource);

  return (
    <AuthContainer>
      {authType === AuthType.OAuth2 && <OAuthLabel hasError={hasError} />}
      <DescriptionText kind="body-m">
        {shouldSave
          ? createMessage(SAVE_DATASOURCE_MESSAGE)
          : createMessage(EDIT_DATASOURCE_MESSAGE)}
      </DescriptionText>
      <StoreAsDatasource
        datasourceId={datasourceId}
        enable={isEnabled}
        shouldSave={shouldSave}
      />
    </AuthContainer>
  );
}

const mapStateToProps = (state: AppState, ownProps: any): ReduxStateProps => {
  const apiFormValueSelector = formValueSelector(ownProps.formName);
  const datasourceFromAction = apiFormValueSelector(state, "datasource");
  const currentEnvironment = getCurrentEnvironment();
  let datasourceMerged: EmbeddedRestDatasource = datasourceFromAction;
  if (datasourceFromAction && "id" in datasourceFromAction) {
    const datasourceFromDataSourceList = state.entities.datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
    if (datasourceFromDataSourceList) {
      datasourceMerged = merge(
        {},
        datasourceFromAction,
        // datasourceFromDataSourceList,
        datasourceFromDataSourceList.datasourceStorages[currentEnvironment],
      );

      // update the id in object to datasourceId, this is because the value in id post merge is the id of the datasource storage
      // and not of the datasource.
      datasourceMerged.id =
        datasourceFromDataSourceList.datasourceStorages[
          currentEnvironment
        ].datasourceId;
    }
  }

  return {
    datasource: datasourceMerged,
  };
};

const ApiAuthenticationConnectedComponent =
  connect(mapStateToProps)(ApiAuthentication);

export default ApiAuthenticationConnectedComponent;
