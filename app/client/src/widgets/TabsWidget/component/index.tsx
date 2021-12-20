import styled, { css } from "styled-components";
import React, { RefObject, ReactNode, useEffect, useRef } from "react";

import { Colors } from "constants/Colors";
import { lightenColor } from "widgets/WidgetUtils";
import { ComponentProps } from "widgets/BaseComponent";
import ScrollIndicator from "components/ads/ScrollIndicator";
import { TabsWidgetProps, TabContainerWidgetProps } from "../constants";
import { generateClassName, getCanvasClassName } from "utils/generators";

interface TabsComponentProps extends ComponentProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  selectedTabWidgetId: string;
  shouldShowTabs: boolean;
  borderRadius: string;
  boxShadow?: string;

  primaryColor: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    widgetId: string;
    isVisible?: boolean;
  }>;
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
  borderRadius: string;
  boxShadow?: string;
}>`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  border: ${({ boxShadow }) =>
    boxShadow === "none"
      ? `1px solid ${Colors.GEYSER_LIGHT}`
      : `1px solid transparent`};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  overflow: hidden;
  background: white;
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

const TabsContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  background: ${(props) => props.theme.colors.builderBodyBG};
  overflow: hidden;
  && {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }
`;

type TabProps = {
  selected?: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  primaryColor: string;
};

const StyledTab = styled.div`
  height: 32px;
  border-bottom: 1px solid ${(props) => props.theme.colors.bodyBG};
  border-color: ${(props) => props.theme.colors.bodyBG};
  width: 100%;
  position: absolute;
  border-bottom: ${(props) => `1px solid ${props.theme.colors.bodyBG}`};
`;

const StyledText = styled.div<TabProps>`
  white-space: nowrap;
  background: ${Colors.WHITE};
  color: ${(props) => props.theme.colors.menuIconColorInactive};
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  line-height: 32px;
  height: 32px;
  padding: 0 16px;
  border-bottom: ${(props) =>
    props.selected
      ? `3px solid ${props.primaryColor}`
      : `1px solid ${props.theme.colors.bodyBG}`};
  cursor: pointer;
  position: relative;
  z-index: 1;
  &:hover {
    background: ${(props) =>
      props.selected ? Colors.WHITE : lightenColor(props.primaryColor)};

    border-bottom: ${(props) =>
      props.selected
        ? `3px solid ${props.primaryColor}`
        : `1px solid ${lightenColor(props.primaryColor)}`};
  }
`;

function TabsComponent(props: TabsComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onTabChange, ...remainingProps } = props;
  const tabContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.shouldScrollContents) {
      tabContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.shouldScrollContents]);

  return (
    <TabsContainerWrapper
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      ref={tabContainerRef}
    >
      {props.shouldShowTabs ? (
        <TabsContainer ref={tabsRef}>
          {props.tabs.map((tab, index) => (
            <StyledText
              className={`t--tab-${tab.label}`}
              key={index}
              onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                onTabChange(tab.widgetId);
                event.stopPropagation();
              }}
              primaryColor={props.primaryColor}
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
