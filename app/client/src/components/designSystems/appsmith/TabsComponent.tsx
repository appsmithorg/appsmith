import React, { RefObject, ReactNode, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { ComponentProps } from "./BaseComponent";
import { TabsWidgetProps, TabContainerWidgetProps } from "widgets/TabsWidget";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { getBorderCSSShorthand } from "constants/DefaultTheme";
import ScrollIndicator from "components/ads/ScrollIndicator";

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
}

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
  border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
`;

const ChildrenWrapper = styled.div`
  height: 100%;
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
    height: 40px;
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

const TabsComponent = (props: TabsComponentProps) => {
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
    <TabsContainerWrapper ref={tabContainerRef}>
      {props.shouldShowTabs ? (
        <TabsContainer ref={tabsRef}>
          {props.tabs.map((tab, index) => (
            <StyledText
              className={`t--tab-${tab.label}`}
              onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                onTabChange(tab.widgetId);
                event.stopPropagation();
              }}
              selected={props.selectedTabWidgetId === tab.widgetId}
              key={index}
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
      <ChildrenWrapper>
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
};

export default TabsComponent;
