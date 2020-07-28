import React from "react";
import { Spinner } from "@blueprintjs/core";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

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
      <CenteredWrapper>
        <Spinner />
      </CenteredWrapper>
    );
  }
}

export default OrganizationLoader;
