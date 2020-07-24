import React from "react";
import { connect } from "react-redux";
import { getCurrentUser } from "actions/authActions";
import PageHeader from "pages/common/PageHeader";
import { Route, Switch } from "react-router";
import { APP_VIEW_URL, BASE_URL, BUILDER_URL } from "constants/routes";
import { withRouter, RouteComponentProps } from "react-router";

type Props = {
  getCurrentUser: (path: string) => void;
} & RouteComponentProps;

const NoRender = () => {
  return null;
};

class AppHeader extends React.Component<Props, any> {
  componentDidMount() {
    this.props.getCurrentUser(this.props.location.pathname);
  }
  render() {
    return (
      <React.Fragment>
        <Switch>
          <Route path={BUILDER_URL} component={NoRender} />
          <Route path={APP_VIEW_URL} component={NoRender} />
          <Route path={BASE_URL} component={PageHeader} />
        </Switch>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (dispatch: any) => ({
  getCurrentUser: (path: string) => dispatch(getCurrentUser({ path })),
});

export default withRouter(connect(null, mapStateToProps)(AppHeader));
