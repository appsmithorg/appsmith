import {
  CLOSE_SIDEBAR_MESSAGE,
  createMessage,
  LOCK_SIDEBAR_MESSAGE,
} from "@appsmith/constants/messages";
import classNames from "classnames";
import { TooltipComponent } from "design-system-old";
import React from "react";
import styled from "styled-components";
import { ReactComponent as UnpinIcon } from "assets/icons/ads/double-arrow-right.svg";
import { ReactComponent as PinIcon } from "assets/icons/ads/double-arrow-left.svg";
import { NavigationSetting } from "constants/AppConstants";
import {
  getApplicationNameTextColor,
  getMenuItemBackgroundColorOnHover,
} from "pages/AppViewer/utils";

const CollapseIconContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  height: 24px;
  width: 24px;
  transition: background 0.3s ease-in-out;
  border-radius: 4px;

  :hover {
    background: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};
  }
`;

const StyledIconContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
`;

type CollapseButtonProps = {
  primaryColor: string;
  navColorStyle: NavigationSetting["navStyle"];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const CollapseButton = (props: CollapseButtonProps) => {
  const { isOpen, navColorStyle, primaryColor, setIsOpen } = props;

  const handleOnClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <CollapseIconContainer
      className={classNames({
        "relative flex items-center justify-center p-0 text-gray-800 transition-all transform duration-400": true,
      })}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      <TooltipComponent
        content={
          <div className="flex items-center justify-between">
            <span>
              {!isOpen
                ? createMessage(LOCK_SIDEBAR_MESSAGE)
                : createMessage(CLOSE_SIDEBAR_MESSAGE)}
            </span>
          </div>
        }
        position="bottom-left"
      >
        <StyledIconContainer
          className="relative w-4 h-4 group cursor-pointer flex items-center justify-center"
          navColorStyle={navColorStyle}
          onClick={handleOnClick}
          primaryColor={primaryColor}
        >
          {!isOpen ? (
            <UnpinIcon className="absolute w-3.5 h-3.5" />
          ) : (
            <PinIcon className="absolute w-3.5 h-3.5" />
          )}
        </StyledIconContainer>
      </TooltipComponent>
    </CollapseIconContainer>
  );
};

export default CollapseButton;
