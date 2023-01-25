import React from "react";
import { NavigationSetting } from "constants/AppConstants";
import classNames from "classnames";
import { StyledApplicationName } from "./ApplicationName.styled";

type ApplicationNameProps = {
  appName: string;
  navColorStyle: NavigationSetting["navStyle"];
  primaryColor: string;
  forSidebar?: boolean;
};

const ApplicationName = (props: ApplicationNameProps) => {
  const { appName, forSidebar, navColorStyle, primaryColor } = props;

  return (
    <StyledApplicationName
      className={classNames({
        "overflow-hidden text-base overflow-ellipsis whitespace-nowrap": true,
        "w-7/12": !forSidebar,
        "w-full": forSidebar,
      })}
      forSidebar={forSidebar}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      {appName}
    </StyledApplicationName>
  );
};

export default ApplicationName;
