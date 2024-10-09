import React from "react";
import { connect } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { formValueSelector, reduxForm } from "redux-form";
import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { Action } from "entities/Action";
import type { AppState } from "ee/reducers";
import get from "lodash/get";
import {
  getActionByBaseId,
  getActionData,
} from "ee/selectors/entitiesSelector";
import type { CommonFormProps } from "../CommonEditorForm";
import CommonEditorForm from "../CommonEditorForm";
import Pagination from "./Pagination";
import { GRAPHQL_HTTP_METHOD_OPTIONS } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import PostBodyData from "PluginActionEditor/components/PluginActionForm/components/GraphQLEditor/PostBodyData";

type APIFormProps = {
  actionConfigurationBody: string;
} & CommonFormProps;

type Props = APIFormProps & InjectedFormProps<Action, APIFormProps>;

const FORM_NAME = API_EDITOR_FORM_NAME;

/**
 * Graphql Editor form which uses the Common Editor and pass on the differentiating components from the API Editor.
 * @param props using type Props
 * @returns Graphql Editor Area which is used to editor APIs using GraphQL datasource.
 */
function GraphQLEditorForm(props: Props) {
  const { actionName } = props;

  return (
    <CommonEditorForm
      {...props}
      bodyUIComponent={<PostBodyData actionName={actionName} />}
      formName={FORM_NAME}
      httpsMethods={GRAPHQL_HTTP_METHOD_OPTIONS}
      paginationUIComponent={
        <Pagination
          actionName={actionName}
          formName={FORM_NAME}
          paginationType={props.paginationType}
          query={props.actionConfigurationBody}
        />
      }
    />
  );
}

const selector = formValueSelector(FORM_NAME);

export default connect(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (state: AppState, props: { pluginId: string; match?: any }) => {
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

    const { baseApiId, baseQueryId } = props.match?.params || {};
    const baseActionId = baseQueryId || baseApiId;
    const action = getActionByBaseId(state, baseActionId);
    const apiId = action?.id ?? "";
    const actionName = action?.name ?? "";
    const hintMessages = action?.messages;

    const datasourceHeaders =
      get(datasourceFromAction, "datasourceConfiguration.headers") || [];
    const datasourceParams =
      get(datasourceFromAction, "datasourceConfiguration.queryParameters") ||
      [];

    const actionConfigurationBody =
      selector(state, "actionConfiguration.body") || "";

    const actionResponse = getActionData(state, apiId);

    return {
      actionName,
      actionResponse,
      actionConfigurationHeaders,
      actionConfigurationParams,
      actionConfigurationBody,
      datasourceHeaders,
      datasourceParams,
      hintMessages,
    };
  },
)(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reduxForm<Action, any>({
    form: FORM_NAME,
    enableReinitialize: true,
  })(GraphQLEditorForm),
);
