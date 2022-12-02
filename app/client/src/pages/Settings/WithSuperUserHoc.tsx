import { APPLICATIONS_URL } from "constants/routes";
import { showAdminSettings } from "ce/utils/adminSettingsHelpers";
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
    if (!showAdminSettings(user)) {
      return <Redirect to={APPLICATIONS_URL} />;
    }
    return <Component {...props} />;
  };
}
