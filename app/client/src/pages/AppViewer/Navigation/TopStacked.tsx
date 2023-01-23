import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import MenuItemContainer from "./components/MenuItemContainer";
import MenuItem from "./components/MenuItem";

// TODO - @Dhruvik - ImprovedAppNav
// Replace with NavigationProps if nothing changes
// appsmith/app/client/src/pages/AppViewer/Navigation/constants.ts
type TopStackedProps = {
  appPages: Page[];
  currentApplicationDetails?: ApplicationPayload;
  measuredTabsRef: (ref: HTMLElement | null) => void;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
};

const TopStacked = (props: TopStackedProps) => {
  const { appPages, currentApplicationDetails } = props;
  const location = useLocation();
  const { pathname } = location;
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(window.location.search);
  }, [location]);

  return (
    <div
      className="flex w-full hidden-scrollbar gap-x-2  items-center"
      ref={props.measuredTabsRef}
    >
      {appPages.map((page) => {
        return (
          <MenuItemContainer
            isTabActive={pathname.indexOf(page.pageId) > -1}
            key={page.pageId}
            setShowScrollArrows={props.setShowScrollArrows}
            tabsScrollable={props.tabsScrollable}
          >
            <MenuItem
              navigationSetting={currentApplicationDetails?.navigationSetting}
              page={page}
              query={query}
            />
          </MenuItemContainer>
        );
      })}
    </div>
  );
};

export default TopStacked;
