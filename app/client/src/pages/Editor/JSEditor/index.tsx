import React from "react";
import { RouteComponentProps } from "react-router";
import { Action } from "entities/Action";
import { AppState } from "reducers";
import { connect } from "react-redux";
import JSEditorForm from "./Form";
import * as Sentry from "@sentry/react";
import { getJSActionById } from "selectors/editorSelectors";

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

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const jsAction = getJSActionById(state, props);
  return { jsAction };
};

export default Sentry.withProfiler(connect(mapStateToProps)(JSEditor));
