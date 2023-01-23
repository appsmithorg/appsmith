import React from "react";
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
import { APP_MODE } from "entities/App";
import { get } from "lodash";
import { useHref } from "pages/Editor/utils";
import { useSelector } from "react-redux";
import { builderURL, viewerURL } from "RouteBuilder";
import { getAppMode } from "selectors/applicationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import StyledMenuItem from "./StyledMenuItem";
import { trimQueryString } from "utils/helpers";
import { Icon } from "design-system-old";
import MenuText from "./MenuText";

type MenuItemProps = {
  page: Page;
  query: string;
  navigationSetting?: NavigationSetting;
};

const MenuItem = ({ navigationSetting, page, query }: MenuItemProps) => {
  const appMode = useSelector(getAppMode);
  const pageURL = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { pageId: page.pageId },
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  const navColorStyle =
    navigationSetting?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  return (
    <StyledMenuItem
      activeClassName="is-active"
      className="t--page-switch-tab"
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
      to={{
        pathname: trimQueryString(pageURL),
        search: query,
      }}
    >
      {navigationSetting?.itemStyle !== NAVIGATION_SETTINGS.ITEM_STYLE.TEXT && (
        <Icon
          className={`page-icon ${
            !navigationSetting ||
            navigationSetting?.itemStyle ===
              NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON
              ? "mr-2"
              : ""
          }`}
          name="file-line"
          size="large"
        />
      )}
      {navigationSetting?.itemStyle !== NAVIGATION_SETTINGS.ITEM_STYLE.ICON && (
        <MenuText
          name={page.pageName}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        />
      )}
    </StyledMenuItem>
  );
};

export default MenuItem;
