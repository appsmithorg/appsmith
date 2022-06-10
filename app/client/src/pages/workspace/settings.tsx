import React, { useEffect } from "react";
import {
  useRouteMatch,
  useLocation,
  useParams,
  Link,
  Route,
} from "react-router-dom";
import { getCurrentWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { useSelector, useDispatch } from "react-redux";
import { TabComponent, TabProp } from "components/ads/Tabs";
import Text, { TextType } from "components/ads/Text";
import history from "utils/history";
import styled from "styled-components";

import MemberSettings from "./Members";
import { Icon } from "@blueprintjs/core";
import { GeneralSettings } from "./General";
import * as Sentry from "@sentry/react";
import { getAllApplications } from "actions/applicationActions";
import { truncateTextUsingEllipsis } from "constants/DefaultTheme";
import { IconSize } from "components/ads/Icon";
import { useMediaQuery } from "react-responsive";
const SentryRoute = Sentry.withSentryRouting(Route);

const LinkToApplications = styled(Link)`
  margin-top: 30px;
  margin-bottom: 35px;
  display: inline-block;
  width: auto;
  &:hover {
    text-decoration: none;
  }
  svg {
    cursor: pointer;
  }
  ${truncateTextUsingEllipsis}
`;
const SettingsWrapper = styled.div<{
  isMobile?: boolean;
}>`
  width: ${(props) => (props.isMobile ? "345px" : "916px")};
  margin: 0 auto;
`;
export default function Settings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentWorkspace = useSelector(getCurrentWorkspace).filter(
    (el) => el.id === workspaceId,
  )[0];

  const { path } = useRouteMatch();
  const location = useLocation();
  const dispatch = useDispatch();
  useEffect(() => {
    if (!currentWorkspace) {
      dispatch(getAllApplications());
    }
  }, [dispatch, currentWorkspace]);

  const SettingsRenderer = (
    <div>
      <SentryRoute
        component={GeneralSettings}
        location={location}
        path={`${path}/general`}
      />
      <SentryRoute
        component={MemberSettings}
        location={location}
        path={`${path}/members`}
      />
    </div>
  );

  const tabArr: TabProp[] = [
    {
      key: "general",
      title: "General",
      panelComponent: SettingsRenderer,
      icon: "gear",
      iconSize: IconSize.XL,
    },
    {
      key: "members",
      title: "Members",
      panelComponent: SettingsRenderer,
      icon: "user-2",
      iconSize: IconSize.XL,
    },
  ];
  const isMembersPage = location.pathname.indexOf("members") !== -1;
  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  return (
    <SettingsWrapper isMobile={isMobile}>
      <LinkToApplications to={"/applications"}>
        <Icon color="#9F9F9F" icon="chevron-left" />
        <Text className="t--workspace-header" type={TextType.H1}>
          {currentWorkspace && currentWorkspace.name}
        </Text>
      </LinkToApplications>
      <TabComponent
        onSelect={(index: number) => {
          const settingsStartIndex = location.pathname.indexOf("settings");
          const settingsEndIndex = settingsStartIndex + "settings".length;
          const hasSlash = location.pathname[settingsEndIndex] === "/";
          let newUrl = "";

          if (hasSlash) {
            newUrl = `${location.pathname.slice(0, settingsEndIndex)}/${
              tabArr[index].key
            }`;
          } else {
            newUrl = `${location.pathname}/${tabArr[index].key}`;
          }
          history.push(newUrl);
        }}
        selectedIndex={isMembersPage ? 1 : 0}
        tabs={tabArr}
      />
    </SettingsWrapper>
  );
}
