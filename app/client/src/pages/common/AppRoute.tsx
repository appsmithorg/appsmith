import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import {
  useShowPropertyPane,
  useWidgetSelection,
} from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";

export const WrappedComponent = (props: any) => {
  const showPropertyPane = useShowPropertyPane();
  showPropertyPane();

  const { selectWidget, focusWidget } = useWidgetSelection();
  selectWidget(undefined);
  focusWidget(undefined);

  return props.children;
};

const AppRoute = ({
  component: Component,
  ...rest
}: {
  path?: string;
  component: React.ReactType;
  exact?: boolean;
  routeProtected?: boolean;
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
  console.log("Rendering", rest.name);
  return (
    <Route
      {...rest}
      render={props => {
        return rest.routeProtected ? (
          <WrappedComponent {...props}>
            <Component {...props} />
          </WrappedComponent>
        ) : (
          <Component {...props}></Component>
        );
      }}
    />
  );
};

AppRoute.whyDidYouRender = {
  logOnDifferentValues: false,
};
WrappedComponent.whyDidYouRender = {
  logOnDifferentValues: false,
};
export default AppRoute;
