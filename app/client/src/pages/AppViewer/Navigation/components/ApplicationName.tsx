import React, { useEffect, useRef, useState } from "react";
import type { NavigationSetting } from "constants/AppConstants";
import { StyledApplicationName } from "./ApplicationName.styled";
import { isEllipsisActive } from "utils/helpers";
import { Tooltip } from "@appsmith/ads";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";

interface ApplicationNameProps {
  appName?: string;
  navColorStyle: NavigationSetting["colorStyle"];
  navStyle: NavigationSetting["navStyle"];
  primaryColor: string;
  forSidebar?: boolean;
  fontWeight?: "regular" | "bold";
}

const ApplicationName = (props: ApplicationNameProps) => {
  const {
    appName,
    fontWeight,
    forSidebar,
    navColorStyle,
    navStyle,
    primaryColor,
  } = props;
  const applicationNameRef = useRef<HTMLDivElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);
  const isMobile = useIsMobileDevice();

  useEffect(() => {
    if (isEllipsisActive(applicationNameRef?.current)) {
      setEllipsisActive(true);
    }
  }, [applicationNameRef, appName]);

  return (
    <Tooltip
      content={appName || ""}
      isDisabled={!ellipsisActive}
      placement="bottom"
    >
      <StyledApplicationName
        className="overflow-hidden text-base overflow-ellipsis whitespace-nowrap t--app-viewer-application-name"
        fontWeight={fontWeight || "bold"}
        forSidebar={forSidebar}
        isMobile={isMobile}
        navColorStyle={navColorStyle}
        navStyle={navStyle}
        primaryColor={primaryColor}
        ref={applicationNameRef}
      >
        {appName}
      </StyledApplicationName>
    </Tooltip>
  );
};

export default ApplicationName;
