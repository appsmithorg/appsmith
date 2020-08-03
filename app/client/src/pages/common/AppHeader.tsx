import React from "react";
import { connect } from "react-redux";
import { getCurrentUser } from "actions/authActions";
import PageHeader from "pages/common/PageHeader";
import { Route, Switch } from "react-router";
import {
  APP_VIEW_URL,
  BASE_URL,
  BUILDER_URL,
  USER_AUTH_URL,
} from "constants/routes";
import { withRouter, RouteComponentProps } from "react-router";

type Props = { getCurrentUser: () => void } & RouteComponentProps;

const NoRender = () => {
  return null;
};
/*
 * App header is rendered as the first thing in the app. This kicks off the auth check
 * Currently each path has rendered their own header but we can move that here to have
 * a consistent header experience
 */
class AppHeader extends React.Component<Props, any> {
  componentDidMount() {
    this.props.getCurrentUser();
  }
  render() {
    return (
      <React.Fragment>
        <Switch>
          <Route path={BUILDER_URL} component={NoRender} />
          <Route path={APP_VIEW_URL} component={NoRender} />
          <Route path={USER_AUTH_URL} component={PageHeader} />
          <Route path={BASE_URL} component={PageHeader} />
        </Switch>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
});

export default withRouter(connect(null, mapStateToProps)(AppHeader));
