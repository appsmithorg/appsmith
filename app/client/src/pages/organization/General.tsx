import React from "react";

import { saveOrg } from "actions/orgActions";
import { SaveOrgRequest } from "api/OrgApi";
import { debounce } from "lodash";
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
import { getIsFetchingApplications } from "selectors/applicationSelectors";

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
  const currentOrg = useSelector(getCurrentOrg).filter(
    el => el.id === orgId,
  )[0];
  function saveChanges(settings: SaveOrgRequest) {
    dispatch(saveOrg(settings));
  }

  const timeout = 1000;

  const onWorkspaceNameChange = debounce((newName: string) => {
    saveChanges({
      id: orgId as string,
      name: newName,
    });
  }, timeout);

  const onWebsiteChange = debounce((newWebsite: string) => {
    saveChanges({
      id: orgId as string,
      website: newWebsite,
    });
  }, timeout);

  const onEmailChange = debounce((newEmail: string) => {
    saveChanges({
      id: orgId as string,
      email: newEmail,
    });
  }, timeout);

  const isFetchingApplications = useSelector(getIsFetchingApplications);

  return (
    <>
      <SettingsHeading type={TextType.H2}>General</SettingsHeading>
      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Organization Name</Text>
        </InputLabelWrapper>
        {isFetchingApplications && (
          <Loader className={Classes.SKELETON}></Loader>
        )}
        {!isFetchingApplications && (
          <TextInput
            validator={notEmptyValidator}
            placeholder="Organization Name"
            onChange={onWorkspaceNameChange}
            defaultValue={currentOrg && currentOrg.name}
            cypressSelector="t--org-name-input"
          ></TextInput>
        )}
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Website</Text>
        </InputLabelWrapper>
        {isFetchingApplications && (
          <Loader className={Classes.SKELETON}></Loader>
        )}
        {!isFetchingApplications && (
          <TextInput
            placeholder="Your website"
            onChange={onWebsiteChange}
            defaultValue={(currentOrg && currentOrg.website) || ""}
            cypressSelector="t--org-website-input"
          ></TextInput>
        )}
      </SettingWrapper>

      <SettingWrapper>
        <InputLabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </InputLabelWrapper>
        {isFetchingApplications && (
          <Loader className={Classes.SKELETON}></Loader>
        )}
        {!isFetchingApplications && (
          <TextInput
            validator={emailValidator}
            placeholder="Email"
            onChange={onEmailChange}
            defaultValue={(currentOrg && currentOrg.email) || ""}
            cypressSelector="t--org-email-input"
          ></TextInput>
        )}
      </SettingWrapper>
    </>
  );
}
