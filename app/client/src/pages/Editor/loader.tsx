import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import { preexecuteChunk } from "preexecute";

const editorImport = () => import(/* webpackChunkName: "editor" */ "./index");
preexecuteChunk(editorImport);

class EditorLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    retryPromise(editorImport).then((module) => {
      this.setState({ Page: module.default });
    });
  }
  render() {
    const { Page } = this.state;
    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

export default EditorLoader;
