import React, {
  RefObject,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";
import { Button, MaybeElement } from "@blueprintjs/core";

import { ComponentProps } from "widgets/BaseComponent";
import {
  TabsWidgetProps,
  TabContainerWidgetProps,
  SCROLL_SIZE,
  SCROLL_NAV_CONTROL_CONTAINER_WIDTH,
} from "../constants";
import { generateClassName, getCanvasClassName } from "utils/generators";
import ScrollIndicator from "components/ads/ScrollIndicator";
import { IconName } from "@blueprintjs/icons";

interface TabsComponentProps extends ComponentProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  selectedTabWidgetId: string;
  shouldShowTabs: boolean;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    widgetId: string;
    isVisible?: boolean;
  }>;
  width: number;
}

type ChildrenWrapperProps = Pick<TabsComponentProps, "shouldShowTabs">;

const TAB_CONTAINER_HEIGHT = "40px";
const CHILDREN_WRAPPER_HEIGHT_WITH_TABS = `calc(100% - ${TAB_CONTAINER_HEIGHT})`;
const CHILDREN_WRAPPER_HEIGHT_WITHOUT_TABS = "100%";

const scrollContents = css`
  overflow-y: auto;
  position: absolute;
`;

const TabsContainerWrapper = styled.div<{
  ref: RefObject<HTMLDivElement>;
}>`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 0px 0px 1px #e7e7e7;
  border-radius: 0;
  overflow: hidden;
`;

const ChildrenWrapper = styled.div<ChildrenWrapperProps>`
  height: ${({ shouldShowTabs }) =>
    shouldShowTabs
      ? CHILDREN_WRAPPER_HEIGHT_WITH_TABS
      : CHILDREN_WRAPPER_HEIGHT_WITHOUT_TABS};
  width: 100%;
  position: relative;
  background: ${(props) => props.theme.colors.builderBodyBG};
`;

const ScrollableCanvasWrapper = styled.div<
  TabsWidgetProps<TabContainerWidgetProps> & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  ${(props) => (props.shouldScrollContents ? scrollContents : "")}
`;

export interface TabsContainerProps {
  isScrollable: boolean;
}

const TabsContainer = styled.div<TabsContainerProps>`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  background: ${(props) => props.theme.colors.builderBodyBG};
  overflow: hidden;

  overflow-x: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  ${({ isScrollable }) =>
    isScrollable
      ? `padding-left: ${SCROLL_NAV_CONTROL_CONTAINER_WIDTH}px`
      : `padding-left: 0`};

  && {
    height: ${TAB_CONTAINER_HEIGHT};
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }
`;

type TabProps = {
  selected?: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const StyledTab = styled.div`
  height: 32px;
  background: ${(props) => props.theme.colors.builderBodyBG};
  border-bottom: 1px solid ${(props) => props.theme.colors.bodyBG};
  border-color: ${(props) => props.theme.colors.bodyBG};
  width: 100%;
`;

const StyledText = styled.div<TabProps>`
  white-space: nowrap;
  background: ${(props) => props.theme.colors.builderBodyBG};
  color: ${(props) => props.theme.colors.menuIconColorInactive};
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  line-height: 32px;
  height: 32px;
  padding: 0 16px;
  border-bottom: ${(props) => (props.selected ? "0" : "1px")} solid;
  border-color: ${(props) => props.theme.colors.bodyBG};
  cursor: pointer;
  box-shadow: ${(props) => (props.selected ? props.theme.shadows[0] : "")};
  &:hover {
    background: ${(props) =>
      props.selected
        ? props.theme.colors.textOnDarkBG
        : props.theme.colors.hover};
  }
  &:first-child {
    box-shadow: ${(props) => (props.selected ? props.theme.shadows[1] : "")};
  }
`;

const ScrollNavControlContainer = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  background: white;
`;

export interface ScrollNavControlProps {
  onClick: () => void;
  icon: IconName | MaybeElement;
  disabled?: boolean;
}

function ScrollNavControl(props: ScrollNavControlProps) {
  const { disabled, icon, onClick } = props;
  return <Button disabled={disabled} icon={icon} onClick={onClick} />;
}

function TabsComponent(props: TabsComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onTabChange, tabs, width, ...remainingProps } = props;
  const tabContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  const tabsRef = useRef<HTMLDivElement>(null);

  const [isScrollable, setIsScrollable] = useState(false);
  const [isZeroScrolled, setIsZeroScrolled] = useState(true);
  const [isMaxScrolled, setIsMaxScrolled] = useState(false);

  useEffect(() => {
    if (!props.shouldScrollContents) {
      tabContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.shouldScrollContents]);

  useEffect(() => {
    if (tabsRef.current) {
      // Check if the current tabs container has scroll
      const scrollWidth = tabsRef.current.scrollWidth;
      if (scrollWidth > tabsRef.current.clientWidth) {
        if (
          !isScrollable ||
          scrollWidth - SCROLL_NAV_CONTROL_CONTAINER_WIDTH > width
        ) {
          setIsScrollable(true);
          return;
        }
      }
      setIsScrollable(false);
    }
  }, [tabs, width]);

  const handleScrollLeft = useCallback(() => {
    if (tabsRef.current) {
      tabsRef.current.scrollLeft -= SCROLL_SIZE;
    }
  }, []);

  const handleScrollRight = useCallback(() => {
    if (tabsRef.current) {
      tabsRef.current.scrollLeft += SCROLL_SIZE;
    }
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const targetElement = e.currentTarget;
    const scrollLeft = targetElement.scrollLeft;
    if (scrollLeft === 0) {
      setIsZeroScrolled(true);
      return;
    }

    const isScrolledByMax =
      targetElement.scrollWidth - targetElement.scrollLeft ===
      targetElement.clientWidth;
    if (isScrolledByMax) {
      setIsMaxScrolled(true);
      return;
    }
    setIsZeroScrolled(false);
    setIsMaxScrolled(false);
  }, []);

  return (
    <TabsContainerWrapper ref={tabContainerRef}>
      {isScrollable && (
        <ScrollNavControlContainer>
          <ScrollNavControl
            disabled={isZeroScrolled}
            icon="caret-left"
            onClick={handleScrollLeft}
          />
          <ScrollNavControl
            disabled={isMaxScrolled}
            icon="caret-right"
            onClick={handleScrollRight}
          />
        </ScrollNavControlContainer>
      )}
      {props.shouldShowTabs ? (
        <TabsContainer
          isScrollable={isScrollable}
          onScroll={handleScroll}
          ref={tabsRef}
        >
          {props.tabs.map((tab, index) => (
            <StyledText
              className={`t--tab-${tab.label}`}
              key={index}
              onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                onTabChange(tab.widgetId);
                event.stopPropagation();
              }}
              selected={props.selectedTabWidgetId === tab.widgetId}
            >
              {tab.label}
            </StyledText>
          ))}
          <StyledTab />
          <ScrollIndicator containerRef={tabContainerRef} mode="LIGHT" />
        </TabsContainer>
      ) : (
        undefined
      )}
      <ChildrenWrapper shouldShowTabs={props.shouldShowTabs}>
        <ScrollableCanvasWrapper
          {...remainingProps}
          className={`${
            props.shouldScrollContents ? getCanvasClassName() : ""
          } ${generateClassName(props.widgetId)}`}
        >
          {props.children}
        </ScrollableCanvasWrapper>
      </ChildrenWrapper>
    </TabsContainerWrapper>
  );
}

export default TabsComponent;
