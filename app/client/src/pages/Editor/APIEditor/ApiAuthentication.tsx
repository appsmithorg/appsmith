import React from "react";
import { Datasource, EmbeddedRestDatasource } from "entities/Datasource";
import { get, merge } from "lodash";
import styled from "styled-components";
import { connect, useDispatch } from "react-redux";
import Button, { Category, Size } from "components/ads/Button";
import {
  setDatsourceEditorMode,
  storeAsDatasource,
} from "actions/datasourceActions";
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
import {
  EDIT_DATASOURCE,
  EDIT_DATASOURCE_MESSAGE,
  OAUTH_2_0,
  OAUTH_ERROR,
  SAVE_DATASOURCE,
  SAVE_DATASOURCE_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";

interface ReduxStateProps {
  datasource: EmbeddedRestDatasource | Datasource;
  applicationId?: string;
  currentPageId?: string;
}

interface ReduxDispatchProps {
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
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

const apiFormValueSelector = formValueSelector(API_EDITOR_FORM_NAME);

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

type Props = ReduxStateProps & ReduxDispatchProps;

function ApiAuthentication(props: Props): JSX.Element {
  const dispatch = useDispatch();
  const { applicationId, currentPageId, datasource } = props;
  const authType = get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
    "",
  );

  const hasError = !get(datasource, "isValid", true);

  const shouldSave = datasource && !("id" in datasource);

  const onClick = () => {
    if (shouldSave) {
      dispatch(storeAsDatasource());
    } else {
      const id = get(datasource, "id");
      props.setDatasourceEditorMode(id, false);
      history.push(
        DATA_SOURCES_EDITOR_ID_URL(
          applicationId,
          currentPageId,
          id,
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
          ? createMessage(SAVE_DATASOURCE_MESSAGE)
          : createMessage(EDIT_DATASOURCE_MESSAGE)}
      </DescriptionText>
      <Button
        category={Category.tertiary}
        onClick={onClick}
        size={Size.medium}
        tag="button"
        text={
          shouldSave
            ? createMessage(SAVE_DATASOURCE)
            : createMessage(EDIT_DATASOURCE)
        }
      />
    </AuthContainer>
  );
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
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

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  setDatasourceEditorMode: (id: string, viewMode: boolean) =>
    dispatch(setDatsourceEditorMode({ id, viewMode })),
});

const ApiAuthenticationConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ApiAuthentication);

export default ApiAuthenticationConnectedComponent;
