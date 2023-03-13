import React, { useEffect, useRef, useState } from "react";
import {
  APPLICATION_TITLE_MAX_WIDTH,
  NavigationSetting,
} from "constants/AppConstants";
import { StyledApplicationName } from "./ApplicationName.styled";
import { isEllipsisActive } from "utils/helpers";
import { TooltipComponent } from "design-system-old";

type ApplicationNameProps = {
  appName?: string;
  navColorStyle: NavigationSetting["colorStyle"];
  primaryColor: string;
  forSidebar?: boolean;
};

const ApplicationName = (props: ApplicationNameProps) => {
  const { appName, forSidebar, navColorStyle, primaryColor } = props;
  const applicationNameRef = useRef<HTMLDivElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);

  useEffect(() => {
    if (isEllipsisActive(applicationNameRef?.current)) {
      setEllipsisActive(true);
    }
  }, [applicationNameRef, appName]);

  return (
    <TooltipComponent
      boundary="viewport"
      content={appName}
      disabled={!ellipsisActive}
      maxWidth={`${APPLICATION_TITLE_MAX_WIDTH}px`}
      modifiers={{
        preventOverflow: {
          enabled: true,
          boundariesElement: "viewport",
        },
      }}
      position="bottom"
    >
      <StyledApplicationName
        className="overflow-hidden text-base overflow-ellipsis whitespace-nowrap"
        forSidebar={forSidebar}
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
        ref={applicationNameRef}
      >
        {appName}
      </StyledApplicationName>
    </TooltipComponent>
  );
};

export default ApplicationName;
