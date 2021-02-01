import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  ApplicationPayload,
  PageListPayload,
} from "constants/ReduxActionConstants";
import Icon from "components/ads/Icon";
import PageTabs from "./PageTabs";
import useThrottledRAF from "utils/hooks/useThrottledRAF";

const Container = styled.div`
  width: 100%;
  display: flex;
  padding-right: ${(props) => props.theme.spaces[7]}px;
  align-items: center;
  & {
    svg path,
    svg:hover path {
      fill: transparent;
      stroke: ${(props) => props.theme.colors.header.tabText};
    }
  }
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
  currentApplicationDetails?: ApplicationPayload;
  pages: PageListPayload;
};

export const PageTabsContainer = (props: AppViewerHeaderProps) => {
  const { currentApplicationDetails, pages } = props;

  // Mark default page as first page
  const appPages = pages;
  if (appPages.length > 1) {
    appPages.forEach(function(item, i) {
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

  const setShowScrollArrows = useCallback((node) => {
    if (node) {
      const { scrollWidth, offsetWidth, scrollLeft } = node;
      setShouldShowLeftArrow(scrollLeft > 0);
      setShouldShowRightArrow(scrollLeft + offsetWidth < scrollWidth);
    }
  }, []);

  const measuredTabsRef = useCallback((node) => {
    tabsRef.current = node;
    if (node !== null) {
      const { scrollWidth, offsetWidth } = node;
      setTabsScrollable(scrollWidth > offsetWidth);
      setShowScrollArrows(node);
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
      setShowScrollArrows(tabsRef.current);
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
    <Container>
      <ScrollBtnContainer
        onMouseDown={() => startScrolling(true)}
        onMouseUp={stopScrolling}
        onMouseLeave={stopScrolling}
        visible={shouldShowLeftArrow}
      >
        <Icon name="chevron-left" />
      </ScrollBtnContainer>
      <PageTabs
        measuredTabsRef={measuredTabsRef}
        appPages={appPages}
        currentApplicationDetails={currentApplicationDetails}
        tabsScrollable={tabsScrollable}
      />
      <ScrollBtnContainer
        onMouseDown={() => startScrolling(false)}
        onMouseUp={stopScrolling}
        onMouseLeave={stopScrolling}
        visible={shouldShowRightArrow}
      >
        <Icon name="chevron-right" />
      </ScrollBtnContainer>
    </Container>
  ) : null;
};

export default PageTabsContainer;
