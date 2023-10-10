export * from "ce/pages/AdminSettings/WithSuperUserHoc";
import { APPLICATIONS_URL } from "constants/routes";
import React from "react";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { Redirect, useParams } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getAdminSettingsPath,
  getShowAdminSettings,
} from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";

export default function WithSuperUserHOC(
  Component: React.ComponentType<RouteComponentProps>,
) {
  return function Wrapped(props: RouteComponentProps) {
    const params = useParams() as any;
    const { category } = params;
    const user = useSelector(getCurrentUser);
    const tenantPermissions = useSelector(getTenantPermissions);
    const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

    if (!user) return null;
    if (!getShowAdminSettings(isFeatureEnabled, user)) {
      return <Redirect to={APPLICATIONS_URL} />;
    } else if (
      !user?.isSuperUser &&
      ["groups", "roles", "audit-logs"].indexOf(category) === -1
    ) {
      return (
        <Redirect
          to={getAdminSettingsPath(
            isFeatureEnabled,
            user?.isSuperUser || false,
            tenantPermissions,
          )}
        />
      );
    }
    return <Component {...props} />;
  };
}
