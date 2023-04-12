import React from "react";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { APP_MODE } from "entities/App";
import { get } from "lodash";
import { useHref } from "pages/Editor/utils";
import { useSelector } from "react-redux";
import { builderURL, viewerURL } from "RouteBuilder";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { trimQueryString } from "utils/helpers";
import { Icon } from "design-system-old";
import MenuText from "./MenuText";
import classNames from "classnames";
import { StyledMenuItem } from "./MenuItem.styled";

type MenuItemProps = {
  page: Page;
  query: string;
  navigationSetting?: NavigationSetting;
  isMinimal?: boolean;
};

const MenuItem = ({
  isMinimal,
  navigationSetting,
  page,
  query,
}: MenuItemProps) => {
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
  const borderRadius = get(
    selectedTheme,
    "properties.borderRadius.appBorderRadius",
    "inherit",
  );

  return (
    <StyledMenuItem
      activeClassName="is-active"
      borderRadius={borderRadius}
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
          className={classNames({
            "page-icon": true,
            "mr-2":
              navigationSetting?.itemStyle ===
                NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON && !isMinimal,
            "mx-auto": isMinimal,
          })}
          name="file-line"
          size="large"
        />
      )}
      {navigationSetting?.itemStyle !== NAVIGATION_SETTINGS.ITEM_STYLE.ICON &&
        !isMinimal && (
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
