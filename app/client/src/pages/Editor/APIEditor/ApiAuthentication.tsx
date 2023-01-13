import React from "react";
import { Datasource, EmbeddedRestDatasource } from "entities/Datasource";
import { get, merge } from "lodash";
import styled from "styled-components";
import { connect, useSelector } from "react-redux";
import { Text, TextType } from "design-system";
import { AuthType } from "entities/Datasource/RestAPIForm";
import { formValueSelector } from "redux-form";
import { AppState } from "@appsmith/reducers";
import { ReactComponent as SheildSuccess } from "assets/icons/ads/shield-success.svg";
import { ReactComponent as SheildError } from "assets/icons/ads/shield-error.svg";
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
interface ReduxStateProps {
  datasource: EmbeddedRestDatasource | Datasource;
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

const OAuthText = styled.span<ErrorProps>`
  color: ${(props) => (props.hasError ? "#F22B2B" : "#03B365")};
  margin-left: 5px;
`;

const DescriptionText = styled(Text)`
  margin: 12px auto;
`;

function OAuthLabel(props: ErrorProps) {
  return (
    <OAuthContainer>
      {props.hasError ? <SheildError /> : <SheildSuccess />}
      <OAuthText hasError={props.hasError}>
        {props.hasError ? OAUTH_ERROR() : OAUTH_2_0()}
      </OAuthText>
    </OAuthContainer>
  );
}

type Props = ReduxStateProps;

function ApiAuthentication(props: Props): JSX.Element {
  const { datasource } = props;
  const authType = get(
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
      <DescriptionText type={TextType.P1}>
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
  let datasourceMerged = datasourceFromAction;
  if (datasourceFromAction && "id" in datasourceFromAction) {
    const datasourceFromDataSourceList = state.entities.datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
    if (datasourceFromDataSourceList) {
      datasourceMerged = merge(
        {},
        datasourceFromAction,
        datasourceFromDataSourceList,
      );
    }
  }

  return {
    datasource: datasourceMerged,
  };
};

const ApiAuthenticationConnectedComponent = connect(mapStateToProps)(
  ApiAuthentication,
);

export default ApiAuthenticationConnectedComponent;
