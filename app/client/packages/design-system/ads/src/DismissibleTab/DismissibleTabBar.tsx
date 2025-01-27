import React, { useEffect, useRef, useState } from "react";
import { noop } from "lodash";

import { ScrollArea } from "../ScrollArea";

import * as Styled from "./DismissibleTabBar.styles";
import type { DismissibleTabBarProps } from "./DismissibleTabBar.types";

export const SCROLL_AREA_OPTIONS = {
  overflow: {
    x: "scroll",
    y: "hidden",
  },
} as const;

const SCROLL_AREA_STYLE = {
  height: 34,
  top: 1,
};

export const DismissibleTabBar = ({
  children,
  disableAdd = false,
  onTabAdd,
}: DismissibleTabBarProps) => {
  const [isStuck, setIsStuck] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleAdd = disableAdd ? noop : onTabAdd;

  useEffect(function observeSticky() {
    if (!containerRef.current || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStuck(false);
        } else {
          setIsStuck(true);
        }
      },
      {
        root: containerRef.current,
        threshold: 1.0,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <Styled.Root>
      <ScrollArea
        data-testid="t--editor-tabs"
        options={SCROLL_AREA_OPTIONS}
        ref={containerRef}
        size="sm"
        style={SCROLL_AREA_STYLE}
      >
        <Styled.TabsContainer data-testid="t--tabs-container" role="tablist">
          {children}
          <Styled.StickySentinel ref={sentinelRef} />
        </Styled.TabsContainer>
      </ScrollArea>
      <Styled.PlusButtonContainer $isStuck={isStuck}>
        <Styled.PlusButton
          disabled={disableAdd}
          isIconButton
          kind="tertiary"
          onClick={handleAdd}
          startIcon="add-line"
          title="Add new tab"
        />
      </Styled.PlusButtonContainer>
    </Styled.Root>
  );
};
