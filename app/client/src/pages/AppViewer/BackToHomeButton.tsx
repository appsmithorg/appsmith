import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import AppsIcon from "remixicon-react/AppsLineIcon";

import { getSelectedAppTheme } from "selectors/appThemingSelectors";

function BackToHomeButton() {
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <Link
      className="flex items-center gap-1 group t--back-to-home hover:no-underline"
      to="/applications"
    >
      <AppsIcon
        className="p-1 text-[#858282] w-7 h-7 group-hover:bg-gray-100"
        style={{
          borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
        }}
      />
      <span className="hidden md:block text-[#4B4848]">Apps</span>
    </Link>
  );
}

export default BackToHomeButton;
