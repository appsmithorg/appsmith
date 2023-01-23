import React, { useEffect, useRef, useState } from "react";
import { NavigationSetting } from "constants/AppConstants";
import { TooltipComponent } from "design-system-old";
import { isEllipsisActive } from "utils/helpers";
import { StyledMenuItemText } from "./StyledMenuItem";

type MenuTextProps = {
  name: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
};

const MenuText = ({ name, navColorStyle, primaryColor }: MenuTextProps) => {
  const tabNameRef = useRef<HTMLSpanElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);
  const tabNameText = (
    <StyledMenuItemText
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      <div className="relative flex items-center justify-center flex-grow">
        <span ref={tabNameRef}>{name}</span>
        {ellipsisActive && "..."}
      </div>
    </StyledMenuItemText>
  );

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
      position="bottom"
    >
      {tabNameText}
    </TooltipComponent>
  );
};

export default MenuText;
