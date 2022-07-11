import React from "react";
import AdminConfig from "./config";
import { Redirect, useParams } from "react-router";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import SettingsForm from "pages/Settings/SettingsForm";

const Main = () => {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const wrapperCategory =
    AdminConfig.wrapperCategories[subCategory ?? category];

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
