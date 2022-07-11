import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router";
import AppsIcon from "remixicon-react/AppsLineIcon";

import { getSelectedAppTheme } from "selectors/appThemingSelectors";

function BackToHomeButton() {
  const history = useHistory();
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <button
      className="flex items-center gap-1 group t--back-to-home"
      onClick={() => {
        history.push("/applications");
      }}
    >
      <AppsIcon
        className="p-1 text-[#858282] w-7 h-7 group-hover:bg-gray-100"
        style={{
          borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
        }}
      />
      <span className="hidden md:block text-[#4B4848]">Apps</span>
    </button>
  );
}

export default BackToHomeButton;
