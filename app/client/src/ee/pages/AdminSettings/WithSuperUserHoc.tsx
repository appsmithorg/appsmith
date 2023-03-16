export * from "ce/pages/AdminSettings/WithSuperUserHoc";
import { APPLICATIONS_URL } from "constants/routes";
import {
  getDefaultAdminSettingsPath,
  showAdminSettings,
} from "@appsmith/utils/adminSettingsHelpers";
import React from "react";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { Redirect, useParams } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";

export default function WithSuperUserHOC(
  Component: React.ComponentType<RouteComponentProps>,
) {
  return function Wrapped(props: RouteComponentProps) {
    const params = useParams() as any;
    const { category } = params;
    const user = useSelector(getCurrentUser);
    const tenantPermissions = useSelector(getTenantPermissions);

    if (!user) return null;
    if (!showAdminSettings(user)) {
      return <Redirect to={APPLICATIONS_URL} />;
    } else if (
      !user?.isSuperUser &&
      ["groups", "roles", "audit-logs"].indexOf(category) === -1
    ) {
      return (
        <Redirect
          to={getDefaultAdminSettingsPath({
            isSuperUser: user?.isSuperUser || false,
            tenantPermissions,
          })}
        />
      );
    }
    return <Component {...props} />;
  };
}
