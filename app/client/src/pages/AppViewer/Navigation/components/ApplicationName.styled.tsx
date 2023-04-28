import styled from "styled-components";
import {
  APPLICATION_TITLE_MAX_WIDTH,
  APPLICATION_TITLE_MAX_WIDTH_MOBILE,
  NAVIGATION_SETTINGS,
} from "constants/AppConstants";
import type { NavigationSetting } from "constants/AppConstants";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import { getApplicationNameTextColor } from "pages/AppViewer/utils";

export const StyledApplicationName = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  navStyle: NavigationSetting["navStyle"];
  isMobile: boolean;
  forSidebar?: boolean;
  fontWeight: "regular" | "bold";
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
  font-size: ${THEMEING_TEXT_SIZES.base};
  font-weight: ${({ fontWeight }) =>
    fontWeight === "regular" ? "400" : "600"};
  ${({ forSidebar }) => (forSidebar ? "margin-left: 6px;" : "")};

  ${({ isMobile, navStyle }) => {
    if (isMobile) {
      return `max-width: ${APPLICATION_TITLE_MAX_WIDTH_MOBILE}px;`;
    } else if (
      navStyle === NAVIGATION_SETTINGS.NAV_STYLE.STACKED &&
      !isMobile
    ) {
      return `max-width: 500px;`;
    } else {
      return `max-width: ${APPLICATION_TITLE_MAX_WIDTH}px;`;
    }
  }}
`;
