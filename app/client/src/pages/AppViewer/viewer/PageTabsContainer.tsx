import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  ApplicationPayload,
  PageListPayload,
} from "constants/ReduxActionConstants";
import Icon from "components/ads/Icon";
import PageTabs from "./PageTabs";

const Container = styled.div`
  width: 100%;
  display: flex;
  padding: 0 30px;
  align-items: center;
  & {
    svg path,
    svg:hover path {
      fill: transparent;
    }
  }
`;

const ScrollBtnContainer = styled.div`
  padding: ${(props) => props.theme.spaces[2]}px;
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

  const animationFrameRef = useRef<number | null>();

  const [tabsScrollable, setTabsScrollable] = useState(false);
  const tabsRef = useRef<HTMLElement | null>(null);
  const measuredTabsRef = useCallback((node) => {
    tabsRef.current = node;
    if (node !== null) {
      const { scrollWidth, offsetWidth } = node;
      setTabsScrollable(scrollWidth > offsetWidth);
    }
  }, []);

  const _cancelAnimationFrame = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [animationFrameRef.current]);

  const onMouseDown = useCallback(
    (isLeft: boolean) => {
      const currentOffset = tabsRef.current?.scrollLeft || 0;
      if (tabsRef.current) {
        tabsRef.current.scrollLeft = isLeft
          ? currentOffset - 5
          : currentOffset + 5;
      }
      animationFrameRef.current = requestAnimationFrame(() =>
        onMouseDown(isLeft),
      );
    },
    [animationFrameRef.current],
  );

  useEffect(() => {
    return _cancelAnimationFrame;
  }, []);

  return appPages.length > 1 ? (
    <Container>
      {tabsScrollable && (
        <ScrollBtnContainer
          onMouseDown={() => onMouseDown(true)}
          onMouseUp={_cancelAnimationFrame}
          onMouseLeave={_cancelAnimationFrame}
        >
          <Icon name="chevron-left" />
        </ScrollBtnContainer>
      )}
      <PageTabs
        measuredTabsRef={measuredTabsRef}
        appPages={appPages}
        currentApplicationDetails={currentApplicationDetails}
      />
      {tabsScrollable && (
        <ScrollBtnContainer
          onMouseDown={() => onMouseDown(false)}
          onMouseUp={_cancelAnimationFrame}
          onMouseLeave={_cancelAnimationFrame}
        >
          <Icon name="chevron-right" />
        </ScrollBtnContainer>
      )}
    </Container>
  ) : null;
};

export default PageTabsContainer;
