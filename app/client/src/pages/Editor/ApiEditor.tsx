import React from "react";
import { connect } from "react-redux";
import { submit, initialize, getFormValues, destroy } from "redux-form";
import ApiEditorForm from "./APIEditor/ApiEditorForm";
import {
  createActionRequest,
  executeAction,
  deleteAction,
  updateAction,
  dryRunAction,
} from "../../actions/actionActions";
import { RestAction } from "../../api/ActionAPI";
import { AppState } from "../../reducers";
import { RouteComponentProps } from "react-router";
import { API_EDITOR_URL } from "../../constants/routes";
import { API_EDITOR_FORM_NAME } from "../../constants/forms";
import { FORM_INITIAL_VALUES } from "../../constants/ApiEditorConstants";
import { ActionDataState } from "../../reducers/entityReducers/actionsReducer";

interface ReduxStateProps {
  actions: ActionDataState;
  formData: any;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
  createAction: (values: RestAction) => void;
  runAction: (id: string) => void;
  dryRunAction: (data: RestAction) => void;
  deleteAction: (id: string) => void;
  updateAction: (data: RestAction) => void;
  initialize: (formName: string, data?: Partial<RestAction>) => void;
  destroy: (formName: string) => void;
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<{ id: string }>;

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
    if (!currentId && prevProps.match.params.id) {
      this.props.initialize(API_EDITOR_FORM_NAME, FORM_INITIAL_VALUES);
    }
    if (currentId && currentId !== prevProps.match.params.id) {
      const data = this.props.actions.data.filter(
        action => action.id === currentId,
      )[0];
      this.props.destroy(API_EDITOR_FORM_NAME);
      this.props.initialize(API_EDITOR_FORM_NAME, data);
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
    const { formData } = this.props;
    if (formData.id) {
      this.props.runAction(this.props.match.params.id);
    } else {
      this.props.dryRunAction(formData);
    }
  };

  render() {
    const {
      actions: { isSaving, isRunning, isDeleting },
    } = this.props;
    return (
      <ApiEditorForm
        isSaving={isSaving}
        isRunning={isRunning}
        isDeleting={isDeleting}
        onSubmit={this.handleSubmit}
        onSaveClick={this.handleSaveClick}
        onDeleteClick={this.handleDeleteClick}
        onRunClick={this.handleRunClick}
      />
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  actions: state.entities.actions,
  formData: getFormValues(API_EDITOR_FORM_NAME)(state),
});

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  createAction: (action: RestAction) => dispatch(createActionRequest(action)),
  runAction: (id: string) =>
    dispatch(
      executeAction([
        {
          actionId: id,
          actionType: "API",
          contextParams: {},
        },
      ]),
    ),
  dryRunAction: (data: RestAction) => dispatch(dryRunAction(data)),
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
