import React from "react";
import { connect } from "react-redux";
import { submit, getFormValues } from "redux-form";
import ApiEditorForm from "./Form";
import {
  createActionRequest,
  runApiAction,
  deleteAction,
  updateAction,
} from "actions/actionActions";
import { RestAction, PaginationField } from "api/ActionAPI";
import { AppState } from "reducers";
import { RouteComponentProps } from "react-router";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import styled from "styled-components";
import { HTTP_METHODS, PLUGIN_NAME } from "constants/ApiEditorConstants";
import _ from "lodash";
import { getPluginIdOfName } from "selectors/entitiesSelector";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { ApplicationPayload } from "constants/ReduxActionConstants";

interface ReduxStateProps {
  actions: ActionDataState;
  apiPane: ApiPaneReduxState;
  formData: RestAction;
  pluginId: string | undefined;
  currentApplication?: ApplicationPayload;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
  createAction: (values: RestAction) => void;
  runAction: (id: string, paginationField: PaginationField) => void;
  deleteAction: (id: string, name: string) => void;
  updateAction: (data: RestAction) => void;
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<{ apiId: string; applicationId: string; pageId: string }>;

const EmptyStateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 20px;
`;

class ApiEditor extends React.Component<Props> {
  handleSubmit = (values: RestAction) => {
    const { formData } = this.props;
    this.props.updateAction(formData);
  };

  handleSaveClick = () => {
    this.props.submitForm(API_EDITOR_FORM_NAME);
  };
  handleDeleteClick = () => {
    this.props.deleteAction(
      this.props.match.params.apiId,
      this.props.formData.name,
    );
  };
  handleRunClick = (paginationField?: PaginationField) => {
    this.props.runAction(this.props.match.params.apiId, paginationField);
  };

  render() {
    const {
      apiPane,
      match: {
        params: { apiId },
      },
      formData,
      pluginId,
    } = this.props;
    if (!pluginId) {
      return (
        <EmptyStateContainer>{"Plugin is not installed"}</EmptyStateContainer>
      );
    }
    const { isSaving, isRunning, isDeleting, drafts } = apiPane;
    const httpMethod = _.get(formData, "actionConfiguration.httpMethod");
    const paginationType = _.get(
      formData,
      "actionConfiguration.paginationType",
    );
    return (
      <React.Fragment>
        {apiId ? (
          <ApiEditorForm
            pluginId={pluginId}
            allowSave={apiId in drafts}
            allowPostBody={httpMethod && httpMethod !== HTTP_METHODS[0]}
            paginationType={paginationType}
            isSaving={isSaving[apiId]}
            isRunning={isRunning[apiId]}
            isDeleting={isDeleting[apiId]}
            onSubmit={this.handleSubmit}
            onSaveClick={this.handleSaveClick}
            onDeleteClick={this.handleDeleteClick}
            onRunClick={this.handleRunClick}
            appName={
              this.props.currentApplication
                ? this.props.currentApplication.name
                : ""
            }
          />
        ) : (
          <EmptyStateContainer>
            {"Create / Select an API from the list"}
          </EmptyStateContainer>
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  pluginId: getPluginIdOfName(state, PLUGIN_NAME),
  actions: state.entities.actions,
  apiPane: state.ui.apiPane,
  currentApplication: getCurrentApplication(state),
  formData: getFormValues(API_EDITOR_FORM_NAME)(state) as RestAction,
});

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  createAction: (action: RestAction) => dispatch(createActionRequest(action)),
  runAction: (id: string, paginationField: PaginationField) =>
    dispatch(runApiAction(id, paginationField)),
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  updateAction: (data: RestAction) => dispatch(updateAction({ data })),
});

export default connect(mapStateToProps, mapDispatchToProps)(ApiEditor);
