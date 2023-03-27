import React from "react";
import MenuIcon from "remixicon-react/MenuFillIcon";
import CloseIcon from "remixicon-react/CloseFillIcon";
import { getMenuItemTextColor } from "pages/AppViewer/utils";
import type { NavigationSetting } from "constants/AppConstants";

type MobileNavToggleProps = {
  isMenuOpen: boolean;
  setMenuOpen: (prevState: boolean) => void;
  navColorStyle: NavigationSetting["colorStyle"];
  primaryColor: string;
};

const MobileNavToggle = (props: MobileNavToggleProps) => {
  const { isMenuOpen, navColorStyle, primaryColor, setMenuOpen } = props;

  return (
    <div
      className="block w-5 h-5 cursor-pointer md:hidden mr-3"
      onClick={() => setMenuOpen(!isMenuOpen)}
    >
      {isMenuOpen ? (
        <CloseIcon
          className="w-5 h-5"
          color={getMenuItemTextColor(primaryColor, navColorStyle, true)}
        />
      ) : (
        <MenuIcon
          className="w-5 h-5"
          color={getMenuItemTextColor(primaryColor, navColorStyle, true)}
        />
      )}
    </div>
  );
};

export default MobileNavToggle;
