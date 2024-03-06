import React from "react";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router";

import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import type { InitWorkflowEditorPayload } from "@appsmith/actions/workflowActions";
import { initWorkflowEditor } from "@appsmith/actions/workflowActions";

type WorkflowEditorLoaderProps = RouteComponentProps<{
  workflowId: string;
}> & {
  initEditor: (payload: InitWorkflowEditorPayload) => void;
};
interface WorkflowEditorLoaderState {
  Editor: React.JSXElementConstructor<any> | null;
}

class WorkflowEditorLoader extends React.Component<
  WorkflowEditorLoaderProps,
  WorkflowEditorLoaderState
> {
  constructor(props: any) {
    super(props);

    this.state = {
      Editor: null,
    };
  }

  componentDidMount() {
    const { initEditor, match } = this.props;
    const { workflowId } = match.params;

    initEditor({ workflowId });

    retryPromise(
      async () => import(/* webpackChunkName: "editor" */ "./index"),
    ).then((workflow) => {
      this.setState({ Editor: workflow.default });
    });
  }

  render() {
    const { Editor } = this.state;
    return Editor ? <Editor {...this.props} /> : <PageLoadingBar />;
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (payload: InitWorkflowEditorPayload) =>
      dispatch(initWorkflowEditor(payload)),
  };
};

export default connect(null, mapDispatchToProps)(WorkflowEditorLoader);
