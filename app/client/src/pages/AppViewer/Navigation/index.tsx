import React from "react";
import { NavigationProps } from "./constants";
import TopStacked from "./TopStacked";

const Navigation = (props: NavigationProps) => {
  const {
    appPages,
    currentApplicationDetails,
    measuredTabsRef,
    setShowScrollArrows,
    tabsScrollable,
  } = props;

  const navComponent = (
    <TopStacked
      appPages={appPages}
      currentApplicationDetails={currentApplicationDetails}
      measuredTabsRef={measuredTabsRef}
      setShowScrollArrows={setShowScrollArrows}
      tabsScrollable={tabsScrollable}
    />
  );

  return navComponent;
};

export default Navigation;
