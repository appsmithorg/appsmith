import React from "react";
import PageLoadingScreen from "pages/common/PageLoadingScreen";

class OrganizationLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    import(/* webpackChunkName: "Organization" */ "./index").then(module => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;

    return Page ? (
      <Page {...this.props} />
    ) : (
      <PageLoadingScreen displayName={"Organization"} />
    );
  }
}

export default OrganizationLoader;
