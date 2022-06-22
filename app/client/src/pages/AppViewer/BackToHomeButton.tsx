import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router";
import AppsIcon from "remixicon-react/AppsLineIcon";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

function BackToHomeButton() {
  const history = useHistory();
  const currentUser = useSelector(getCurrentUser);
  const selectedTheme = useSelector(getSelectedAppTheme);

  // if user is not logged in, don't render anything
  if (currentUser?.username == ANONYMOUS_USERNAME) return null;

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
