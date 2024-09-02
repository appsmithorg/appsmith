import React, { useEffect, useRef, useState } from "react";
import type { NavigationSetting } from "constants/AppConstants";
import { TooltipComponent } from "@appsmith/ads-old";
import { isEllipsisActive } from "utils/helpers";
import { StyledMenuItemText } from "./MenuText.styled";

interface MenuTextProps {
  name: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}

const MenuText = ({ name, navColorStyle, primaryColor }: MenuTextProps) => {
  const tabNameRef = useRef<HTMLSpanElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);

  useEffect(() => {
    if (isEllipsisActive(tabNameRef?.current)) {
      setEllipsisActive(true);
    }
  }, [tabNameRef]);

  return (
    <TooltipComponent
      boundary="viewport"
      content={name}
      disabled={!ellipsisActive}
      maxWidth="400px"
      modifiers={{
        preventOverflow: {
          enabled: true,
          boundariesElement: "viewport",
        },
      }}
      position="bottom"
    >
      <StyledMenuItemText
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      >
        <div className="relative flex items-center justify-center flex-grow menu-item-text">
          <span ref={tabNameRef}>{name}</span>
        </div>
      </StyledMenuItemText>
    </TooltipComponent>
  );
};

export default MenuText;
