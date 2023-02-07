import styled from "styled-components";
import {
  APPLICATION_TITLE_MAX_WIDTH,
  NavigationSetting,
} from "constants/AppConstants";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import { getApplicationNameTextColor } from "pages/AppViewer/utils";

export const StyledApplicationName = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  forSidebar?: boolean;
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
  font-size: ${({ forSidebar }) =>
    forSidebar ? THEMEING_TEXT_SIZES.sm : THEMEING_TEXT_SIZES.base};
  max-width: ${APPLICATION_TITLE_MAX_WIDTH}px;
`;
