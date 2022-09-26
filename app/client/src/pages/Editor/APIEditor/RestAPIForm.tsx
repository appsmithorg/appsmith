import React from "react";
import { connect } from "react-redux";
import {
  change,
  formValueSelector,
  InjectedFormProps,
  reduxForm,
} from "redux-form";
import styled from "styled-components";
import { API_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import { Action } from "entities/Action";
import PostBodyData from "./PostBodyData";
import { EMPTY_RESPONSE } from "components/editorComponents/ApiResponseView";
import { AppState } from "@appsmith/reducers";
import { getApiName } from "selectors/formSelectors";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { Text, TextType } from "design-system";
import { Classes } from "components/ads/common";
import { createMessage, API_PANE_NO_BODY } from "@appsmith/constants/messages";
import get from "lodash/get";
import { Datasource } from "entities/Datasource";
import {
  getAction,
  getActionData,
  getActionResponses,
} from "../../../selectors/entitiesSelector";
import { isEmpty } from "lodash";
import CommonEditorForm, { CommonFormProps } from "./CommonEditorForm";
import Pagination from "./Pagination";

const NoBodyMessage = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.body.text};
  }
`;

type APIFormProps = {
  httpMethodFromForm: string;
} & CommonFormProps;

type Props = APIFormProps & InjectedFormProps<Action, APIFormProps>;

function ApiEditorForm(props: Props) {
  const { actionName, httpMethodFromForm } = props;
  const allowPostBody = httpMethodFromForm;
  const theme = EditorTheme.LIGHT;

  return (
    <CommonEditorForm
      {...props}
      bodyUIComponent={
        allowPostBody ? (
          <PostBodyData dataTreePath={`${actionName}.config`} theme={theme} />
        ) : (
          <NoBodyMessage>
            <Text type={TextType.P2}>{createMessage(API_PANE_NO_BODY)}</Text>
          </NoBodyMessage>
        )
      }
      formName={API_EDITOR_FORM_NAME}
      paginationUIComponent={
        <Pagination
          onTestClick={props.onRunClick}
          paginationType={props.paginationType}
          theme={theme}
        />
      }
    />
  );
}

const selector = formValueSelector(API_EDITOR_FORM_NAME);

type ReduxDispatchProps = {
  updateDatasource: (datasource: Datasource) => void;
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateDatasource: (datasource) => {
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", datasource));
  },
});

export default connect((state: AppState, props: { pluginId: string }) => {
  const httpMethodFromForm = selector(state, "actionConfiguration.httpMethod");
  const actionConfigurationHeaders =
    selector(state, "actionConfiguration.headers") || [];
  const actionConfigurationParams =
    selector(state, "actionConfiguration.queryParameters") || [];
  let datasourceFromAction = selector(state, "datasource");
  if (datasourceFromAction && datasourceFromAction.hasOwnProperty("id")) {
    datasourceFromAction = state.entities.datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
  }

  // get messages from action itself
  const actionId = selector(state, "id");
  const action = getAction(state, actionId);
  const hintMessages = action?.messages;

  const datasourceHeaders =
    get(datasourceFromAction, "datasourceConfiguration.headers") || [];
  const datasourceParams =
    get(datasourceFromAction, "datasourceConfiguration.queryParameters") || [];

  const apiId = selector(state, "id");
  const currentActionDatasourceId = selector(state, "datasource.id");

  const actionName = getApiName(state, apiId) || "";
  const headers = selector(state, "actionConfiguration.headers");
  let headersCount = 0;

  if (Array.isArray(headers)) {
    const validHeaders = headers.filter(
      (value) => value.key && value.key !== "",
    );
    headersCount += validHeaders.length;
  }

  if (Array.isArray(datasourceHeaders)) {
    const validHeaders = datasourceHeaders.filter(
      (value: any) => value.key && value.key !== "",
    );
    headersCount += validHeaders.length;
  }

  const params = selector(state, "actionConfiguration.queryParameters");
  let paramsCount = 0;

  if (Array.isArray(params)) {
    const validParams = params.filter((value) => value.key && value.key !== "");
    paramsCount = validParams.length;
  }

  if (Array.isArray(datasourceParams)) {
    const validParams = datasourceParams.filter(
      (value: any) => value.key && value.key !== "",
    );
    paramsCount += validParams.length;
  }

  const responses = getActionResponses(state);
  let hasResponse = false;
  let suggestedWidgets;
  if (apiId && apiId in responses) {
    const response = responses[apiId] || EMPTY_RESPONSE;
    hasResponse =
      !isEmpty(response.statusCode) && response.statusCode[0] === "2";
    suggestedWidgets = response.suggestedWidgets;
  }

  const actionData = getActionData(state, apiId);
  let responseDisplayFormat: { title: string; value: string };
  let responseDataTypes: { key: string; title: string }[];
  if (!!actionData && actionData.responseDisplayFormat) {
    responseDataTypes = actionData.dataTypes.map((data) => {
      return {
        key: data.dataType,
        title: data.dataType,
      };
    });
    responseDisplayFormat = {
      title: actionData.responseDisplayFormat,
      value: actionData.responseDisplayFormat,
    };
  } else {
    responseDataTypes = [];
    responseDisplayFormat = {
      title: "",
      value: "",
    };
  }

  return {
    actionName,
    apiId,
    httpMethodFromForm,
    actionConfigurationHeaders,
    actionConfigurationParams,
    currentActionDatasourceId,
    datasourceHeaders,
    datasourceParams,
    headersCount,
    paramsCount,
    hintMessages,
    datasources: state.entities.datasources.list.filter(
      (d) => d.pluginId === props.pluginId,
    ),
    currentPageId: state.entities.pageList.currentPageId,
    applicationId: state.entities.pageList.applicationId,
    responseDataTypes,
    responseDisplayFormat,
    suggestedWidgets,
    hasResponse,
  };
}, mapDispatchToProps)(
  reduxForm<Action, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(ApiEditorForm),
);
