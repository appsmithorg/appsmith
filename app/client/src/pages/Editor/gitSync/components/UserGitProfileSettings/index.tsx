import React, { useCallback, useState, useMemo } from "react";
import { Space } from "../StyledComponents";
import {
  createMessage,
  USER_PROFILE_SETTINGS_TITLE,
  AUTHOR_NAME,
  AUTHOR_EMAIL,
} from "constants/messages";
import styled from "styled-components";
import TextInput, {
  emailValidator,
  notEmptyValidator,
} from "components/ads/TextInput";
import { Classes as GitSyncClasses } from "../../constants";
import Checkbox from "components/ads/Checkbox";
import { GIT_PROFILE_ROUTE } from "constants/routes";
import history from "utils/history";
import { Colors } from "constants/Colors";
import { ReactComponent as RightArrow } from "assets/icons/ads/arrow-right-line.svg";
import { useSelector } from "react-redux";
import {
  getIsFetchingGlobalGitConfig,
  getIsFetchingLocalGitConfig,
} from "selectors/gitSyncSelectors";

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

type SetAuthorInfo = (authorInfo: AuthorInfo) => void;

const setAuthorState = ({
  authorInfo,
  label,
  setAuthorInfo,
  value,
}: {
  authorInfo: AuthorInfo;
  label: string;
  value: string;
  setAuthorInfo: SetAuthorInfo;
}) => {
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

// Component
type UserGitProfileSettingsProps = {
  authType: string;
  authorInfo: AuthorInfo;
  setAuthorInfo: SetAuthorInfo;
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
  //
  const [emailInputFocused, setEmailInputFocused] = useState(false);
  const [nameInputFocused, setNameInputFocused] = useState(false);
  const isFetchingGlobalGitConfig = useSelector(getIsFetchingGlobalGitConfig);
  const isFetchingLocalGitConfig = useSelector(getIsFetchingLocalGitConfig);

  const changeHandler = useCallback(
    (label: string, value: string) =>
      setAuthorState({
        label,
        value,
        authorInfo,
        setAuthorInfo,
      }),
    [authorInfo, setAuthorInfo],
  );

  const disableInput = isGlobalConfigDefined && useGlobalConfig;

  const isValidEmail = useMemo(
    () =>
      authorInfo.authorEmail && emailValidator(authorInfo.authorEmail).isValid,
    [authorInfo.authorEmail],
  );

  const isFetchingConfig =
    isFetchingGlobalGitConfig || isFetchingLocalGitConfig;

  const showDefaultConfig =
    !isFetchingConfig && !isLocalConfigDefined && isGlobalConfigDefined;

  return (
    <MainContainer>
      <TitleWrapper>
        <span className="label">
          {createMessage(USER_PROFILE_SETTINGS_TITLE)}
        </span>
      </TitleWrapper>
      {showDefaultConfig ? (
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
            errorMsg={
              !authorInfo.authorName && !nameInputFocused
                ? "Author name cannot be empty"
                : ""
            }
            fill
            isLoading={isFetchingConfig}
            onBlur={() => setNameInputFocused(false)}
            onChange={(value) => changeHandler(AUTHOR_INFO_LABEL.NAME, value)}
            onFocus={() => setNameInputFocused(true)}
            validator={notEmptyValidator}
          />
        </InputContainer>

        <Space size={7} />

        <LabelContainer>
          <span className="label">{createMessage(AUTHOR_EMAIL)}</span>
        </LabelContainer>
        <InputContainer>
          <TextInput
            dataType="email"
            disabled={disableInput}
            errorMsg={
              !isValidEmail && !emailInputFocused
                ? "Please enter a valid email"
                : ""
            }
            fill
            isLoading={isFetchingConfig}
            onBlur={() => setEmailInputFocused(false)}
            onChange={(value) => changeHandler(AUTHOR_INFO_LABEL.EMAIL, value)}
            onFocus={() => setEmailInputFocused(true)}
            value={authorInfo.authorEmail}
          />
        </InputContainer>
      </>
    </MainContainer>
  );
}

export default UserGitProfileSettings;
