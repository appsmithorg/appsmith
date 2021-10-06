import React from "react";
import { Datasource, EmbeddedRestDatasource } from "entities/Datasource";
import { get, merge } from "lodash";
import styled from "styled-components";
import { connect, useDispatch } from "react-redux";
import Button, { Category, Size } from "components/ads/Button";
import { storeAsDatasource } from "actions/datasourceActions";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { getQueryParams } from "utils/AppsmithUtils";
import Text, { TextType } from "components/ads/Text";
import { AuthType } from "entities/Datasource/RestAPIForm";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { formValueSelector } from "redux-form";
import { AppState } from "reducers";
import { ReactComponent as SheildSuccess } from "assets/icons/ads/shield-success.svg";
import { ReactComponent as SheildError } from "assets/icons/ads/shield-error.svg";

interface ApiAuthenticationProps {
  datasource: EmbeddedRestDatasource | Datasource;
  applicationId?: string;
  currentPageId?: string;
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
`;

const DescriptionText = styled(Text)`
  margin: 12px auto;
`;

const apiFormValueSelector = formValueSelector(API_EDITOR_FORM_NAME);

function OAuthLabel(props: ErrorProps) {
  return (
    <OAuthContainer>
      {props.hasError ? <SheildError /> : <SheildSuccess />}
      <OAuthText hasError={props.hasError}>
        {props.hasError ? "OAuth Error" : "OAuth 2.0"}
      </OAuthText>
    </OAuthContainer>
  );
}

function ApiAuthentication(props: ApiAuthenticationProps): JSX.Element {
  const dispatch = useDispatch();
  const { applicationId, currentPageId, datasource } = props;
  const authType = get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
    "",
  );

  const hasError = !!get(datasource, "structure.error");

  const shouldSave = datasource && !("id" in datasource);

  const onClick = () => {
    if (shouldSave) {
      dispatch(storeAsDatasource());
    } else {
      history.push(
        DATA_SOURCES_EDITOR_ID_URL(
          applicationId,
          currentPageId,
          get(datasource, "id"),
          getQueryParams(),
        ),
      );
    }
  };

  return (
    <AuthContainer>
      {authType === AuthType.OAuth2 && <OAuthLabel hasError={hasError} />}
      <DescriptionText type={TextType.P1}>
        {shouldSave
          ? "Save API as datasource to setup authentication"
          : "Edit Datasource to access authentication settings"}
      </DescriptionText>
      <Button
        category={Category.tertiary}
        onClick={onClick}
        size={Size.medium}
        tag="button"
        text={shouldSave ? "Save Datasource" : "Edit Datasource"}
      />
    </AuthContainer>
  );
}

const mapStateToProps = (state: AppState): ApiAuthenticationProps => {
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
    currentPageId: state.entities.pageList.currentPageId,
    applicationId: state.entities.pageList.applicationId,
  };
};

const ApiAuthenticationConnectedComponent = connect(mapStateToProps)(
  ApiAuthentication,
);

export default ApiAuthenticationConnectedComponent;
