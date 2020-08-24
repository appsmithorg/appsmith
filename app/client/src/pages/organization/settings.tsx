import React, { useEffect } from "react";
import {
  Switch,
  useRouteMatch,
  useLocation,
  useParams,
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
import { SaveOrgRequest } from "@appsmith/api/OrgApi";
import { throttle } from "lodash";
import MemberSettings from "./Members";

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

const Heading = styled(Text)`
  color: white;
  display: inline-block;
  margin-top: 25px;
  margin-bottom: 32px;
`;

function GeneralSettings() {
  const { orgId } = useParams();
  const dispatch = useDispatch();
  function saveChanges(settings: SaveOrgRequest) {
    dispatch(saveOrg(settings));
  }

  const throttleTimeout = 1000;

  const onWorkspaceNameChange = throttle((newName: string) => {
    // saveChanges({
    //   id: orgId as string,
    //   name: newName,
    //   website: "asd.com",
    // });
  }, throttleTimeout);

  const onWebsiteChange = throttle((newWebsite: string) => {
    // saveChanges({
    //   id: orgId as string,
    //   name: "abcd",
    //   website: newWebsite,
    // });
  }, throttleTimeout);

  return (
    <>
      <Heading type={TextType.H2}>General</Heading>
      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Workspace</Text>
        </InputLabelWrapper>
        <TextInput
          placeholder="Workspace name"
          onChange={onWorkspaceNameChange}
        ></TextInput>
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Website</Text>
        </InputLabelWrapper>
        <TextInput
          placeholder="Your website"
          onChange={onWebsiteChange}
        ></TextInput>
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </InputLabelWrapper>
        <TextInput placeholder="Email"></TextInput>
      </SettingWrapper>
    </>
  );
}

// function MembersSettings() {
//     return <>
//         <Heading type={TextType.H2}>Manage Users</Heading>
//         {/* <Table></Table> */}
//     </>
// }

//TODO: Remove before commit.
const SettingsWrapper = styled.div`
  color: white;
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
      <Text type={TextType.H1}>{currentOrg.name}</Text>
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
    </SettingsWrapper>
  );
}
