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
import { emailValidator, getTypographyByKey } from "design-system-old";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import {
  getIsFetchingGlobalGitConfig,
  getIsFetchingLocalGitConfig,
} from "selectors/gitSyncSelectors";
import { Checkbox, Input } from "design-system";

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const InputContainer = styled.div<{ isValid: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spaces[props.isValid ? 5 : 10]}px;

  & > div {
    ${(props) =>
      !props.isValid ? `border: 1px solid ${Colors.ERROR_RED};` : ""}
    input {
      ${(props) => (!props.isValid ? `color: ${Colors.ERROR_RED};` : "")}
    }
  }
`;

const MainContainer = styled.div`
  width: calc(100% - 39px);
`;

const DefaultConfigContainer = styled.div`
  display: flex;
  align-items: flex-start;
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const SectionTitle = styled.span`
  ${getTypographyByKey("u1")};
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
            data-test-id="t--use-global-config-checkbox"
            isSelected={useGlobalConfig}
            onChange={toggleUseDefaultConfig}
          >
            {createMessage(USE_DEFAULT_CONFIGURATION)}
          </Checkbox>
        </DefaultConfigContainer>
      ) : null}

      <Space size={5} />

      <>
        <LabelContainer>
          <span className="label">{createMessage(AUTHOR_NAME)}</span>
        </LabelContainer>

        <InputContainer isValid={!nameInvalid}>
          <Input
            className="t--git-config-name-input"
            errorMessage={
              nameInvalid ? createMessage(AUTHOR_NAME_CANNOT_BE_EMPTY) : ""
            }
            isDisabled={disableInput}
            // isLoading={isFetchingConfig}
            onBlur={() => setNameInputFocused(false)}
            onChange={(value: string) =>
              changeHandler(AUTHOR_INFO_LABEL.NAME, value)
            }
            onFocus={() => setNameInputFocused(true)}
            // trimValue={false}
            size="md"
            type="text"
            value={authorInfo.authorName}
          />
        </InputContainer>
        <LabelContainer>
          <span className="label">{createMessage(AUTHOR_EMAIL)}</span>
        </LabelContainer>
        <InputContainer isValid={!emailInvalid}>
          <Input
            className="t--git-config-email-input"
            errorMessage={
              emailInvalid ? createMessage(FORM_VALIDATION_INVALID_EMAIL) : ""
            }
            isDisabled={disableInput}
            // isLoading={isFetchingConfig}
            onBlur={() => setEmailInputFocused(false)}
            onChange={(value: string) =>
              changeHandler(AUTHOR_INFO_LABEL.EMAIL, value)
            }
            onFocus={() => setEmailInputFocused(true)}
            size="md"
            type="email"
            value={authorInfo.authorEmail}
          />
        </InputContainer>
      </>
    </MainContainer>
  );
}

export default UserGitProfileSettings;
