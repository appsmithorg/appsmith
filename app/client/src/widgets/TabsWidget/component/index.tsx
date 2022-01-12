import React, {
  RefObject,
  ReactNode,
  useEffect,
  useRef,
  useState,
  createRef,
} from "react";
import styled, { css } from "styled-components";
import { Button, MaybeElement } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import { ComponentProps } from "widgets/BaseComponent";
import {
  TabsWidgetProps,
  TabContainerWidgetProps,
  SCROLL_NAV_CONTROL_CONTAINER_WIDTH,
} from "../constants";
import { generateClassName, getCanvasClassName } from "utils/generators";
import ScrollIndicator from "components/ads/ScrollIndicator";
import { ReactComponent as ScrollNavLeftIcon } from "assets/icons/widget/tabs/scroll-nav-left.svg";
import { ReactComponent as ScrollNavRightIcon } from "assets/icons/widget/tabs/scroll-nav-right.svg";

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

const scrollNavControlContainerBaseStyle = css`
  display: flex;
  position: absolute;
  top: 0;
  z-index: 1;
  background: white;
`;

const scrollContents = css`
  overflow-y: auto;
  position: absolute;
`;

const TabsContainerWrapper = styled.div<{
  ref: RefObject<HTMLDivElement>;
}>`
  position: relative;
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
  position: relative;
  height: ${({ shouldShowTabs }) =>
    shouldShowTabs
      ? CHILDREN_WRAPPER_HEIGHT_WITH_TABS
      : CHILDREN_WRAPPER_HEIGHT_WITHOUT_TABS};
  width: 100%;
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
  position: absolute;
  top: 0;
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

  && {
    height: ${TAB_CONTAINER_HEIGHT};
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

const ScrollNavControlLeftContainer = styled.div`
  ${scrollNavControlContainerBaseStyle}
  left: 0;
`;

const ScrollNavControlRightContainer = styled.div`
  ${scrollNavControlContainerBaseStyle}
  right: 0;
`;

const TabsScrollWrapper = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: ${TAB_CONTAINER_HEIGHT};
  background: ${(props) => props.theme.colors.builderBodyBG};
`;

export interface ScrollNavControlProps {
  onClick: () => void;
  icon: IconName | MaybeElement;
  disabled?: boolean;
  className?: string;
}

function ScrollNavControl(props: ScrollNavControlProps) {
  const { className, disabled, icon, onClick } = props;
  return (
    <Button
      className={className}
      disabled={disabled}
      icon={icon}
      minimal
      onClick={onClick}
    />
  );
}

function TabsComponent(props: TabsComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onTabChange, tabs, width, ...remainingProps } = props;
  const tabContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  const tabsRef = useRef<HTMLDivElement>(null);

  const [isScrollable, setIsScrollable] = useState(false);
  const [isMaxScrolled, setIsMaxScrolled] = useState(false);
  const [tabRefs, setTabRefs] = useState<RefObject<HTMLDivElement>[]>([]);
  const [tabScrollIndex, setTabScrollIndex] = useState(0);
  const [offsetLeft, setOffsetLeft] = useState(0);

  useEffect(() => {
    if (!props.shouldScrollContents) {
      tabContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.shouldScrollContents]);

  useEffect(() => {
    setTabRefs(tabs.map(() => createRef()));
  }, [tabs]);

  useEffect(() => {
    if (tabsRef.current) {
      // Check if the current tabs container has scroll
      const scrollWidth = tabsRef.current.scrollWidth;
      const clientWidth = tabsRef.current.clientWidth;

      if (scrollWidth > clientWidth) {
        setIsScrollable(true);
      } else {
        setIsScrollable(false);
      }
    }
  }, [tabs, width]);

  useEffect(() => {
    // Decide right scroll nav visibility
    const tabsWidth = tabRefs.slice(tabScrollIndex).reduce((total, tabRef) => {
      const tabWidth = tabRef.current?.scrollWidth || 0;
      return (total += tabWidth);
    }, 0);
    const visibleElementsWidth =
      tabsWidth +
      (tabScrollIndex === 0 ? 0 : SCROLL_NAV_CONTROL_CONTAINER_WIDTH);

    if (visibleElementsWidth <= width) {
      setIsMaxScrolled(true);
    } else {
      setIsMaxScrolled(false);
    }
  }, [tabRefs, tabScrollIndex, width]);

  useEffect(() => {
    if (tabsRef.current) {
      tabsRef.current.style.left = `${offsetLeft}px`;
    }
  }, [offsetLeft]);

  const handleScrollLeft = () => {
    const scrollSize = tabRefs[tabScrollIndex - 1].current?.scrollWidth || 0;

    setOffsetLeft((prev) => (tabScrollIndex === 1 ? 0 : prev + scrollSize));
    setTabScrollIndex((prev) => prev - 1);
  };

  const handleScrollRight = () => {
    const scrollSize = tabRefs[tabScrollIndex].current?.scrollWidth || 0;

    setOffsetLeft((prev) =>
      tabScrollIndex === 0
        ? prev - scrollSize + SCROLL_NAV_CONTROL_CONTAINER_WIDTH
        : prev - scrollSize,
    );
    setTabScrollIndex((prev) => prev + 1);
  };

  return (
    <TabsContainerWrapper ref={tabContainerRef}>
      {props.shouldShowTabs ? (
        <TabsScrollWrapper>
          {!!tabScrollIndex && (
            <ScrollNavControlLeftContainer>
              <ScrollNavControl
                className="scroll-nav-left-button"
                icon={<ScrollNavLeftIcon />}
                onClick={handleScrollLeft}
              />
            </ScrollNavControlLeftContainer>
          )}
          <TabsContainer isScrollable={isScrollable} ref={tabsRef}>
            {props.tabs.map((tab, index) => (
              <StyledText
                className={`t--tab-${tab.label}`}
                key={index}
                onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                  onTabChange(tab.widgetId);
                  event.stopPropagation();
                }}
                ref={tabRefs[index]}
                selected={props.selectedTabWidgetId === tab.widgetId}
              >
                {tab.label}
              </StyledText>
            ))}
            <StyledTab />
            <ScrollIndicator containerRef={tabContainerRef} mode="LIGHT" />
          </TabsContainer>
          {!isMaxScrolled && (
            <ScrollNavControlRightContainer>
              <ScrollNavControl
                className="scroll-nav-right-button"
                icon={<ScrollNavRightIcon />}
                onClick={handleScrollRight}
              />
            </ScrollNavControlRightContainer>
          )}
        </TabsScrollWrapper>
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
