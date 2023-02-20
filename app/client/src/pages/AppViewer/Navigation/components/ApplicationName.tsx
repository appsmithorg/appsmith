import React from "react";
import { NavigationSetting } from "constants/AppConstants";
import { StyledApplicationName } from "./ApplicationName.styled";

type ApplicationNameProps = {
  appName?: string;
  navColorStyle: NavigationSetting["navStyle"];
  primaryColor: string;
  forSidebar?: boolean;
};

const ApplicationName = (props: ApplicationNameProps) => {
  const { appName, forSidebar, navColorStyle, primaryColor } = props;

  return (
    <StyledApplicationName
      className="overflow-hidden text-base overflow-ellipsis whitespace-nowrap w-full"
      forSidebar={forSidebar}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      {appName || ""}
    </StyledApplicationName>
  );
};

export default ApplicationName;
