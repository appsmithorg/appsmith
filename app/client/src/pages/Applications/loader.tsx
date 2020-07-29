import React from "react";
import PageLoadingScreen from "pages/common/PageLoadingScreen";

class ApplicationListLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    import(/* webpackChunkName: "Applications" */ "./index").then(module => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;

    return Page ? (
      <Page {...this.props} />
    ) : (
      <PageLoadingScreen displayName={"Applications"} />
    );
  }
}

export default ApplicationListLoader;
