import React from "react";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import { Redirect, useParams } from "react-router";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import SettingsForm from "pages/AdminSettings/SettingsForm";
import { getWrapperCategory } from "@appsmith/utils/adminSettingsHelpers";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getAdminSettingsPath } from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";

const Main = () => {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const user = useSelector(getCurrentUser);
  const tenantPermissions = useSelector(getTenantPermissions);
  const isSuperUser = user?.isSuperUser || false;
  const wrapperCategory = getWrapperCategory(
    AdminConfig.wrapperCategories,
    subCategory,
    category,
  );
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  if (!!wrapperCategory?.component) {
    const { component: WrapperCategoryComponent } = wrapperCategory;
    return <WrapperCategoryComponent category={wrapperCategory} />;
  } else if (
    !Object.values(SettingCategories).includes(category) ||
    (subCategory && !Object.values(SettingCategories).includes(subCategory))
  ) {
    return (
      <Redirect
        to={getAdminSettingsPath(
          isFeatureEnabled,
          isSuperUser,
          tenantPermissions,
        )}
      />
    );
  } else {
    return <SettingsForm />;
  }
};

export default Main;
