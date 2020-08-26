import React, { useEffect } from "react";

import { saveOrg } from "actions/orgActions";
import { SaveOrgRequest } from "api/OrgApi";
import { throttle } from "lodash";
import TextInput from "components/ads/TextInput";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentOrg } from "selectors/organizationSelectors";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";

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

export function GeneralSettings() {
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
