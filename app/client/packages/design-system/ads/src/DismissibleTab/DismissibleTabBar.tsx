import React, { useEffect, useRef, useState } from "react";
import noop from "lodash/noop";
import clsx from "clsx";

import { Spinner } from "../Spinner";
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
  height: 32,
};

export const DismissibleTabBar = ({
  children,
  className,
  disableAdd = false,
  hideAdd = false,
  isAddingNewTab,
  onTabAdd,
}: DismissibleTabBarProps) => {
  const [isLeftIntersecting, setIsLeftIntersecting] = useState(false);
  const [isRightIntersecting, setIsRightIntersecting] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelLeftRef = useRef<HTMLDivElement | null>(null);
  const sentinelRightRef = useRef<HTMLDivElement | null>(null);

  const handleAdd = disableAdd ? noop : onTabAdd;

  useEffect(function observeSticky() {
    if (
      !containerRef.current ||
      !sentinelLeftRef.current ||
      !sentinelRightRef.current
    )
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === sentinelLeftRef.current) {
            setIsLeftIntersecting(!entry.isIntersecting);
          }

          if (entry.target === sentinelRightRef.current) {
            setIsRightIntersecting(!entry.isIntersecting);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 1.0,
      },
    );

    observer.observe(sentinelLeftRef.current);
    observer.observe(sentinelRightRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(
    function debouncedScrollActiveTabIntoView() {
      const timerId = setTimeout(() => {
        // accessing active tab with a document query is a bit hacky, but it's more performant than keeping a map of refs and cloning children
        const activeTab = document.querySelector(".editor-tab.active");

        if (activeTab) {
          activeTab.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }, 100);

      return () => clearTimeout(timerId);
    },
    [children],
  );

  return (
    <Styled.Root
      $showLeftBorder={isLeftIntersecting}
      className={clsx(className)}
    >
      <ScrollArea
        data-testid="t--editor-tabs"
        options={SCROLL_AREA_OPTIONS}
        ref={containerRef}
        size="sm"
        style={SCROLL_AREA_STYLE}
      >
        <Styled.TabsContainer data-testid="t--tabs-container" role="tablist">
          <Styled.StickySentinel ref={sentinelLeftRef} />
          {children}
          <Styled.StickySentinel ref={sentinelRightRef} />
        </Styled.TabsContainer>
      </ScrollArea>
      {!hideAdd && (
        <Styled.PlusButtonContainer $showLeftBorder={isRightIntersecting}>
          {isAddingNewTab ? (
            <Spinner size="md" />
          ) : (
            <Styled.PlusButton
              data-testid="t--ide-tabs-add-button"
              isDisabled={disableAdd}
              isIconButton
              kind="tertiary"
              onClick={handleAdd}
              startIcon="add-line"
              title="Add new tab"
            />
          )}
        </Styled.PlusButtonContainer>
      )}
    </Styled.Root>
  );
};
