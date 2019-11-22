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
  return (
    <Route
      {...rest}
      render={props =>
        !_.isNil(netlifyIdentity.currentUser()) ? (
          <Component {...props} />
        ) : (
          <Redirect to={"/login"} />
        )
      }
    />
  );
};

export default ProtectedRoute;
