import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { hasAuthExpired } from "utils/storage";
import { User } from "constants/userConstants";
import { setCurrentUserDetails } from "actions/userActions";
import {
  useShowPropertyPane,
  useWidgetSelection,
} from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
export const checkAuth = (dispatch: any, currentUser?: User) => {
  return hasAuthExpired().then(hasExpired => {
    if (!currentUser || hasExpired) {
      dispatch(setCurrentUserDetails());
    }
  });
};

export const WrappedComponent = (props: any) => {
  const showPropertyPane = useShowPropertyPane();
  showPropertyPane();

  const { selectWidget, focusWidget } = useWidgetSelection();
  selectWidget(undefined);
  focusWidget(undefined);

  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.ui.users.current);
  checkAuth(dispatch, currentUser);
  return currentUser || !props.protected ? props.children : null;
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

export default AppRoute;
