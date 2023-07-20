import React from "react";
import AdminConfig from "./config";
import { Redirect, useParams } from "react-router";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import SettingsForm from "pages/Settings/SettingsForm";
import { getDefaultAdminSettingsPath } from "@appsmith/utils/adminSettingsHelpers";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

const Main = () => {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const user = useSelector(getCurrentUser);
  const tenantPermissions = useSelector(getTenantPermissions);
  const isSuperUser = user?.isSuperUser || false;
  const wrapperCategory =
    AdminConfig.wrapperCategories[subCategory ?? category];
  const featureFlags = useSelector(selectFeatureFlags);

  if (
    category === "provisioning" &&
    !featureFlags.release_scim_provisioning_enabled
  ) {
    return (
      <Redirect
        to={getDefaultAdminSettingsPath({ isSuperUser, tenantPermissions })}
      />
    );
  }

  if (!!wrapperCategory?.component) {
    const { component: WrapperCategoryComponent } = wrapperCategory;
    return <WrapperCategoryComponent category={wrapperCategory} />;
  } else if (
    !Object.values(SettingCategories).includes(category) ||
    (subCategory && !Object.values(SettingCategories).includes(subCategory))
  ) {
    return (
      <Redirect
        to={getDefaultAdminSettingsPath({ isSuperUser, tenantPermissions })}
      />
    );
  } else {
    return <SettingsForm />;
  }
};

export default Main;
