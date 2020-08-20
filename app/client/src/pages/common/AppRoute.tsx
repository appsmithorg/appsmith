import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";

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
  return (
    <Route
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
