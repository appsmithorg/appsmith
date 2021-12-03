import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  CurrentApplicationData,
  PageListPayload,
} from "constants/ReduxActionConstants";
import Icon, { IconSize } from "components/ads/Icon";
import PageTabs from "./PageTabs";
import useThrottledRAF from "utils/hooks/useThrottledRAF";
import { Colors } from "constants/Colors";

const Container = styled.div`
  width: 100%;
  display: flex;
  padding: 0 ${(props) => props.theme.spaces[7]}px;
  align-items: center;
  & {
    svg path,
    svg:hover path {
      fill: ${Colors.BLACK};
      stroke: ${(props) => props.theme.colors.header.tabText};
    }
  }
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
`;

const ScrollBtnContainer = styled.div<{ visible: boolean }>`
  padding: ${(props) => props.theme.spaces[2]}px;
  cursor: pointer;
  ${(props) =>
    props.visible
      ? `
      visibility: visible;
      opacity: 1;
      transition: visibility 0s linear 0s, opacity 300ms;
    `
      : `
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear 300ms, opacity 300ms;
    `}
`;

type AppViewerHeaderProps = {
  currentApplicationDetails?: CurrentApplicationData;
  pages: PageListPayload;
};

export function PageTabsContainer(props: AppViewerHeaderProps) {
  const { currentApplicationDetails, pages } = props;

  // Mark default page as first page
  const appPages = pages;
  if (appPages.length > 1) {
    appPages.forEach((item, i) => {
      if (item.isDefault) {
        appPages.splice(i, 1);
        appPages.unshift(item);
      }
    });
  }

  const tabsRef = useRef<HTMLElement | null>(null);
  const [tabsScrollable, setTabsScrollable] = useState(false);
  const [shouldShowLeftArrow, setShouldShowLeftArrow] = useState(false);
  const [shouldShowRightArrow, setShouldShowRightArrow] = useState(true);

  const setShowScrollArrows = useCallback(() => {
    if (tabsRef.current) {
      const { offsetWidth, scrollLeft, scrollWidth } = tabsRef.current;
      setShouldShowLeftArrow(scrollLeft > 0);
      setShouldShowRightArrow(scrollLeft + offsetWidth < scrollWidth);
    }
  }, [tabsRef.current]);

  const measuredTabsRef = useCallback((node) => {
    tabsRef.current = node;
    if (node !== null) {
      const { offsetWidth, scrollWidth } = node;
      setTabsScrollable(scrollWidth > offsetWidth);
      setShowScrollArrows();
    }
  }, []);

  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrollingLeft, setIsScrollingLeft] = useState(false);

  const scroll = useCallback(() => {
    const currentOffset = tabsRef.current?.scrollLeft || 0;

    if (tabsRef.current) {
      tabsRef.current.scrollLeft = isScrollingLeft
        ? currentOffset - 5
        : currentOffset + 5;
      setShowScrollArrows();
    }
  }, [tabsRef.current, isScrollingLeft]);
  // eslint-disable-next-line
  const [_intervalRef, _rafRef, requestAF] = useThrottledRAF(scroll, 10);

  const stopScrolling = () => {
    setIsScrolling(false);
    setIsScrollingLeft(false);
  };

  const startScrolling = (isLeft: boolean) => {
    setIsScrolling(true);
    setIsScrollingLeft(isLeft);
  };

  useEffect(() => {
    let clear;
    if (isScrolling) {
      clear = requestAF();
    }
    return clear;
  }, [isScrolling, isScrollingLeft]);

  return appPages.length > 1 ? (
    <Container className="h-9">
      <ScrollBtnContainer
        onMouseDown={() => startScrolling(true)}
        onMouseLeave={stopScrolling}
        onMouseUp={stopScrolling}
        onTouchEnd={stopScrolling}
        onTouchStart={() => startScrolling(true)}
        visible={shouldShowLeftArrow}
      >
        <Icon name="left-arrow-2" size={IconSize.MEDIUM} />
      </ScrollBtnContainer>
      <PageTabs
        appPages={appPages}
        currentApplicationDetails={currentApplicationDetails}
        measuredTabsRef={measuredTabsRef}
        setShowScrollArrows={setShowScrollArrows}
        tabsScrollable={tabsScrollable}
      />
      <ScrollBtnContainer
        onMouseDown={() => startScrolling(false)}
        onMouseLeave={stopScrolling}
        onMouseUp={stopScrolling}
        onTouchEnd={stopScrolling}
        onTouchStart={() => startScrolling(false)}
        visible={shouldShowRightArrow}
      >
        <Icon name="right-arrow-2" size={IconSize.MEDIUM} />
      </ScrollBtnContainer>
    </Container>
  ) : null;
}

export default PageTabsContainer;
