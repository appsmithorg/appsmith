import { APPLICATIONS_URL } from "constants/routes";
import React from "react";
import { useSelector } from "react-redux";
import { Redirect, RouteComponentProps } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";

export default function WithSuperUserHOC(
  Component: React.ComponentType<RouteComponentProps>,
) {
  return function Wrapped(props: RouteComponentProps) {
    const user = useSelector(getCurrentUser);
    if (!user) return null;
    if (!user?.isSuperUser || !user?.isConfigurable) {
      return <Redirect to={APPLICATIONS_URL} />;
    }
    return <Component {...props} />;
  };
}
