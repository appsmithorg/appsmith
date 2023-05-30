import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import { preexecuteChunk } from "preexecute";

const appViewerImport = () =>
  import(/* webpackChunkName: "AppViewer" */ "./index");
preexecuteChunk(appViewerImport);

class AppViewerLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    retryPromise(appViewerImport).then((module) => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;
    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

export default AppViewerLoader;
