import React from "react";

import { saveOrg } from "actions/orgActions";
import { SaveOrgRequest } from "api/OrgApi";
import { throttle } from "lodash";
import TextInput, {
  emailValidator,
  notEmptyValidator,
} from "components/ads/TextInput";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentOrg } from "selectors/organizationSelectors";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "@blueprintjs/core";
import { getOrgLoadingStates } from "selectors/organizationSelectors";
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
  color: ${props => props.theme.colors.settingHeading};
  display: inline-block;
  margin-top: 25px;
  margin-bottom: 32px;
`;

const Loader = styled.div`
  height: 38px;
  width: 260px;
  border-radius: 0;
`;

export function GeneralSettings() {
  const { orgId } = useParams<{ orgId: string }>();
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

  const { isFetchingOrg } = useSelector(getOrgLoadingStates);

  return (
    <>
      <SettingsHeading type={TextType.H2}>General</SettingsHeading>
      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Workspace</Text>
        </InputLabelWrapper>
        {isFetchingOrg && <Loader className={Classes.SKELETON}></Loader>}
        {!isFetchingOrg && (
          <TextInput
            validator={notEmptyValidator}
            placeholder="Workspace name"
            onChange={onWorkspaceNameChange}
            defaultValue={currentOrg.name}
            cypressSelector="t--org-name-input"
          ></TextInput>
        )}
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Website</Text>
        </InputLabelWrapper>
        {isFetchingOrg && <Loader className={Classes.SKELETON}></Loader>}
        {!isFetchingOrg && (
          <TextInput
            placeholder="Your website"
            onChange={onWebsiteChange}
            defaultValue={currentOrg.website || ""}
            cypressSelector="t--org-website-input"
          ></TextInput>
        )}
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </InputLabelWrapper>
        {isFetchingOrg && <Loader className={Classes.SKELETON}></Loader>}
        {!isFetchingOrg && (
          <TextInput
            validator={emailValidator}
            placeholder="Email"
            onChange={onEmailChange}
            defaultValue={currentOrg.email || ""}
            cypressSelector="t--org-email-input"
          ></TextInput>
        )}
      </SettingWrapper>
    </>
  );
}
