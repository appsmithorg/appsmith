import React from "react";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router";

import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import type { InitPackageEditorPayload } from "@appsmith/actions/packageInitActions";
import { initPackageEditor } from "@appsmith/actions/packageInitActions";

type PackageEditorLoaderProps = RouteComponentProps<{
  packageId: string;
}> & {
  initEditor: (payload: InitPackageEditorPayload) => void;
};
interface PackageEditorLoaderState {
  Editor: React.JSXElementConstructor<any> | null;
}

class PackageEditorLoader extends React.Component<
  PackageEditorLoaderProps,
  PackageEditorLoaderState
> {
  constructor(props: any) {
    super(props);

    this.state = {
      Editor: null,
    };
  }

  componentDidMount() {
    const { initEditor, match } = this.props;
    const { packageId } = match.params;
    initEditor({ packageId });

    retryPromise(
      async () => import(/* webpackChunkName: "editor" */ "./index"),
    ).then((module) => {
      this.setState({ Editor: module.default });
    });
  }

  render() {
    const { Editor } = this.state;
    return Editor ? <Editor {...this.props} /> : <PageLoadingBar />;
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (payload: InitPackageEditorPayload) =>
      dispatch(initPackageEditor(payload)),
  };
};

export default connect(null, mapDispatchToProps)(PackageEditorLoader);
