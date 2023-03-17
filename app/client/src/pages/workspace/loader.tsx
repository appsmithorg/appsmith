import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";

class WorkspaceLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    retryPromise(() =>
      import(/* webpackChunkName: "workspace" */ "./index"),
    ).then((module) => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;

    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

export default WorkspaceLoader;
