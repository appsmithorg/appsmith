export * from "ce/pages/AppViewer/BackToHomeButton";

import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import AppsIcon from "remixicon-react/AppsLineIcon";

import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

function BackToHomeButton() {
  const tenantConfig = useSelector(getTenantConfig);
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <Link
      className="flex items-center gap-2 group t--back-to-home hover:no-underline"
      to="/applications"
    >
      <AppsIcon
        className="p-1 text-[#858282] w-7 h-7 group-hover:bg-gray-100"
        style={{
          borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
        }}
      />
      <img alt="Logo" className="h-6" src={tenantConfig.brandLogoUrl} />
    </Link>
  );
}

export default BackToHomeButton;
