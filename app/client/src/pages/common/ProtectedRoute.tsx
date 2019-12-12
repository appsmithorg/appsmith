import * as React from "react";
import _ from "lodash";
import { Route, Redirect } from "react-router-dom";

import netlifyIdentity from "netlify-identity-widget";

const ProtectedRoute = ({
  component: Component,
  ...rest
}: {
  path: string;
  component: React.ReactType;
  exact?: boolean;
}) => {
  const shouldShowLogin =
    !_.isNil(netlifyIdentity.currentUser()) ||
    process.env.REACT_APP_TESTING === "TESTING";
  return (
    <Route
      {...rest}
      render={props =>
        shouldShowLogin ? <Component {...props} /> : <Redirect to={"/login"} />
      }
    />
  );
};

export default ProtectedRoute;
