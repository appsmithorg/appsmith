import React from "react";
import { getMenuItemTextColor } from "pages/AppViewer/utils";
import type { NavigationSetting } from "constants/AppConstants";
import { Icon } from "@appsmith/ads";

interface MobileNavToggleProps {
  isMenuOpen: boolean;
  setMenuOpen: (prevState: boolean) => void;
  navColorStyle: NavigationSetting["colorStyle"];
  primaryColor: string;
}

const MobileNavToggle = (props: MobileNavToggleProps) => {
  const { isMenuOpen, navColorStyle, primaryColor, setMenuOpen } = props;

  return (
    <div
      className="block w-5 h-5 cursor-pointer md:hidden mr-3"
      onClick={() => setMenuOpen(!isMenuOpen)}
    >
      {isMenuOpen ? (
        <Icon
          className="w-5 h-5"
          color={getMenuItemTextColor(primaryColor, navColorStyle, true)}
          name="close-x"
          size="lg"
        />
      ) : (
        <Icon
          className="w-5 h-5"
          color={getMenuItemTextColor(primaryColor, navColorStyle, true)}
          name="hamburger"
          size="lg"
        />
      )}
    </div>
  );
};

export default MobileNavToggle;
