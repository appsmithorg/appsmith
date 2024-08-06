import { APPLICATIONS_URL } from "constants/routes";
import React from "react";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { Redirect } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { getShowAdminSettings } from "ee/utils/BusinessFeatures/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

export default function WithSuperUserHOC(
  Component: React.ComponentType<RouteComponentProps>,
) {
  return function Wrapped(props: RouteComponentProps) {
    const user = useSelector(getCurrentUser);
    const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
    if (!user) return null;
    if (!getShowAdminSettings(isFeatureEnabled, user)) {
      return <Redirect to={APPLICATIONS_URL} />;
    }
    return <Component {...props} />;
  };
}
