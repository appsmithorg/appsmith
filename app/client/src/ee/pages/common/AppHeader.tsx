export * from "ce/pages/common/AppHeader";
import { Routes as CE_Routes } from "ce/pages/common/AppHeader";
import React from "react";
import ReactDOM from "react-dom";
import { Switch } from "react-router";
import type { RouteComponentProps } from "react-router";
import { withRouter } from "react-router";

type Props = RouteComponentProps;

const headerRoot = document.getElementById("header-root");

const Routes = () => {
  return (
    <Switch>
      <CE_Routes />
    </Switch>
  );
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class AppHeader extends React.Component<Props, any> {
  private container = document.createElement("div");

  componentDidMount() {
    headerRoot?.appendChild(this.container);
  }
  componentWillUnmount() {
    headerRoot?.removeChild(this.container);
  }
  get header() {
    return <Routes />;
  }
  render() {
    return ReactDOM.createPortal(this.header, this.container);
  }
}

export default withRouter(AppHeader);
