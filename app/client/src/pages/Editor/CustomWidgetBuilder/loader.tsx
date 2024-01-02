import PageLoadingBar from "pages/common/PageLoadingBar";
import React from "react";
import { retryPromise } from "utils/AppsmithUtils";

class CustomWidgetBuilderLoader extends React.Component<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    retryPromise(
      async () =>
        import(/* webpackChunkName: "CustomWidgetBuilder" */ "./index"),
    ).then((module) => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;

    return Page ? <Page /> : <PageLoadingBar />;
  }
}

export default CustomWidgetBuilderLoader;
