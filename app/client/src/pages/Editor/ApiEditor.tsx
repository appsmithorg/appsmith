import React from "react";
import { connect } from "react-redux";
import { submit, initialize, getFormValues, destroy } from "redux-form";
import ApiEditorForm from "./APIEditor/ApiEditorForm";
import {
  createActionRequest,
  runApiAction,
  deleteAction,
  updateAction,
} from "../../actions/actionActions";
import { RestAction } from "../../api/ActionAPI";
import { AppState } from "../../reducers";
import { RouteComponentProps } from "react-router";
import { API_EDITOR_URL } from "../../constants/routes";
import { API_EDITOR_FORM_NAME } from "../../constants/forms";
import { ActionDataState } from "../../reducers/entityReducers/actionsReducer";
import { ApiPaneReduxState } from "../../reducers/uiReducers/apiPaneReducer";
import styled from "styled-components";
import { FORM_INITIAL_VALUES } from "../../constants/ApiEditorConstants";

interface ReduxStateProps {
  actions: ActionDataState;
  apiPane: ApiPaneReduxState;
  formData: any;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
  createAction: (values: RestAction) => void;
  runAction: () => void;
  deleteAction: (id: string) => void;
  updateAction: (data: RestAction) => void;
  initialize: (formName: string, data?: Partial<RestAction>) => void;
  destroy: (formName: string) => void;
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<{ id: string }>;

const EmptyStateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 20px;
`;

class ApiEditor extends React.Component<Props> {
  componentDidMount(): void {
    const currentId = this.props.match.params.id;
    if (!currentId) return;
    if (!this.props.actions.data.length) {
      this.props.history.push(API_EDITOR_URL);
      return;
    }
    const data = this.props.actions.data.filter(
      action => action.id === currentId,
    )[0];
    this.props.initialize(API_EDITOR_FORM_NAME, data);
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    const currentId = this.props.match.params.id;
    if (currentId && currentId !== prevProps.match.params.id) {
      const data = this.props.actions.data.filter(
        action => action.id === currentId,
      )[0];
      this.props.destroy(API_EDITOR_FORM_NAME);
      let initialData = data;
      if (!initialData.actionConfiguration) {
        initialData = {
          ...data,
          ...FORM_INITIAL_VALUES,
        };
      }
      this.props.initialize(API_EDITOR_FORM_NAME, initialData);
    }
  }

  handleSubmit = (values: RestAction) => {
    const { formData } = this.props;
    if (formData.id) {
      this.props.updateAction(formData);
    } else {
      this.props.createAction(formData);
    }
  };

  handleSaveClick = () => {
    this.props.submitForm(API_EDITOR_FORM_NAME);
  };
  handleDeleteClick = () => {
    this.props.deleteAction(this.props.match.params.id);
  };
  handleRunClick = () => {
    this.props.runAction();
  };

  render() {
    const {
      apiPane: { isSaving, isRunning, isDeleting },
      match: {
        params: { id },
      },
    } = this.props;
    return (
      <React.Fragment>
        {id ? (
          <ApiEditorForm
            isSaving={isSaving}
            isRunning={isRunning}
            isDeleting={isDeleting}
            onSubmit={this.handleSubmit}
            onSaveClick={this.handleSaveClick}
            onDeleteClick={this.handleDeleteClick}
            onRunClick={this.handleRunClick}
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
  actions: state.entities.actions,
  apiPane: state.ui.apiPane,
  formData: getFormValues(API_EDITOR_FORM_NAME)(state),
});

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  createAction: (action: RestAction) => dispatch(createActionRequest(action)),
  runAction: () => dispatch(runApiAction()),
  deleteAction: (id: string) => dispatch(deleteAction({ id })),
  updateAction: (data: RestAction) => dispatch(updateAction({ data })),
  initialize: (formName: string, data?: Partial<RestAction>) =>
    dispatch(initialize(formName, data)),
  destroy: (formName: string) => dispatch(destroy(formName)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ApiEditor);
