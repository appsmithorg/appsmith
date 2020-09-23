import React, { useEffect } from "react";
import { useRouteMatch, useLocation, useParams, Link } from "react-router-dom";
import AppRoute from "pages/common/AppRoute";
import { getCurrentOrg } from "selectors/organizationSelectors";
import { useSelector, useDispatch } from "react-redux";
import { TabComponent, TabProp } from "components/ads/Tabs";
import Text, { TextType } from "components/ads/Text";
import history from "utils/history";
import styled from "styled-components";

import MemberSettings from "./Members";
import IconComponent from "components/designSystems/appsmith/IconComponent";
import { fetchOrg } from "actions/orgActions";
import { GeneralSettings } from "./General";

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
`;
const SettingsWrapper = styled.div`
  width: ${props => props.theme.pageContentWidth}px;
  margin: 0 auto;
`;
export default function Settings() {
  const { orgId } = useParams();
  const currentOrg = useSelector(getCurrentOrg);
  const { path } = useRouteMatch();
  const location = useLocation();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchOrg(orgId as string));
  }, []);

  const SettingsRenderer = (
    <div>
      <AppRoute
        path={`${path}/general`}
        component={GeneralSettings}
        location={location}
        name={"Settings"}
      />
      <AppRoute
        path={`${path}/members`}
        component={MemberSettings}
        location={location}
        name={"Settings"}
      />
    </div>
  );

  const tabArr: TabProp[] = [
    {
      key: "general",
      title: "General",
      panelComponent: SettingsRenderer,
      icon: "general",
    },
    {
      key: "members",
      title: "Members",
      panelComponent: SettingsRenderer,
      icon: "user",
    },
  ];
  const isMembersPage = location.pathname.indexOf("members") !== -1;

  return (
    <SettingsWrapper>
      <LinkToApplications to={"/applications"}>
        <IconComponent iconName="chevron-left" color="#9F9F9F"></IconComponent>
        <Text type={TextType.H1}>{currentOrg.name}</Text>
      </LinkToApplications>
      <TabComponent
        tabs={tabArr}
        selectedIndex={isMembersPage ? 1 : 0}
        onSelect={(index: number) => {
          const settingsStartIndex = location.pathname.indexOf("settings");
          const settingsEndIndex = settingsStartIndex + "settings".length;
          const hasSlash = location.pathname[settingsEndIndex] === "/";
          let newUrl = "";

          if (hasSlash) {
            newUrl = `${location.pathname.substr(0, settingsEndIndex)}/${
              tabArr[index].key
            }`;
          } else {
            newUrl = `${location.pathname}/${tabArr[index].key}`;
          }
          history.push(newUrl);
        }}
      ></TabComponent>
    </SettingsWrapper>
  );
}
