import React, { RefObject, ReactNode, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { ComponentProps } from "./BaseComponent";
import { TabsWidgetProps, TabContainerWidgetProps } from "widgets/TabsWidget";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { scrollbarLight } from "constants/DefaultTheme";

interface TabsComponentProps extends ComponentProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  selectedTabId: string;
  shouldShowTabs: boolean;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
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
`;

const ChildrenWrapper = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
  border: 1px solid;
  border-top: none;
  border-color: ${props => props.theme.colors.bodyBG};
  background: ${props => props.theme.colors.builderBodyBG};
`;

const ScrollableCanvasWrapper = styled.div<
  TabsWidgetProps<TabContainerWidgetProps> & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  ${props => (props.shouldScrollContents ? scrollContents : "")}
`;

const TabsContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  ${scrollbarLight};
  background: ${props => props.theme.colors.builderBodyBG};
  && {
    height: 38px;
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
  border-bottom: 1px solid;
  border-color: ${props => props.theme.colors.bodyBG};
  width: 100%;
`;

const StyledText = styled.div<TabProps>`
  white-space: nowrap;
  background: ${props => props.theme.colors.builderBodyBG};
  color: ${props => props.theme.colors.menuIconColorInactive};
  font-size: ${props => props.theme.fontSizes[3]}px;
  line-height: 32px;
  height: 32px;
  padding: 0 16px;
  cursor: pointer;
  box-shadow: ${props => (props.selected ? props.theme.shadows[2] : "")};
  border-bottom: ${props => (props.selected ? "none" : "1px solid")};
  border-color: ${props => props.theme.colors.bodyBG};
  &:hover {
    background: ${props =>
      props.selected
        ? props.theme.colors.textOnDarkBG
        : props.theme.colors.hover};
    box-shadow: ${props => (props.selected ? "" : props.theme.shadows[3])};
  }
`;

const TabsComponent = (props: TabsComponentProps) => {
  const tabContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  useEffect(() => {
    if (!props.shouldScrollContents) {
      tabContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.shouldScrollContents]);
  return (
    <TabsContainerWrapper ref={tabContainerRef}>
      {props.shouldShowTabs ? (
        <TabsContainer>
          {props.tabs &&
            props.tabs.map((tab, index) => (
              <StyledText
                onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                  props.onTabChange(tab.id);
                  event.stopPropagation();
                }}
                selected={props.selectedTabId === tab.id}
                key={index}
              >
                {tab.label}
              </StyledText>
            ))}
          <StyledTab></StyledTab>
        </TabsContainer>
      ) : (
        undefined
      )}
      <ChildrenWrapper>
        <ScrollableCanvasWrapper
          {...props}
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
