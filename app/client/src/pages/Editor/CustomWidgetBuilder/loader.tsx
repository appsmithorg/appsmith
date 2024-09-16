import PageLoadingBar from "pages/common/PageLoadingBar";
import React from "react";
import { retryPromise } from "utils/AppsmithUtils";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class CustomWidgetBuilderLoader extends React.Component<any, { Page: any }> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
