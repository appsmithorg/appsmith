import React, { useEffect, useRef } from "react";
import scrollIntoView from "scroll-into-view-if-needed";

type MenuItemContainerProps = {
  children: React.ReactNode;
  isTabActive: boolean;
  tabsScrollable?: boolean;
  setShowScrollArrows?: () => void;
  forSidebar?: boolean;
};

const MenuItemContainer = ({
  children,
  forSidebar,
  isTabActive,
  setShowScrollArrows,
  tabsScrollable,
}: MenuItemContainerProps) => {
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (tabContainerRef.current && isTabActive) {
        if (tabsScrollable && setShowScrollArrows) {
          scrollIntoView(tabContainerRef.current as Element, {
            behavior: "smooth",
            scrollMode: "if-needed",
          });

          setShowScrollArrows();
        } else if (forSidebar) {
          scrollIntoView(tabContainerRef.current as Element, {
            behavior: "smooth",
            scrollMode: "if-needed",
          });
        }
      }
    }, 100);
  }, [tabContainerRef.current, isTabActive]);

  return <div ref={tabContainerRef}>{children}</div>;
};

export default MenuItemContainer;
