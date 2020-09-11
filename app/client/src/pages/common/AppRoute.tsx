import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as Sentry from "@sentry/react";
import { useLocation } from "react-router";
import { theme } from "constants/DefaultTheme";
import { useSelector } from "react-redux";
import { getThemeDetails } from "selectors/themeSelectors";
const SentryRoute = Sentry.withSentryRouting(Route);

const AppRoute = ({
  component: Component,
  ...rest
}: {
  path?: string;
  component: React.ReactType;
  exact?: boolean;
  logDisable?: boolean;
  name: string;
  location?: any;
}) => {
  const location = useLocation();
  const currentTheme = useSelector(getThemeDetails);
  if (
    location.pathname === "/applications" ||
    location.pathname.indexOf("/settings/") !== -1
  ) {
    document.body.style.backgroundColor =
      currentTheme.theme.colors.homepageBackground;
  } else {
    document.body.style.backgroundColor = "#efefef";
  }
  useEffect(() => {
    if (!rest.logDisable) {
      AnalyticsUtil.logEvent("NAVIGATE_EDITOR", {
        page: rest.name,
        path: rest.location.pathname,
      });
    }
  }, [rest.name, rest.logDisable, rest.location.pathname]);
  return (
    <SentryRoute
      {...rest}
      render={props => {
        return <Component {...props}></Component>;
      }}
    />
  );
};

AppRoute.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default AppRoute;
