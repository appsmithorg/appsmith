import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as Sentry from "@sentry/react";
import { useSelector, connect } from "react-redux";
import { getThemeDetails } from "selectors/themeSelectors";
import { AppState } from "reducers";
import { ThemeMode } from "reducers/uiReducers/themeReducer";
import { setThemeMode } from "actions/themeActions";
const SentryRoute = Sentry.withSentryRouting(Route);

class AppRouteWithoutProps extends React.Component<{
  currentTheme: any;
  path?: string;
  component: any;
  exact?: boolean;
  logDisable?: boolean;
  name: string;
  location?: any;
  setTheme: Function;
}> {
  componentDidUpdate() {
    if (!this.props.logDisable) {
      AnalyticsUtil.logEvent("NAVIGATE_EDITOR", {
        page: this.props.name,
        path: this.props.location.pathname,
      });
    }
  }
  render() {
    const { component: Component, currentTheme, ...rest } = this.props;

    if (
      window.location.pathname === "/applications" ||
      window.location.pathname.indexOf("/settings/") !== -1
    ) {
      document.body.style.backgroundColor =
        currentTheme.colors.homepageBackground;
    } else {
      document.body.style.backgroundColor = "#efefef";
    }
    return (
      <SentryRoute
        {...rest}
        render={props => {
          return <Component {...props} />;
        }}
      />
    );
  }
}
const mapStateToProps = (state: AppState) => ({
  currentTheme: getThemeDetails(state).theme,
});
const mapDispatchToProps = (dispatch: any) => ({
  setTheme: (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  },
});

const AppRoute = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppRouteWithoutProps);

(AppRoute as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default AppRoute;
