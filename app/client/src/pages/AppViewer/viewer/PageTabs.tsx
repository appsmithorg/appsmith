import React, { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  ApplicationPayload,
  PageListPayload,
} from "constants/ReduxActionConstants";
import { getApplicationViewerPageURL } from "constants/routes";
import { isEllipsisActive } from "utils/helpers";
import TooltipComponent from "components/ads/Tooltip";
import { getTypographyByKey, hideScrollbar } from "constants/DefaultTheme";
import { Position } from "@blueprintjs/core";

const TabsContainer = styled.div`
  width: 100%;
  display: flex;
  overflow: auto;
  ${hideScrollbar}
`;

const PageTab = styled(NavLink)`
  display: flex;
  max-width: 170px;
  align-self: flex-end;
  cursor: pointer;
  text-decoration: none;
  padding: 0px ${(props) => props.theme.spaces[7]}px;
  &:hover {
    text-decoration: none;
  }
`;

const StyledBottomBorder = styled.div`
  position: relative;
  transition: all 0.3s ease-in-out;
  height: 2px;
  width: 100%;
  left: -100%;
  background-color: ${(props) =>
    props.theme.colors.header.activeTabBorderBottom};
  ${PageTab}:hover & {
    position: relative;
    width: 100%;
    left: 0;
  }
`;

const StyleTabText = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${(props) => getTypographyByKey(props, "h6")}
  color: ${(props) => props.theme.colors.header.tabText};
  height: ${(props) => `calc(${props.theme.smallHeaderHeight})`};
  & span {
    max-width: 138px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  ${PageTab}.is-active & {
    color: ${(props) => props.theme.colors.header.activeTabText};
    ${StyledBottomBorder} {
      left: 0;
    }
  }
`;

const CenterTabNameContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PageTabName: React.FunctionComponent<{ name: string }> = ({ name }) => {
  const tabNameRef = useRef<HTMLSpanElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);
  const tabNameText = (
    <StyleTabText>
      <CenterTabNameContainer>
        <span ref={tabNameRef}>{name}</span>
      </CenterTabNameContainer>
      <StyledBottomBorder />
    </StyleTabText>
  );

  useEffect(() => {
    if (isEllipsisActive(tabNameRef?.current)) {
      setEllipsisActive(true);
    }
  }, [tabNameRef]);

  return ellipsisActive ? (
    <TooltipComponent
      maxWidth="400px"
      content={name}
      position={Position.BOTTOM}
      boundary="viewport"
    >
      {tabNameText}
    </TooltipComponent>
  ) : (
    tabNameText
  );
};

const PageTabContainer = ({
  children,
  isTabActive,
  tabsScrollable,
  setShowScrollArrows,
}: {
  children: React.ReactNode;
  isTabActive: boolean;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
}) => {
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTabActive) {
      tabContainerRef.current?.scrollIntoView(false);
      setShowScrollArrows();
    }
  }, [isTabActive, tabsScrollable]);

  return <div ref={tabContainerRef}>{children}</div>;
};

type Props = {
  currentApplicationDetails?: ApplicationPayload;
  appPages: PageListPayload;
  measuredTabsRef: (ref: HTMLElement | null) => void;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
};

export const PageTabs = (props: Props) => {
  const { currentApplicationDetails, appPages } = props;
  const { pathname } = useLocation();

  return (
    <TabsContainer ref={props.measuredTabsRef}>
      {appPages.map((page) => (
        <PageTabContainer
          key={page.pageId}
          isTabActive={
            pathname ===
            getApplicationViewerPageURL(
              currentApplicationDetails?.id,
              page.pageId,
            )
          }
          tabsScrollable={props.tabsScrollable}
          setShowScrollArrows={props.setShowScrollArrows}
        >
          <PageTab
            to={getApplicationViewerPageURL(
              currentApplicationDetails?.id,
              page.pageId,
            )}
            activeClassName="is-active"
            className="t--page-switch-tab"
          >
            <PageTabName name={page.pageName} />
          </PageTab>
        </PageTabContainer>
      ))}
    </TabsContainer>
  );
};

export default PageTabs;
