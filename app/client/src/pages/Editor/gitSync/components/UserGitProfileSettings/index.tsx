import React from "react";
import { Space } from "../StyledComponents";
import {
  createMessage,
  USER_PROFILE_SETTINGS_TITLE,
  AUTHOR_NAME,
  AUTHOR_EMAIL,
} from "constants/messages";
import styled from "styled-components";
import TextInput, { emailValidator } from "components/ads/TextInput";
import { Classes as GitSyncClasses } from "../../constants";
import Checkbox from "components/ads/Checkbox";
import { GIT_PROFILE_ROUTE } from "constants/routes";
import history from "utils/history";
import { Colors } from "constants/Colors";
import { ReactComponent as RightArrow } from "assets/icons/ads/arrow-right-line.svg";

const LabelContainer = styled.div`
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

const MainContainer = styled.div`
  width: calc(100% - 30px);
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 2px;
  margin-left: ${(props) => props.theme.spaces[6]}px;
  cursor: pointer;
  .edit-config-link {
    font-size: 12px;
    display: flex;
    color: ${Colors.GRAY};
  }
`;

const IconWrapper = styled.div`
  margin-left: 2px;
`;

const DefaultConfigContainer = styled.div`
  display: flex;
  align-items: flex-start;
  margin-top: ${(props) => props.theme.spaces[2]}px;
`;

type AuthorInfo = { authorName: string; authorEmail: string };

const AUTHOR_INFO_LABEL = {
  EMAIL: "authorEmail",
  NAME: "authorName",
};

// Component
type UserGitProfileSettingsProps = {
  authType: string;
  authorInfo: AuthorInfo;
  setAuthorInfo: (authorInfo: AuthorInfo) => void;
  useGlobalConfig: boolean;
  toggleUseDefaultConfig: (useDefaultConfig: boolean) => void;
  isLocalConfigDefined: boolean;
  isGlobalConfigDefined: boolean;
};

const goToGitProfile = () => {
  history.push(GIT_PROFILE_ROUTE);
};

function UserGitProfileSettings({
  authorInfo,
  isGlobalConfigDefined,
  isLocalConfigDefined,
  setAuthorInfo,
  toggleUseDefaultConfig,
  useGlobalConfig,
}: UserGitProfileSettingsProps) {
  const setAuthorState = (label: string, value: string) => {
    switch (label) {
      case AUTHOR_INFO_LABEL.NAME:
        setAuthorInfo({
          authorEmail: authorInfo.authorEmail,
          authorName: value,
        });
        break;
      case AUTHOR_INFO_LABEL.EMAIL:
        setAuthorInfo({
          authorEmail: value,
          authorName: authorInfo.authorName,
        });
        break;
      default:
        break;
    }
  };

  const disableInput = isGlobalConfigDefined && useGlobalConfig;

  return (
    <MainContainer>
      <TitleWrapper>
        <span className="label">
          {createMessage(USER_PROFILE_SETTINGS_TITLE)}
        </span>
      </TitleWrapper>
      {!isLocalConfigDefined && isGlobalConfigDefined ? (
        <DefaultConfigContainer>
          <Checkbox
            fill={false}
            isDefaultChecked={useGlobalConfig}
            label="Use Default Configuration"
            onCheckChange={toggleUseDefaultConfig}
          />
          <ButtonWrapper onClick={goToGitProfile}>
            <span className="edit-config-link">EDIT</span>
            <IconWrapper>
              <RightArrow width={14} />
            </IconWrapper>
          </ButtonWrapper>
        </DefaultConfigContainer>
      ) : null}

      <Space size={7} />

      <>
        <LabelContainer>
          <span className="label">{createMessage(AUTHOR_NAME)}</span>
        </LabelContainer>

        <InputContainer>
          <TextInput
            dataType="text"
            defaultValue={authorInfo.authorName}
            disabled={disableInput}
            fill
            onChange={(value) => setAuthorState(AUTHOR_INFO_LABEL.NAME, value)}
          />
        </InputContainer>

        <Space size={7} />

        <LabelContainer>
          <span className="label">{createMessage(AUTHOR_EMAIL)}</span>
        </LabelContainer>
        <InputContainer>
          <TextInput
            dataType="email"
            defaultValue={authorInfo.authorEmail}
            disabled={disableInput}
            fill
            onChange={(value) => setAuthorState(AUTHOR_INFO_LABEL.EMAIL, value)}
            validator={emailValidator}
          />
        </InputContainer>
      </>
    </MainContainer>
  );
}

export default UserGitProfileSettings;
