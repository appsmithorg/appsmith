import React, { useCallback, useState, useMemo } from "react";
import { Space } from "./StyledComponents";
import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  AUTHOR_NAME_CANNOT_BE_EMPTY,
  FORM_VALIDATION_INVALID_EMAIL,
  USER_PROFILE_SETTINGS_TITLE,
  USE_DEFAULT_CONFIGURATION,
  createMessage,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import TextInput, { emailValidator } from "components/ads/TextInput";
import Checkbox from "components/ads/Checkbox";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import {
  getIsFetchingGlobalGitConfig,
  getIsFetchingLocalGitConfig,
} from "selectors/gitSyncSelectors";
import { getTypographyByKey } from "constants/DefaultTheme";

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const InputContainer = styled.div<{ isValid: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spaces[props.isValid ? 7 : 12]}px;

  & > div {
    ${(props) =>
      !props.isValid ? `border: 1px solid ${Colors.ERROR_RED};` : ""}
    input {
      ${(props) => (!props.isValid ? `color: ${Colors.ERROR_RED};` : "")}
    }
  }
`;

const MainContainer = styled.div`
  width: calc(100% - 30px);
`;

const DefaultConfigContainer = styled.div`
  display: flex;
  align-items: flex-start;
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const SectionTitle = styled.span`
  ${(props) => getTypographyByKey(props, "u1")};
  text-transform: uppercase;
  color: ${Colors.GRAY_900};
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
  triedSubmit: boolean;
};

function UserGitProfileSettings({
  authorInfo,
  setAuthorInfo,
  toggleUseDefaultConfig,
  triedSubmit,
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

  const disableInput = useGlobalConfig;

  const isValidEmail = useMemo(
    () =>
      authorInfo.authorEmail && emailValidator(authorInfo.authorEmail).isValid,
    [authorInfo.authorEmail],
  );

  const isFetchingConfig =
    isFetchingGlobalGitConfig || isFetchingLocalGitConfig;

  const showDefaultConfig = !isFetchingConfig;
  const nameInvalid =
    !isFetchingConfig &&
    !useGlobalConfig &&
    !authorInfo.authorName &&
    !nameInputFocused &&
    triedSubmit;

  const emailInvalid =
    !isFetchingConfig &&
    !useGlobalConfig &&
    !isValidEmail &&
    !emailInputFocused &&
    triedSubmit;

  return (
    <MainContainer>
      <SectionTitle className="label">
        {createMessage(USER_PROFILE_SETTINGS_TITLE)}
      </SectionTitle>
      {showDefaultConfig ? (
        <DefaultConfigContainer>
          <Checkbox
            cypressSelector="t--use-global-config-checkbox"
            fill={false}
            isDefaultChecked={useGlobalConfig}
            label={createMessage(USE_DEFAULT_CONFIGURATION)}
            onCheckChange={toggleUseDefaultConfig}
          />
        </DefaultConfigContainer>
      ) : null}

      <Space size={7} />

      <>
        <LabelContainer>
          <span className="label">{createMessage(AUTHOR_NAME)}</span>
        </LabelContainer>

        <InputContainer isValid={!nameInvalid}>
          <TextInput
            className="t--git-config-name-input"
            dataType="text"
            disabled={disableInput}
            errorMsg={
              nameInvalid ? createMessage(AUTHOR_NAME_CANNOT_BE_EMPTY) : ""
            }
            fill
            isLoading={isFetchingConfig}
            onBlur={() => setNameInputFocused(false)}
            onChange={(value) => changeHandler(AUTHOR_INFO_LABEL.NAME, value)}
            onFocus={() => setNameInputFocused(true)}
            trimValue={false}
            value={authorInfo.authorName}
          />
        </InputContainer>
        <LabelContainer>
          <span className="label">{createMessage(AUTHOR_EMAIL)}</span>
        </LabelContainer>
        <InputContainer isValid={!emailInvalid}>
          <TextInput
            className="t--git-config-email-input"
            dataType="email"
            disabled={disableInput}
            errorMsg={
              emailInvalid ? createMessage(FORM_VALIDATION_INVALID_EMAIL) : ""
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
