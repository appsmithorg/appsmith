import React from "react";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { Redirect, useParams } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { getShowAdminSettings } from "ee/utils/BusinessFeatures/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { APPLICATIONS_URL } from "constants/routes";

export default function WithSuperUserHOC(
  Component: React.ComponentType<RouteComponentProps>,
) {
  return function Wrapped(props: RouteComponentProps) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = useParams() as any;
    const { category } = params;
    const user = useSelector(getCurrentUser);
    const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

    if (!user) return null;

    if (
      ["profile"].indexOf(category) === -1 &&
      !getShowAdminSettings(isFeatureEnabled, user)
    ) {
      return <Redirect to={APPLICATIONS_URL} />;
    }

    return <Component {...props} />;
  };
}
