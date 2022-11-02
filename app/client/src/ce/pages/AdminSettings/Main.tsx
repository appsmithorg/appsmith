import React from "react";
import AdminConfig from "./config";
import { Redirect, useParams } from "react-router";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import SettingsForm from "pages/Settings/SettingsForm";
import { AuditLogsUpgradePage } from "../Upgrade/AuditLogsUpgradePage";
import { AccessControlUpgradePage } from "../Upgrade/AccessControlUpgradePage";
import { UsageUpgradePage } from "../Upgrade/UsageUpgradePage";

const Main = () => {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const wrapperCategory =
    AdminConfig.wrapperCategories[subCategory ?? category];

  /* New flow, where data is hand written and processed differently than old flow
   * In old flow, config and a factory was used to generate the Main content.
   */
  if (category === "access-control") {
    return <AccessControlUpgradePage />;
  }
  if (category === "audit-logs") {
    return <AuditLogsUpgradePage />;
  }
  if (category === "usage") {
    return <UsageUpgradePage />;
  }

  /* Old, still working flow; config, factory based */
  if (!!wrapperCategory?.component) {
    const { component: WrapperCategoryComponent } = wrapperCategory;
    return <WrapperCategoryComponent />;
  } else if (
    !Object.values(SettingCategories).includes(category) ||
    (subCategory && !Object.values(SettingCategories).includes(subCategory))
  ) {
    return <Redirect to={ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH} />;
  } else {
    return <SettingsForm />;
  }
};

export default Main;
