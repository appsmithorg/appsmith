import {
  CLOSE_SIDEBAR_MESSAGE,
  createMessage,
  LOCK_SIDEBAR_MESSAGE,
} from "ee/constants/messages";
import classNames from "classnames";
import { TooltipComponent } from "@appsmith/ads-old";
import React from "react";
import type { NavigationSetting } from "constants/AppConstants";
import {
  CollapseIconContainer,
  StyledIconContainer,
  TooltipStyles,
} from "./CollapseButton.styled";
import { importSvg } from "@appsmith/ads-old";

const UnpinIcon = importSvg(
  async () => import("assets/icons/ads/double-arrow-right.svg"),
);
const PinIcon = importSvg(
  async () => import("assets/icons/ads/double-arrow-left.svg"),
);

interface CollapseButtonProps {
  borderRadius: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  isOpen: boolean;
  isPinned: boolean;
  setIsPinned: (isPinned: boolean) => void;
}

const CollapseButton = (props: CollapseButtonProps) => {
  const {
    borderRadius,
    isOpen,
    isPinned,
    navColorStyle,
    primaryColor,
    setIsPinned,
  } = props;

  const handleOnClick = () => {
    setIsPinned(!isPinned);
  };

  return (
    <>
      <TooltipStyles />

      <TooltipComponent
        content={
          <div className="flex items-center justify-between">
            <span>
              {!isPinned
                ? createMessage(LOCK_SIDEBAR_MESSAGE)
                : createMessage(CLOSE_SIDEBAR_MESSAGE)}
            </span>
          </div>
        }
        popoverClassName={!isPinned && !isOpen ? "app-sidebar-tooltip" : ""}
        position="bottom-left"
      >
        <CollapseIconContainer
          borderRadius={borderRadius}
          className={classNames({
            "relative flex items-center justify-center p-0 text-gray-800 transition-all transform duration-400 cursor-pointer t--app-viewer-navigation-sidebar-collapse":
              true,
          })}
          isOpen={isOpen}
          isPinned={isPinned}
          navColorStyle={navColorStyle}
          onClick={handleOnClick}
          primaryColor={primaryColor}
        >
          <StyledIconContainer
            className="relative w-4 h-4 group flex items-center justify-center"
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          >
            {!isPinned ? (
              <UnpinIcon className="absolute w-3.5 h-3.5" />
            ) : (
              <PinIcon className="absolute w-3.5 h-3.5" />
            )}
          </StyledIconContainer>
        </CollapseIconContainer>
      </TooltipComponent>
    </>
  );
};

export default CollapseButton;
