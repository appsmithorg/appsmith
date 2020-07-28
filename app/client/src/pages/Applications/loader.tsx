import React from "react";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "@blueprintjs/core";

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
      <CenteredWrapper>
        <Spinner />
      </CenteredWrapper>
    );
  }
}

export default ApplicationListLoader;
