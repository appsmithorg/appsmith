export * from "ce/pages/AdminSettings/Main";
import React from "react";
import AdminConfig, { AclFactory, OthersFactory } from "./config";
import { Redirect, useParams } from "react-router";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import SettingsForm from "pages/Settings/SettingsForm";
import { getDefaultAdminSettingsPath } from "@appsmith/utils/adminSettingsHelpers";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";

const Main = () => {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const user = useSelector(getCurrentUser);
  const tenantPermissions = useSelector(getTenantPermissions);
  const wrapperCategory =
    AdminConfig.wrapperCategories[subCategory ?? category];
  const aclWrapperCategory = AclFactory.wrapperCategories[category];
  const otherWrapperCategory = OthersFactory.wrapperCategories[category];
  if (!!otherWrapperCategory?.component) {
    const { component: WrapperCategoryComponent } = otherWrapperCategory;
    return <WrapperCategoryComponent />;
  } else if (!!aclWrapperCategory?.component) {
    const { component: WrapperCategoryComponent } = aclWrapperCategory;
    return <WrapperCategoryComponent />;
  } else if (!!wrapperCategory?.component) {
    const { component: WrapperCategoryComponent } = wrapperCategory;
    return <WrapperCategoryComponent category={wrapperCategory} />;
  } else if (
    !Object.values(SettingCategories).includes(category) ||
    (subCategory && !Object.values(SettingCategories).includes(subCategory))
  ) {
    return (
      <Redirect
        to={getDefaultAdminSettingsPath({
          isSuperUser: user?.isSuperUser,
          tenantPermissions,
        })}
      />
    );
  } else {
    return <SettingsForm />;
  }
};

export default Main;
