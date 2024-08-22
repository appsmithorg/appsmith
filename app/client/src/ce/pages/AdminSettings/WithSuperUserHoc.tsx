import React from "react";

import { APPLICATIONS_URL } from "constants/routes";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getShowAdminSettings } from "ee/utils/BusinessFeatures/adminSettingsHelpers";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { Redirect } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

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
