import React from "react";
import { Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { hasAuthExpired } from "utils/storage";
import { User } from "constants/userConstants";
import { setCurrentUserDetails } from "actions/userActions";

export const checkAuth = (dispatch: any, currentUser?: User) => {
  return hasAuthExpired().then(hasExpired => {
    if (!currentUser || hasExpired) {
      dispatch(setCurrentUserDetails());
    }
  });
};

export const WrappedComponent = (props: any) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.ui.users.current);
  checkAuth(dispatch, currentUser);
  return currentUser ? props.children : null;
};

const ProtectedRoute = ({
  component: Component,
  ...rest
}: {
  path: string;
  component: React.ReactType;
  exact?: boolean;
}) => {
  return (
    <Route
      {...rest}
      render={props => (
        <WrappedComponent {...props}>
          <Component {...props} />
        </WrappedComponent>
      )}
    />
  );
};

export default ProtectedRoute;
