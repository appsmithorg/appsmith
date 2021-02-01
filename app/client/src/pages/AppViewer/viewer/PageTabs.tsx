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
  border-top: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
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

const StyleTabText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) => getTypographyByKey(props, "h6")}
  color: ${(props) => props.theme.colors.header.tabText};
  border-bottom: 2px solid transparent;
  height: ${(props) => `calc(${props.theme.smallHeaderHeight})`};
  ${PageTab}.is-active & {
    border-color: ${(props) => props.theme.colors.header.activeTabBorderBottom};
  }
  & span {
    max-width: 138px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PageTabName: React.FunctionComponent<{ name: string }> = ({ name }) => {
  const tabNameRef = useRef<HTMLSpanElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);
  const tabNameText = (
    <StyleTabText>
      <span ref={tabNameRef}>{name}</span>
    </StyleTabText>
  );

  useEffect(() => {
    if (isEllipsisActive(tabNameRef?.current)) {
      setEllipsisActive(true);
    }
  }, [tabNameRef]);

  return ellipsisActive ? (
    <TooltipComponent
      maxWidth={400}
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
}: {
  children: React.ReactNode;
  isTabActive: boolean;
  tabsScrollable: boolean;
}) => {
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTabActive) tabContainerRef.current?.scrollIntoView(false);
  }, [isTabActive, tabsScrollable]);

  return <div ref={tabContainerRef}>{children}</div>;
};

type Props = {
  currentApplicationDetails?: ApplicationPayload;
  appPages: PageListPayload;
  measuredTabsRef: (ref: HTMLElement | null) => void;
  tabsScrollable: boolean;
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
