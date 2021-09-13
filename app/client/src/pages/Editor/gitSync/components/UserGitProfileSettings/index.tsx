import React from "react";
import { Space } from "../StyledComponents";
import {
  createMessage,
  USER_PROFILE_SETTINGS_TITLE,
  AUTHOR_NAME,
  AUTHOR_EMAIL,
} from "constants/messages";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import TextInput from "components/ads/TextInput";
import { Classes as GitSyncClasses } from "../../constants";

const LabelContainer = styled.div`
  ${(props) => getTypographyByKey(props, "h6")};
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const InputContainer = styled.div`
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

// Component
type UserGitProfileSettingsProps = {
  authType: string;
};

function UserGitProfileSettings({}: UserGitProfileSettingsProps) {
  const isValidRemoteURL = true;
  return (
    <>
      <TitleWrapper>
        <span className="label">
          {createMessage(USER_PROFILE_SETTINGS_TITLE)}
        </span>
      </TitleWrapper>

      <Space size={7} />
      {isValidRemoteURL ? (
        <>
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
      ) : null}
    </>
  );
}

export default UserGitProfileSettings;
