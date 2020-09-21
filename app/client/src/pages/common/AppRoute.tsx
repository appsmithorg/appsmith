import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as Sentry from "@sentry/react";
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
  useEffect(() => {
    if (!rest.logDisable) {
      AnalyticsUtil.logEvent("NAVIGATE_EDITOR", {
        page: rest.name,
        path: rest.location.pathname,
      });
    }
  }, [rest.name, rest.logDisable, rest.location.pathname]);

  const currentTheme = useSelector(getThemeDetails).theme;
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
        return <Component {...props}></Component>;
      }}
    />
  );
};

AppRoute.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default AppRoute;
