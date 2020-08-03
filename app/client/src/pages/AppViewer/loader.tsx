import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";

class AppViewerLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    import(/* webpackChunkName: "AppViewer" */ "./index").then(module => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;
    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

export default AppViewerLoader;
