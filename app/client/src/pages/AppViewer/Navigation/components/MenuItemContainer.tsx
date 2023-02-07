import React, { useEffect, useRef } from "react";

type MenuItemContainerProps = {
  children: React.ReactNode;
  isTabActive: boolean;
  tabsScrollable?: boolean;
  setShowScrollArrows?: () => void;
};

const MenuItemContainer = ({
  children,
  isTabActive,
  setShowScrollArrows,
  tabsScrollable,
}: MenuItemContainerProps) => {
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTabActive && tabsScrollable && setShowScrollArrows) {
      tabContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setShowScrollArrows();
    }
  }, [isTabActive, tabsScrollable]);

  return <div ref={tabContainerRef}>{children}</div>;
};

export default MenuItemContainer;
