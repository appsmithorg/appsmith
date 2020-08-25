import React, { useEffect } from "react";
import {
  Switch,
  useRouteMatch,
  useLocation,
  useParams,
  Link,
} from "react-router-dom";
import AppRoute from "pages/common/AppRoute";
import { getCurrentOrg } from "selectors/organizationSelectors";
import { useSelector, useDispatch } from "react-redux";
import { AdsTabComponent, TabProp } from "components/ads/Tabs";
import Text, { TextType } from "components/ads/Text";
import history from "utils/history";
import TextInput from "components/ads/TextInput";
import styled from "styled-components";
import { saveOrg, fetchOrg } from "actions/orgActions";
import { SaveOrgRequest } from "api/OrgApi";
import { throttle } from "lodash";
import MemberSettings from "./Members";
import IconComponent from "components/designSystems/appsmith/IconComponent";
import { Org } from "constants/orgConstants";

const InputLabelWrapper = styled.div`
  width: 200px;
  display: flex;
  align-items: center;
`;

const SettingWrapper = styled.div`
  width: 520px;
  display: flex;
  margin-bottom: 25px;
`;

export const SettingsHeading = styled(Text)`
  color: white;
  display: inline-block;
  margin-top: 25px;
  margin-bottom: 32px;
`;

function GeneralSettings() {
  const { orgId } = useParams();
  const dispatch = useDispatch();
  const currentOrg = useSelector(getCurrentOrg);
  function saveChanges(settings: SaveOrgRequest) {
    dispatch(saveOrg(settings));
  }

  const throttleTimeout = 1000;

  const onWorkspaceNameChange = throttle((newName: string) => {
    saveChanges({
      id: orgId as string,
      name: newName,
    });
  }, throttleTimeout);

  const onWebsiteChange = throttle((newWebsite: string) => {
    saveChanges({
      id: orgId as string,
      website: newWebsite,
    });
  }, throttleTimeout);

  const onEmailChange = throttle((newEmail: string) => {
    saveChanges({
      id: orgId as string,
      email: newEmail,
    });
  }, throttleTimeout);

  return (
    <>
      <SettingsHeading type={TextType.H2}>General</SettingsHeading>
      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Workspace</Text>
        </InputLabelWrapper>
        <TextInput
          placeholder="Workspace name"
          onChange={onWorkspaceNameChange}
          defaultValue={currentOrg.name}
        ></TextInput>
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Website</Text>
        </InputLabelWrapper>
        <TextInput
          placeholder="Your website"
          onChange={onWebsiteChange}
          defaultValue={currentOrg.website || ""}
        ></TextInput>
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </InputLabelWrapper>
        <TextInput
          placeholder="Email"
          onChange={onEmailChange}
          defaultValue={currentOrg.email || ""}
        ></TextInput>
      </SettingWrapper>
    </>
  );
}

const LinkToApplications = styled(Link)`
  margin-bottom: 35px;
  width: auto;
  &:hover {
    text-decoration: none;
  }
  svg {
    cursor: pointer;
  }
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
    <>
      <LinkToApplications to={"/applications"}>
        <IconComponent iconName="chevron-left" color="#9F9F9F"></IconComponent>
        <Text type={TextType.H1}>{currentOrg.name}</Text>
      </LinkToApplications>
      <AdsTabComponent
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
      ></AdsTabComponent>
    </>
  );
}
