import React from "react";
import { RouteComponentProps } from "react-router";
import { Action } from "entities/Action";
import { AppState } from "reducers";
import { connect } from "react-redux";
import JSEditorForm from "./Form";
import * as Sentry from "@sentry/react";

interface ReduxStateProps {
  jsAction: Action | undefined;
}

type Props = ReduxStateProps &
  RouteComponentProps<{ apiId: string; applicationId: string; pageId: string }>;

class JSEditor extends React.Component<Props> {
  render() {
    return <JSEditorForm jsAction={this.props.jsAction} />;
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  const jsAction = state.ui.jsPane;
  return { jsAction };
};

export default Sentry.withProfiler(connect(mapStateToProps)(JSEditor));
