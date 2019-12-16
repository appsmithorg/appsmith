import * as React from "react";
import { Route } from "react-router-dom";

const ProtectedRoute = ({
  component: Component,
  ...rest
}: {
  path: string;
  component: React.ReactType;
  exact?: boolean;
}) => {
  return <Route {...rest} render={props => <Component {...props} />} />;
};

export default ProtectedRoute;
