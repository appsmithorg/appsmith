import React from "react";
import { Title, Space } from "../StyledComponents";
import {
  SELECT_SSH_KEY,
  createMessage,
  USER_PROFILE_SETTINGS_TITLE,
  AUTHOR_NAME,
  AUTHOR_EMAIL,
} from "constants/messages";
import OptionSelector from "../OptionSelector";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import TextInput from "components/ads/TextInput";
import { AUTH_TYPE, Classes as GitSyncClasses } from "../../constants";
import { USER_NAME, USER_PASSWORD } from "../../../../../constants/messages";
import Dropdown from "components/ads/Dropdown";
import Text, { TextType } from "../../../../../components/ads/Text";

// Mock Data
const HTTPS_PROFILE_OPTIONS = [{ label: "PROFILE 1" }, { label: "PROFILE 2" }];

const SSH_PROFILE_OPTION = [{ label: "PROFILE 1" }, { label: "PROFILE 2" }];

//
const LabelContainer = styled.div`
  ${(props) => getTypographyByKey(props, "h6")};
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const InputContainer = styled.div`
  width: 70%;
  display: flex;
  align-items: center;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;

  .${GitSyncClasses.OPTION_SELECTOR_WRAPPER} {
    display: flex;
    align-items: center;
    padding-top: 5px;
  }
`;

const OptionWrapper = styled.div<{
  selected: boolean;
}>`
  padding: ${(props) => props.theme.spaces[2] + 1}px
    ${(props) => props.theme.spaces[5]}px;
  cursor: pointer;
  display: flex;
  align-items: center;

  background-color: ${(props) =>
    props.selected ? props.theme.colors.propertyPane.dropdownSelectBg : null};
`;

//  Child component
type AuthConfigProps = {
  authType: string;
};

function AuthConfig({ authType }: AuthConfigProps) {
  switch (authType) {
    case AUTH_TYPE.SSH:
      return (
        <>
          <LabelContainer>
            <span className="label">{createMessage(SELECT_SSH_KEY)}</span>
          </LabelContainer>
          <InputContainer>
            <Dropdown
              disabled={SSH_PROFILE_OPTION.length === 0}
              onSelect={() => {
                //
              }}
              // optionWidth="100%"
              options={SSH_PROFILE_OPTION}
              renderOption={({
                isSelectedNode,
                option,
                optionClickHandler,
              }) => (
                <OptionWrapper
                  onClick={() =>
                    optionClickHandler && optionClickHandler(option)
                  }
                  selected={!!isSelectedNode}
                >
                  <Text type={TextType.P1}>{option.label}</Text>
                </OptionWrapper>
              )}
              selected={{}}
              showLabelOnly
              width="100%"
            />
          </InputContainer>
        </>
      );
    case AUTH_TYPE.HTTPS:
      return (
        <>
          <LabelContainer>
            <span className="label">{createMessage(USER_NAME)}</span>
          </LabelContainer>
          <InputContainer>
            <TextInput fill />
          </InputContainer>

          <Space size={7} />

          <LabelContainer>
            <span className="label">{createMessage(USER_PASSWORD)}</span>
          </LabelContainer>
          <InputContainer>
            <TextInput fill />
          </InputContainer>
        </>
      );
    default:
      return null;
  }
}

// Component
type UserGitProfileSettingsProps = {
  authType: string;
};

function UserGitProfileSettings({ authType }: UserGitProfileSettingsProps) {
  return (
    <>
      <TitleWrapper>
        <Title>{createMessage(USER_PROFILE_SETTINGS_TITLE)}</Title>
        {authType === AUTH_TYPE.HTTPS ? (
          <OptionSelector
            options={HTTPS_PROFILE_OPTIONS}
            selected={HTTPS_PROFILE_OPTIONS[0]}
          />
        ) : null}
      </TitleWrapper>

      <Space size={7} />

      <AuthConfig authType={authType} />

      <Space size={7} />

      <LabelContainer>
        <span className="label">{createMessage(AUTHOR_NAME)}</span>
      </LabelContainer>
      <InputContainer>
        <TextInput fill />
      </InputContainer>

      <Space size={7} />

      <LabelContainer>
        <span className="label">{createMessage(AUTHOR_EMAIL)}</span>
      </LabelContainer>
      <InputContainer>
        <TextInput fill />
      </InputContainer>
    </>
  );
}

export default UserGitProfileSettings;
