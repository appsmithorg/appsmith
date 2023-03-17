import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";

class AppViewerLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    retryPromise(() =>
      import(/* webpackChunkName: "AppViewer" */ "./index"),
    ).then((module) => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;
    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

export default AppViewerLoader;
