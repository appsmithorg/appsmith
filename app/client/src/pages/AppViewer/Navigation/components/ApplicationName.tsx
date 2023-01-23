import React from "react";
import styled from "styled-components";
import { NavigationSetting } from "constants/AppConstants";
import { getApplicationNameTextColor } from "pages/AppViewer/utils";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import classNames from "classnames";

const StyledApplicationName = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  forSidebar?: boolean;
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
  font-size: ${({ forSidebar }) =>
    forSidebar ? THEMEING_TEXT_SIZES.sm : THEMEING_TEXT_SIZES.base};
  max-width: 230px;
`;

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
