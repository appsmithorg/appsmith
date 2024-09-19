import type { ReactNode } from "react";
import React, { useRef, useState, useCallback } from "react";
import styled from "styled-components";
import type { MaybeElement } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import type { ComponentProps } from "widgets/BaseComponent";
import { Icon, IconSize } from "@design-system/widgets-old";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { Colors } from "constants/Colors";
import PageTabs from "./PageTabs";
import { scrollCSS } from "widgets/WidgetUtils";

interface TabsComponentProps extends ComponentProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  selectedTabWidgetId: string;
  shouldShowTabs: boolean;
  borderRadius: string;
  boxShadow?: string;
  borderWidth?: number;
  borderColor?: string;
  accentColor?: string;
  primaryColor: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    widgetId: string;
    isVisible?: boolean;
  }>;
  width: number;
  $noScroll: boolean;
}

const TabsContainerWrapper = styled.div<{
  borderRadius: string;
  boxShadow?: string;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  border-width: ${(props) => props.borderWidth}px;
  border-color: ${(props) => props.borderColor || "transparent"};
  background-color: ${(props) =>
    props.backgroundColor || "var(--wds-color-bg)"};
  border-style: solid;
  overflow: hidden;
`;

export interface TabsContainerProps {
  isScrollable: boolean;
}

const Container = styled.div`
  width: 100%;
  align-items: flex-end;
  height: 40px;

  & {
    svg path,
    svg:hover path {
      fill: ${Colors.BLACK};
      stroke: ${(props) => props.theme.colors.header.tabText};
    }
  }
  border-bottom: 1px solid var(--wds-color-border-onaccent);
`;

const ScrollBtnContainer = styled.div<{ visible: boolean }>`
  cursor: pointer;
  display: flex;
  position: absolute;
  height: 30px;
  padding: 0 10px;

  & > span {
    background: white;
    position: relative;
    z-index: 1;
  }

  ${(props) =>
    props.visible
      ? `
      visibility: visible;
      opacity: 1;
      z-index: 1;
      transition: visibility 0s linear 0s, opacity 300ms;
    `
      : `
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear 300ms, opacity 300ms;
    `}
`;

export interface ScrollNavControlProps {
  onClick: () => void;
  icon: IconName | MaybeElement;
  disabled?: boolean;
  className?: string;
}

const ScrollCanvas = styled.div<{ $shouldScrollContents: boolean }>`
  overflow: hidden;
  ${(props) => (props.$shouldScrollContents ? scrollCSS : ``)}
  width: 100%;
`;

function TabsComponent(props: TabsComponentProps) {
  const { onTabChange, tabs } = props;

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
  }, [tabsRef.current, tabs]);

  const measuredTabsRef = useCallback(
    (node) => {
      tabsRef.current = node;

      if (node !== null) {
        const { offsetWidth, scrollWidth } = node;

        setTabsScrollable(scrollWidth > offsetWidth);
        setShowScrollArrows();
      }
    },
    [tabs],
  );

  const scroll = useCallback(
    (isScrollingLeft) => {
      const currentOffset = tabsRef.current?.scrollLeft || 0;

      if (tabsRef.current) {
        tabsRef.current.scrollLeft = isScrollingLeft
          ? currentOffset - 50
          : currentOffset + 50;
        setShowScrollArrows();
      }
    },
    [tabsRef.current],
  );

  return (
    <TabsContainerWrapper
      backgroundColor={props.backgroundColor}
      borderColor={props.borderColor}
      borderRadius={props.borderRadius}
      borderWidth={props.borderWidth}
      boxShadow={props.boxShadow}
    >
      {props.shouldShowTabs && (
        <Container className="relative flex px-6 h-9">
          <ScrollBtnContainer
            className="left-0 cursor-pointer scroll-nav-left-button"
            onClick={() => scroll(true)}
            visible={shouldShowLeftArrow}
          >
            <Icon name="left-arrow-2" size={IconSize.MEDIUM} />
          </ScrollBtnContainer>
          <PageTabs
            accentColor={props.accentColor}
            backgroundColor={props.backgroundColor}
            measuredTabsRef={measuredTabsRef}
            selectedTabWidgetId={props.selectedTabWidgetId}
            setShowScrollArrows={setShowScrollArrows}
            tabChange={onTabChange}
            tabs={tabs}
            tabsScrollable={tabsScrollable}
          />
          <ScrollBtnContainer
            className="right-0 cursor-pointer scroll-nav-right-button"
            onClick={() => scroll(false)}
            visible={shouldShowRightArrow}
          >
            <Icon name="right-arrow-2" size={IconSize.MEDIUM} />
          </ScrollBtnContainer>
        </Container>
      )}

      <ScrollCanvas
        $shouldScrollContents={!!props.shouldScrollContents && !props.$noScroll}
        className={`${
          props.shouldScrollContents ? getCanvasClassName() : ""
        } ${generateClassName(props.widgetId)}`}
      >
        {props.children}
      </ScrollCanvas>
    </TabsContainerWrapper>
  );
}

export default TabsComponent;
